import { T } from '@start9labs/start-sdk'
import {
  rpcHostId as btcRpcHostId,
  rpcPort as btcRpcPort,
  zmqHostId as btcZmqHostId,
  zmqPortBlock as btcZmqPortBlock,
  zmqPortTransaction as btcZmqPortTransaction,
} from 'bitcoin-core-startos/startos/utils'
import { sdk } from './sdk'

export const apiPort = 8080

/**
 * The Lightning standard peer port, and the first port this package asks
 * StartOS to assign the Peer interface. It is a preference, not a guarantee —
 * see `bindPeerPort` in interfaces.ts.
 */
export const defaultPeerPort = 9735

/**
 * The band a replacement peer port is drawn from. The lower bound is the first
 * port an unprivileged claimant may take (StartOS refuses <= 1024); the upper
 * bound stops one short of StartOS's own ephemeral range, whose ports it hands
 * out at random to anyone who doesn't ask for a specific number — a candidate
 * drawn from in there would be racing those allocations.
 */
const peerPortMin = 1025
const peerPortMax = 49151

/**
 * A fresh candidate peer port, excluding any already tried. Uniform over a
 * ~48,000-port band against the handful a server actually uses, so the first
 * draw is granted except on a pathologically crowded box. Never this package's
 * own API port: ports are container-local, and eclair binding both on one
 * number fails to start. Anything StartOS itself won't grant simply comes back
 * refused and is redrawn.
 */
export const pickPeerPort = (exclude: readonly number[] = []): number => {
  const span = peerPortMax - peerPortMin + 1
  for (let i = 0; i < 100; i++) {
    const port = peerPortMin + Math.floor(Math.random() * span)
    if (port !== apiPort && !exclude.includes(port)) return port
  }
  throw new Error('could not find an untried peer port candidate')
}

export const apiHostId = 'api'
export const peerHostId = 'peer'
export const apiInterfaceId = 'api'
export const peerInterfaceId = 'peer'

export const dataDir = '/data'
export const chainDir = `${dataDir}/mainnet`
export const bitcoindMnt = '/mnt/bitcoin'
export const bitcoindCookie = `${bitcoindMnt}/.cookie`

/** The Bitcoin Core wallet this package creates and eclair funds channels from. */
export const bitcoindWallet = 'eclair'

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: dataDir,
  readonly: false,
})

/**
 * bitcoind's RPC and ZMQ addresses for eclair.conf. Each is its own `.const()`
 * on a single string, so main re-runs only when an address eclair uses actually
 * changes, not on every bitcoind update. Absent until bitcoind's bindings
 * resolve; writing undefined then clears the keys rather than latching a stale
 * address.
 */
export const getBitcoindBundle = async (effects: T.Effects) => {
  const zmqAddr = (internalPort: number) =>
    sdk.host
      .getBridgeAddress(effects, {
        packageId: 'bitcoind',
        hostId: btcZmqHostId,
        internalPort,
      })
      .const()

  const rpc = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'bitcoind',
      hostId: btcRpcHostId,
      internalPort: btcRpcPort,
      ssl: false,
    })
    .const()
  const block = await zmqAddr(btcZmqPortBlock)
  const tx = await zmqAddr(btcZmqPortTransaction)

  return {
    'bitcoind.host': rpc?.split(':')[0],
    'bitcoind.rpcport': rpc ? Number(rpc.split(':')[1]) : undefined,
    'bitcoind.zmqblock': block ? `tcp://${block}` : undefined,
    'bitcoind.zmqtx': tx ? `tcp://${tx}` : undefined,
  }
}

const peerInterface = (
  host: Parameters<Parameters<typeof sdk.host.getOwn>[2]>[0],
) =>
  host &&
  Object.values(host.bindings)
    .flatMap((b) => Object.values(b.interfaces))
    .find((i) => i.id === peerInterfaceId)

/** A Tor address the Tor package published for the interface. */
export const isOnion = (a: T.HostnameInfo) =>
  a.metadata.kind === 'plugin' && a.metadata.packageId === 'tor'

/**
 * The Peer interface's externally reachable addresses, with StartOS domains
 * dropped — eclair accepts at most one DNS hostname and refuses to start on a
 * second.
 */
export const peerPublicAddresses = (effects: T.Effects) =>
  sdk.host
    .getOwn(effects, peerHostId, (host) => {
      const iface = peerInterface(host)
      if (!iface) return []
      return iface.addressInfo.public
        .filter({ exclude: { kind: 'domain' } })
        .format('hostname-info')
    })
    .const()

/**
 * Whether the Peer interface carries a Tor address. A boolean, so a caller
 * re-runs only when an onion appears or disappears, not on every address edit.
 */
export const peerHasOnion = (effects: T.Effects) =>
  sdk.host
    .getOwn(effects, peerHostId, (host) => {
      const iface = peerInterface(host)
      return (
        !!iface &&
        iface.addressInfo.public
          .filter({ predicate: isOnion })
          .format('hostname-info').length > 0
      )
    })
    .const()

/**
 * Eclair appends `server.port` to every entry of `server.public-ips`, so an
 * address reachable on any other port would be announced wrong; it is dropped
 * instead. `peerPort` is the port eclair both listens on and announces. Once
 * `bindPeerPort` has matched it to the external port StartOS granted, every
 * address passes; one that does not is what Node Reachability reports.
 */
export const announceable = (
  addresses: readonly T.HostnameInfo[],
  peerPort: number,
) => addresses.filter((a) => a.port === peerPort).map((a) => a.hostname)

export type BitcoindRpc = {
  url: string
  auth: string
}

/** bitcoind's JSON-RPC endpoint, authenticated with the cookie eclair also reads. */
export async function bitcoindRpc(
  effects: T.Effects,
  cookiePath: string,
): Promise<BitcoindRpc | null> {
  const addr = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'bitcoind',
      hostId: btcRpcHostId,
      internalPort: btcRpcPort,
      ssl: false,
    })
    .const()
  if (!addr) return null

  const cookie = await import('fs/promises')
    .then((fs) => fs.readFile(cookiePath, 'utf-8'))
    .catch(() => null)
  if (!cookie) return null

  return {
    url: `http://${addr}/`,
    auth: Buffer.from(cookie.trim()).toString('base64'),
  }
}

export type RpcError = { code: number; message: string }

export async function callBitcoind<A>(
  rpc: BitcoindRpc,
  method: string,
  params: unknown,
): Promise<{ result: A; error: null } | { result: null; error: RpcError }> {
  const res = await fetch(rpc.url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${rpc.auth}`,
      'content-type': 'text/plain',
    },
    body: JSON.stringify({
      jsonrpc: '1.0',
      id: 'eclair-startos',
      method,
      params,
    }),
  })
  return res.json() as Promise<
    { result: A; error: null } | { result: null; error: RpcError }
  >
}

export type GetInfo = {
  nodeId: string
  alias: string
  color: string
  blockHeight: number
  publicAddresses: string[]
}

export type BlockchainInfo = {
  blocks: number
  headers: number
  initialblockdownload: boolean
  verificationprogress: number
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
