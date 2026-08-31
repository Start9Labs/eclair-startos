import { socksHostId, socksPort } from 'tor-startos/startos/utils'
import { eclairConf } from '../fileModels/eclair.conf'
import { announceable, peerPublicAddresses } from '../utils'
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

  const publicIps = announceable(await peerPublicAddresses(effects))

  await eclairConf.merge(
    effects,
    {
      'socks5.enabled': true,
      'socks5.host': socks?.split(':')[0],
      'socks5.port': socks ? Number(socks.split(':')[1]) : undefined,
      'server.public-ips': [...new Set(publicIps)],
    },
    { allowWriteAfterConst: true },
  )
})
