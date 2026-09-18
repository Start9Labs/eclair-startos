import { socksHostId, socksPort } from 'tor-startos/startos/utils'
import { eclairConf } from '../fileModels/eclair.conf'
import { storeJson } from '../fileModels/store.json'
import { announceable, defaultPeerPort, peerPublicAddresses } from '../utils'
import { sdk } from '../sdk'

export const watchHosts = sdk.setupOnInit(async (effects) => {
  // Tor SOCKS over the bridge. The 9050 fallback keeps this a constant
  // `<osIp>:9050` across tor install/update/uninstall, so it never restarts
  // eclair on tor churn; a dead proxy is connection-refused, which only ever
  // costs an onion peer.
  const socks = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'tor',
      hostId: socksHostId,
      internalPort: socksPort,
      fallbackPort: socksPort,
    })
    .const()

  // The port setInterfaces settled on. Eclair listens on it and announces it,
  // and only addresses reachable there can go in `server.public-ips`.
  const peerPort =
    (await storeJson.read((s) => s.peerPort).const(effects)) ?? defaultPeerPort

  // A tunnel's public IP stands in for this server's own addresses: announcing both hands peers the home IP the tunnel exists to hide.
  const tunnelIp = await storeJson
    .read((s) => s.clearnetVpn?.announceIp ?? null)
    .const(effects)
  const publicIps = tunnelIp
    ? [tunnelIp]
    : announceable(await peerPublicAddresses(effects), peerPort)

  await eclairConf.merge(
    effects,
    {
      'socks5.enabled': true,
      'socks5.host': socks?.split(':')[0],
      'socks5.port': socks ? Number(socks.split(':')[1]) : undefined,
      'server.port': peerPort,
      'server.public-ips': [...new Set(publicIps)],
    },
    { allowWriteAfterConst: true },
  )
})
