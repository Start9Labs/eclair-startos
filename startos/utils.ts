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
export const peerPort = 9735

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

/**
 * The Peer interface's externally reachable addresses, each `host:port`, with
 * StartOS domains dropped — eclair accepts at most one DNS hostname and refuses
 * to start on a second.
 */
export const peerPublicAddresses = (effects: T.Effects) =>
  sdk.host
    .getOwn(effects, peerHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === peerInterfaceId)
      if (!iface) return []
      return iface.addressInfo.public
        .filter({ exclude: { kind: 'domain' } })
        .format()
    })
    .const()

/**
 * Eclair appends `server.port` to every entry of `server.public-ips`, so an
 * address reachable on any other port would be announced wrong. Tor maps the
 * onion's virtual port itself and always matches; a clearnet address matches
 * only while StartOS has granted the Peer interface external port 9735.
 */
export const announceable = (addresses: string[]) =>
  addresses
    .filter((a) => a.endsWith(`:${peerPort}`))
    .map((a) => a.slice(0, a.lastIndexOf(':')))

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
