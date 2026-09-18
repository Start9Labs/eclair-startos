import { FileHelper, T } from '@start9labs/start-sdk'
import { manifest as bitcoinManifest } from 'bitcoin-core-startos/startos/manifest'
import { eclairConf } from './fileModels/eclair.conf'
import { storeJson } from './fileModels/store.json'
import { vpnConfFile } from './fileModels/vpn.conf'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  BlockchainInfo,
  GetInfo,
  apiPort,
  bitcoindCookie,
  bitcoindMnt,
  bitcoindRpc,
  bitcoindWallet,
  callBitcoind,
  dataDir,
  getBitcoindBundle,
  mainMounts,
  isOnion,
  peerPorts,
  peerPublicAddresses,
  sleep,
} from './utils'
import {
  handshakeStaleMs,
  parseWireguardConfig,
  renderWgQuick,
  vpnDownScript,
  vpnIface,
  vpnUpScript,
} from './vpn'
import { mkdir, rm } from 'node:fs/promises'

export const main = sdk.setupMain(async ({ effects }) => {
  const bitcoind = await getBitcoindBundle(effects)
  await eclairConf.merge(effects, bitcoind, { allowWriteAfterConst: true })

  const conf = await eclairConf.read().const(effects)
  if (!conf?.['api.password']) {
    throw new Error(
      'No API password set — run the Set API Password action to start Eclair',
    )
  }

  // Distinguishes a Peer interface with no external address from one whose
  // addresses eclair cannot announce, and whether a Tor address pins the port.
  const peerAddresses = await peerPublicAddresses(effects)

  // A Tor address the backup had that has not come back yet also pins it.
  const peerOnionRemembered = await storeJson
    .read((s) => s.peerOnion)
    .const(effects)

  // What eclair will actually listen on and announce, as written by watchHosts.
  const peerPort = conf['server.port']

  const maxHeapMib =
    (await storeJson.read((s) => s.maxHeapMib).const(effects)) ?? 1024

  const clearnetVpn = await storeJson.read((s) => s.clearnetVpn).const(effects)
  const vpn = clearnetVpn && parseWireguardConfig(clearnetVpn.config)
  if (vpn && 'error' in vpn) {
    throw new Error(`invalid clearnet VPN configuration: ${vpn.error}`)
  }
  if (vpn) {
    await mkdir(sdk.volumes.main.subpath('./vpn'), { recursive: true })
    await vpnConfFile.write(effects, renderWgQuick(vpn.config, peerPort))
  } else {
    await rm(sdk.volumes.main.subpath(`./vpn/${vpnIface}.conf`), {
      force: true,
    })
  }

  const eclairSub = sdk.SubContainer.of(
    effects,
    { imageId: 'eclair' },
    mainMounts.mountDependency<typeof bitcoinManifest>({
      dependencyId: 'bitcoind',
      volumeId: 'main',
      mountpoint: bitcoindMnt,
      subpath: null,
      readonly: true,
    }),
    'eclair-sub',
  )

  // Eclair reads the cookie once at startup, so a rotation has to re-run main.
  // An absent cookie means bitcoind is down; treating that as a removal would
  // restart Eclair while its backend is already gone.
  const cookiePath = `${await eclairSub.rootfs}${bitcoindCookie}`
  await FileHelper.string(cookiePath)
    .read(
      (cookie) => cookie,
      (prev, next) => next === null || prev === next,
    )
    .const(effects)

  return sdk.Daemons.of(effects)
    .addOneshot('bitcoind-wallet', {
      subcontainer: null,
      exec: {
        fn: async () => {
          const rpc = await bitcoindRpc(effects, cookiePath)
          if (!rpc) throw new Error('Bitcoin is not reachable')

          const loaded = await callBitcoind<string[]>(rpc, 'listwallets', [])
          if (loaded.error) throw new Error(loaded.error.message)
          if (loaded.result.includes(bitcoindWallet)) return null

          const load = await callBitcoind(rpc, 'loadwallet', [
            bitcoindWallet,
            true,
          ])
          // -35 is "already loaded", which listwallets can miss under a race.
          if (!load.error || load.error.code === -35) return null

          const create = await callBitcoind(rpc, 'createwallet', {
            wallet_name: bitcoindWallet,
            load_on_startup: true,
          })
          if (create.error) throw new Error(create.error.message)
          return null
        },
      },
      requires: [],
    })
    .addOneshot('bitcoind-synced', {
      subcontainer: null,
      exec: {
        fn: async (_, abort) => {
          while (!abort.aborted) {
            const rpc = await bitcoindRpc(effects, cookiePath)
            const info = rpc
              ? await callBitcoind<BlockchainInfo>(
                  rpc,
                  'getblockchaininfo',
                  [],
                ).catch(() => null)
              : null

            if (
              info?.result &&
              !info.result.initialblockdownload &&
              info.result.verificationprogress > 0.999 &&
              info.result.headers - info.result.blocks <= 1
            ) {
              return null
            }
            await sleep(30_000)
          }
          return null
        },
      },
      requires: ['bitcoind-wallet'],
    })
    .addOneshot('vpn', {
      subcontainer: eclairSub,
      exec: {
        fn: async (subcontainer, abort) => {
          const res = await subcontainer.exec(
            ['sh', '-c', vpn ? vpnUpScript : vpnDownScript],
            {},
            60_000,
            { abort: abort.reason, signal: abort },
          )
          if (res.exitCode !== 0) {
            throw new Error(
              `failed to bring the clearnet VPN ${vpn ? 'up' : 'down'}: ${String(res.stderr).trim()}`,
            )
          }
          return null
        },
      },
      requires: [],
    })
    .addDaemon('eclair', {
      subcontainer: eclairSub,
      exec: {
        command: [
          '/app/eclair-node/bin/eclair-node.sh',
          `-Declair.datadir=${dataDir}`,
        ],
        env: {
          JAVA_OPTS: `-Xmx${maxHeapMib}m -Declair.printToConsole=true`,
        },
      },
      ready: {
        display: i18n('Eclair'),
        fn: async () => {
          const res = await fetch(`http://127.0.0.1:${apiPort}/getinfo`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(
                `:${conf['api.password']}`,
              ).toString('base64')}`,
            },
          }).catch(() => null)

          if (!res?.ok) {
            return {
              message: i18n('Eclair is starting'),
              result: 'starting' as const,
            }
          }

          const info = (await res.json()) as GetInfo
          return {
            message: i18n('Eclair is running at block ${height}', {
              height: String(info.blockHeight),
            }),
            result: 'success' as const,
          }
        },
      },
      requires: ['bitcoind-synced', 'vpn'],
    })
    .addHealthCheck('vpn-tunnel', () =>
      vpn
        ? {
            ready: {
              display: i18n('Clearnet VPN'),
              fn: async () => {
                let res
                try {
                  res = await eclairSub.exec(
                    ['wg', 'show', vpnIface, 'latest-handshakes'],
                    {},
                    10_000,
                  )
                } catch {
                  return { result: 'starting', message: null }
                }
                const epoch = Number(
                  String(res.stdout).trim().split(/\s+/)[1] ?? 0,
                )
                if (!epoch) {
                  return {
                    result: 'starting',
                    message: i18n('Waiting for the first WireGuard handshake.'),
                  }
                }
                const ageMs = Date.now() - epoch * 1000
                if (ageMs > handshakeStaleMs) {
                  return {
                    result: 'failure',
                    message: i18n(
                      'No WireGuard handshake for ${minutes} minutes. Clearnet traffic is held until the tunnel returns, not sent over your ISP connection.',
                      { minutes: String(Math.floor(ageMs / 60_000)) },
                    ),
                  }
                }
                return {
                  result: 'success',
                  message: i18n('Tunnel up; last handshake ${seconds}s ago.', {
                    seconds: String(Math.floor(ageMs / 1000)),
                  }),
                }
              },
            },
            requires: ['vpn'],
          }
        : null,
    )
    .addHealthCheck('reachability', () => {
      const display = i18n('Node Reachability')
      // Nothing here initializes, so the default grace period would only show
      // this as "starting" for its first 10 seconds.
      const gracePeriod = 0
      // The result cannot change until this context rebuilds, so report once
      // and then hourly rather than every second.
      const trigger = sdk.trigger.statusTrigger(3_600_000, { starting: 1_000 })

      // Clearnet addresses eclair cannot announce: reachable on a port other
      // than the one it listens on. Onions are left out — Tor fixes an onion's
      // port to the one it was created against, so it either matches or is the
      // reason the port did not move, and which of those decides the message.
      const stranded = peerAddresses.filter(
        (a) => !isOnion(a) && a.port != null && a.port !== peerPort,
      )
      if (stranded.length) {
        const [first] = stranded
        const params = {
          listening: String(peerPort),
          assigned: String(first.port),
          address: `${first.hostname}:${first.port}`,
        }
        // Not 'disabled': the user added a public address and it is not
        // working. 'disabled' means the check does not apply.
        const message = peerAddresses.some(isOnion)
          ? i18n(
              'Another service on this server holds port ${listening}, so StartOS assigned this interface external port ${assigned} and ${address} is not announced. Eclair keeps its port because your Tor address depends on it. To be reachable over clearnet, remove the Tor address from the Peer interface, wait for Eclair to move to a free port, then add a Tor address back — it will be a new .onion address.',
              params,
            )
          : peerOnionRemembered
            ? i18n(
                'StartOS assigned this interface external port ${assigned}, but Eclair listens on and announces port ${listening}, so ${address} is not announced. Eclair is keeping its port for the Tor address in its backup. Restore Tor from the same backup to bring that address back, or restart the server to let Eclair move to a free port.',
                params,
              )
            : i18n(
                'StartOS assigned this interface external port ${assigned}, but Eclair listens on and announces port ${listening}, so ${address} is not announced. If this persists, StartOS refused Eclair every port it can use (${ports}). Add a Tor address to the Peer interface to be reachable.',
                { ...params, ports: peerPorts.join(', ') },
              )
        return {
          ready: {
            display,
            gracePeriod,
            trigger,
            fn: () => ({ result: 'failure' as const, message }),
          },
          requires: ['eclair'],
        }
      }

      // Reachable somewhere. Nothing to report.
      if (conf['server.public-ips'].length) return null

      return {
        ready: {
          display,
          gracePeriod,
          trigger,
          fn: () => ({
            result: 'disabled' as const,
            message: i18n(
              'Your node can open channels with other nodes, but they cannot open one with you. Enable a Tor address, a public domain, or a public IP on the Peer interface to be reachable.',
            ),
          }),
        },
        requires: ['eclair'],
      }
    })
})
