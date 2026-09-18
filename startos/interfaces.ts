import { T } from '@start9labs/start-sdk'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import {
  apiHostId,
  apiInterfaceId,
  apiPort,
  peerHasOnion,
  peerHostId,
  peerInterfaceId,
  peerPorts,
} from './utils'

/**
 * Bind the Peer interface to a port eclair can actually announce.
 *
 * Eclair appends `server.port` to every entry of `server.public-ips` and cannot
 * express a per-address port, so the port it listens on must equal the external
 * port StartOS assigned — otherwise the clearnet address is dropped and the node
 * is reachable over Tor only. LND's `externalip` and CLN's `announce-addr` carry
 * a port per entry and can announce one port while listening on another; eclair
 * has no equivalent.
 *
 * `preferredExternalPort` is a preference. When another service already holds
 * the port, StartOS assigns an ephemeral one instead and never migrates back —
 * not when that service is uninstalled, not on restart. The assignment is fixed
 * for the life of the binding and keyed on the *internal* port, so the only way
 * to obtain a matched pair is to bind a different internal port: that is a new
 * binding, and a new binding does get its preference honoured. So `peerPorts`
 * are bound in turn, each read back through `getServicePortForward` — which
 * sees the bind, since StartOS persists the assignment before `bind` returns —
 * until one is granted, all within this pass: eclair only ever hears the final
 * answer. A refused attempt stays bound until the next pass disables it, and
 * its external claim is permanent either way, which is why the settled port
 * rather than 9735 leads every later pass.
 *
 * A Tor address pins the port. Tor forwards an onion to the internal port it
 * was created against and fixes the onion's virtual port there, so moving would
 * take the onion dark and out of the announcement — the path that was working.
 * With an onion present a refusal is accepted as-is and Node Reachability
 * explains the trade; removing the onion lets the next pass move, and an onion
 * added afterwards is created against the new port.
 *
 * On the first pass after a restore the onion cannot be seen: the host is
 * created empty, and Tor re-exports the address only once this package has
 * bound — after a move would already have happened. So each pass that can see
 * the host records whether the interface carries an onion, the backup carries
 * the record, and a pass that finds a host with no bindings yet pins on the
 * record instead. If the onion never returns, Eclair stays put until the next
 * container init, and Node Reachability says so.
 *
 * The settled port is verified every pass rather than trusted: the store
 * travels with a backup, and a restore onto a server where that port is held
 * must settle again.
 */
const bindPeerPort = async (effects: T.Effects) => {
  const stored = await storeJson.read((s) => s.peerPort).const(effects)
  const remembered = (await storeJson.read((s) => s.peerOnion).once()) ?? false
  const hostBound = await sdk.host
    .getOwn(
      effects,
      peerHostId,
      (host) => !!host && Object.keys(host.bindings).length > 0,
    )
    .once()
  const onion = await peerHasOnion(effects)
  const pinned = onion || (!hostBound && remembered)
  const multi = sdk.MultiHost.of(effects, peerHostId)

  const bind = (port: number) =>
    multi.bindPort(port, {
      protocol: null,
      addSsl: null,
      preferredExternalPort: port,
      secure: { ssl: false },
    })
  const granted = async (port: number) =>
    (
      await sdk.getServicePortForward(effects, {
        hostId: peerHostId,
        internalPort: port,
      })
    )?.assignedPort ?? null

  const [first, ...rest] =
    stored == null
      ? peerPorts
      : [stored, ...peerPorts.filter((p) => p !== stored)]
  let port = first
  let origin = await bind(port)
  for (const next of rest) {
    if (pinned || (await granted(port)) === port) break
    port = next
    origin = await bind(port)
  }

  const seen = hostBound ? onion : remembered
  if (port !== stored || seen !== remembered) {
    await storeJson.merge(
      effects,
      { peerPort: port, peerOnion: seen },
      { allowWriteAfterConst: true },
    )
  }
  return origin
}

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const apiOrigin = await sdk.MultiHost.of(effects, apiHostId).bindPort(
    apiPort,
    { protocol: 'http' },
  )
  const api = sdk.createInterface(effects, {
    name: i18n('API'),
    id: apiInterfaceId,
    description: i18n(
      'Eclair has no web interface. This is its JSON API, which every client, dashboard and command line tool drives the node through. Sign in with an empty username and your API password.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: '',
    path: '',
    query: {},
  })

  const peerOrigin = await bindPeerPort(effects)
  const peer = sdk.createInterface(effects, {
    name: i18n('Peer'),
    id: peerInterfaceId,
    description: i18n('Listens for incoming connections from Lightning peers.'),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await apiOrigin.export([api]), await peerOrigin.export([peer])]
})
