import { lookup } from 'node:dns/promises'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { isHostPort, parseWireguardConfig } from '../vpn'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  config: Value.textarea({
    name: i18n('WireGuard Configuration'),
    description: i18n(
      'The WireGuard client configuration for the tunnel. Leave it empty to turn the VPN off.',
    ),
    required: false,
    default: null,
    minRows: 8,
    maxRows: 14,
  }),
  announce: Value.text({
    name: i18n('Public Address'),
    description: i18n(
      'The address peers reach this node at through the tunnel, as host:port. Eclair listens on that port and announces it.',
    ),
    required: false,
    default: null,
    placeholder: 'vpn.example.com:9735',
  }),
})

// Hidden: a companion service that owns a tunnel (e.g. TunnelSats) raises it as a task with the input filled in.
export const clearnetVpn = sdk.Action.withInput(
  'clearnet-vpn',
  async ({ effects }) => ({
    name: i18n('Clearnet VPN'),
    description: i18n(
      "Route this node's clearnet traffic through a WireGuard tunnel and advertise the tunnel's public address.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),
  inputSpec,
  async ({ effects }) => {
    const vpn = await storeJson.read((s) => s.clearnetVpn).const(effects)
    return { config: vpn?.config ?? null, announce: vpn?.announce ?? null }
  },
  async ({ effects, input }) => {
    if (!input.config?.trim()) {
      await storeJson.merge(effects, { clearnetVpn: null })
      return null
    }
    const parsed = parseWireguardConfig(input.config)
    if ('error' in parsed) {
      throw new Error(
        parsed.error === 'line'
          ? i18n('Unrecognized line in the WireGuard configuration: ${line}', {
              line: parsed.line,
            })
          : parsed.error === 'interface'
            ? i18n(
                'The WireGuard configuration needs a PrivateKey and an Address under [Interface].',
              )
            : parsed.error === 'peer'
              ? i18n(
                  'The WireGuard configuration needs exactly one [Peer] with a PublicKey and an Endpoint.',
                )
              : i18n(
                  'AllowedIPs must include 0.0.0.0/0 so that all clearnet traffic uses the tunnel.',
                ),
      )
    }
    const announce = input.announce?.trim() ?? ''
    if (!isHostPort(announce)) {
      throw new Error(i18n('The public address must be host:port.'))
    }
    const host = announce
      .slice(0, announce.lastIndexOf(':'))
      .replace(/^\[|\]$/g, '')
    const port = Number(announce.slice(announce.lastIndexOf(':') + 1))
    // Eclair announces IPs, not names, and one port for every address.
    const announceIp = await lookup(host, { family: 4 })
      .then((r) => r.address)
      .catch(() => {
        throw new Error(
          i18n('The public address host does not resolve: ${host}', { host }),
        )
      })
    await storeJson.merge(effects, {
      clearnetVpn: { config: input.config, announce, announceIp },
      peerPort: port,
    })
    return null
  },
)
