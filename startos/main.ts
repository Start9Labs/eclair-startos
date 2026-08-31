import { FileHelper, T } from '@start9labs/start-sdk'
import { manifest as bitcoinManifest } from 'bitcoin-core-startos/startos/manifest'
import { eclairConf } from './fileModels/eclair.conf'
import { storeJson } from './fileModels/store.json'
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
  peerPublicAddresses,
  sleep,
} from './utils'

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
  // addresses eclair cannot announce.
  const peerAddresses = await peerPublicAddresses(effects)

  const maxHeapMib =
    (await storeJson.read((s) => s.maxHeapMib).const(effects)) ?? 1024

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
      requires: ['bitcoind-synced'],
    })
    .addHealthCheck('reachability', () =>
      conf['server.public-ips'].length
        ? null
        : {
            ready: {
              display: i18n('Node Reachability'),
              // Nothing here initializes, so the default grace period would
              // only show this as "starting" for its first 10 seconds.
              gracePeriod: 0,
              fn: () => ({
                result: 'disabled' as const,
                message: peerAddresses.length
                  ? i18n(
                      'Another Lightning service on this server is using the standard Lightning port, so peers cannot reach Eclair at your public address and it is not announced. Add a Tor address to your Peer interface to be reachable.',
                    )
                  : i18n(
                      'Your node can open channels with other nodes, but they cannot open one with you. Enable a Tor address, a public domain, or a public IP on the Peer interface to be reachable.',
                    ),
              }),
            },
            requires: ['eclair'],
          },
    )
})
