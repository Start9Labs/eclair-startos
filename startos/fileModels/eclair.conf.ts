import { FileHelper, z } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { apiPort, bitcoindCookie, bitcoindWallet, peerPort } from '../utils'

const { InputSpec, Value } = sdk

/**
 * eclair.conf is HOCON, of which JSON is a subset, so the file is written as
 * JSON and eclair's own parser reads it unchanged. The `eclair.` prefix and the
 * nesting are stripped on read so the rest of the package addresses settings by
 * their documented dotted path.
 */
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

function flatten(
  value: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  return Object.entries(value).reduce<Record<string, unknown>>(
    (acc, [k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k
      if (isPlainObject(v)) Object.assign(acc, flatten(v, key))
      else acc[key] = v
      return acc
    },
    {},
  )
}

function nest(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [path, v] of Object.entries(value)) {
    if (v === undefined || v === null) continue
    const parts = path.split('.')
    let cursor = out
    for (const part of parts.slice(0, -1)) {
      if (!isPlainObject(cursor[part])) cursor[part] = {}
      cursor = cursor[part] as Record<string, unknown>
    }
    cursor[parts[parts.length - 1]] = v
  }
  return { eclair: out }
}

const optionalString = z.string().optional().catch(undefined)
const optionalNumber = z.number().optional().catch(undefined)
// `nest` drops a cleared form number instead of writing a HOCON null.
const formNumber = z.number().nullable().catch(null)

export const shape = z.object({
  chain: z.literal('mainnet').catch('mainnet'),
  'server.binding-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'server.port': z.literal(peerPort).catch(peerPort),
  'api.enabled': z.literal(true).catch(true),
  'api.binding-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'api.port': z.literal(apiPort).catch(apiPort),
  'bitcoind.auth': z.literal('safecookie').catch('safecookie'),
  'bitcoind.cookie': z.literal(bitcoindCookie).catch(bitcoindCookie),
  'bitcoind.wallet': z.literal(bitcoindWallet).catch(bitcoindWallet),
  'bitcoind.rpcuser': z.undefined().catch(undefined),
  'bitcoind.rpcpassword': z.undefined().catch(undefined),
  // Upstream polls bitcoinheaders.net, blockcypher.com, blockstream.info and
  // mempool.space to detect an eclipsed bitcoind. An empty list is the only
  // value that makes no outbound request.
  'blockchain-watchdog.sources': z.tuple([]).catch([]),

  'bitcoind.host': optionalString,
  'bitcoind.rpcport': optionalNumber,
  'bitcoind.zmqblock': optionalString,
  'bitcoind.zmqtx': optionalString,
  'socks5.enabled': z.boolean().catch(true),
  'socks5.host': optionalString,
  'socks5.port': optionalNumber,
  'server.public-ips': z.array(z.string()).catch([]),

  'api.password': z.string().catch(''),

  'node-alias': z.string().catch('eclair'),
  'node-color': z.string().catch('49daaa'),
  'channel.channel-flags.announce-channel': z.boolean().catch(true),

  'relay.fees.public-channels.fee-base-msat': formNumber,
  'relay.fees.public-channels.fee-proportional-millionths': formNumber,
  'relay.fees.private-channels.fee-base-msat': formNumber,
  'relay.fees.private-channels.fee-proportional-millionths': formNumber,

  'on-chain-fees.confirmation-priority.funding': z
    .enum(['slow', 'medium', 'fast'])
    .catch('medium'),
  'on-chain-fees.confirmation-priority.closing': z
    .enum(['slow', 'medium', 'fast'])
    .catch('medium'),
  'on-chain-fees.max-closing-feerate': formNumber,
  'on-chain-fees.max-funding-feerate': formNumber,

  'channel.min-public-funding-satoshis': formNumber,
  'channel.min-private-funding-satoshis': formNumber,
  'channel.max-funding-satoshis': formNumber,
  'channel.max-accepted-htlcs': formNumber,
  'bitcoind.startup-locked-utxos-behavior': z
    .enum(['stop', 'unlock', 'ignore'])
    .catch('stop'),
  'trampoline-payments-enable': z.boolean().catch(false),
})

export type EclairConf = z.infer<typeof shape>

export const eclairConf = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'eclair.conf' },
  shape,
  {
    onRead: (raw) =>
      flatten(
        ((raw as Record<string, unknown>).eclair ?? {}) as Record<
          string,
          unknown
        >,
      ),
    onWrite: (value) => nest(value),
  },
)

export const fullConfigSpec = InputSpec.of({
  'node-alias': Value.text({
    name: i18n('Alias'),
    default: 'eclair',
    required: true,
    description: i18n('The public, human-readable name of your Lightning node'),
    patterns: [
      {
        regex: '^.{1,32}$',
        description: i18n('Must be between 1 and 32 characters'),
      },
    ],
  }),
  'node-color': Value.color({
    name: i18n('Color'),
    default: '#49daaa',
    required: true,
    description: i18n('The public color dot of your Lightning node'),
  }),
  'channel.channel-flags.announce-channel': Value.toggle({
    name: i18n('Announce Channels'),
    default: true,
    description: i18n(
      'Announce new channels to the Lightning Network so others can route payments through your node. Turn this off to run an unannounced node whose channels stay private.',
    ),
  }),
  'relay.fees.public-channels.fee-base-msat': Value.number({
    name: i18n('Public Channel Base Fee'),
    description: i18n(
      'Flat fee charged for each payment you route through an announced channel',
    ),
    required: false,
    default: null,
    min: 0,
    integer: true,
    units: i18n('millisatoshis'),
    footnote: `${i18n('Default')}: 1000`,
  }),
  'relay.fees.public-channels.fee-proportional-millionths': Value.number({
    name: i18n('Public Channel Fee Rate'),
    description: i18n(
      'Fee charged per satoshi routed through an announced channel, in millionths of a satoshi',
    ),
    required: false,
    default: null,
    min: 0,
    integer: true,
    units: i18n('ppm'),
    footnote: `${i18n('Default')}: 200`,
  }),
  'relay.fees.private-channels.fee-base-msat': Value.number({
    name: i18n('Private Channel Base Fee'),
    description: i18n(
      'Flat fee charged for each payment you route through an unannounced channel',
    ),
    required: false,
    default: null,
    min: 0,
    integer: true,
    units: i18n('millisatoshis'),
    footnote: `${i18n('Default')}: 1000`,
  }),
  'relay.fees.private-channels.fee-proportional-millionths': Value.number({
    name: i18n('Private Channel Fee Rate'),
    description: i18n(
      'Fee charged per satoshi routed through an unannounced channel, in millionths of a satoshi',
    ),
    required: false,
    default: null,
    min: 0,
    integer: true,
    units: i18n('ppm'),
    footnote: `${i18n('Default')}: 100`,
  }),
  'on-chain-fees.confirmation-priority.funding': Value.select({
    name: i18n('Funding Confirmation Priority'),
    description: i18n('How fast channel funding transactions should confirm'),
    default: 'medium',
    values: {
      slow: i18n('Slow'),
      medium: i18n('Medium'),
      fast: i18n('Fast'),
    },
  }),
  'on-chain-fees.confirmation-priority.closing': Value.select({
    name: i18n('Closing Confirmation Priority'),
    description: i18n('How fast channel closing transactions should confirm'),
    default: 'medium',
    values: {
      slow: i18n('Slow'),
      medium: i18n('Medium'),
      fast: i18n('Fast'),
    },
  }),
  'on-chain-fees.max-closing-feerate': Value.number({
    name: i18n('Maximum Closing Feerate'),
    description: i18n(
      'Ceiling on the feerate used to reclaim funds that are not at risk when a channel closes. Closing transactions will not confirm while the mempool demands more than this, so raise it when you need the funds back in a hurry.',
    ),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: i18n('sats/vB'),
    footnote: `${i18n('Default')}: 10`,
  }),
  'on-chain-fees.max-funding-feerate': Value.number({
    name: i18n('Maximum Funding Feerate'),
    description: i18n(
      'Ceiling on the feerate used for funding and splice transactions. This protects against inaccurate fee estimates, but opens and splices will not confirm when the mempool demands more. Raise it or use RBF when they stall.',
    ),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: i18n('sats/vB'),
    footnote: `${i18n('Default')}: 50`,
  }),
  'channel.min-public-funding-satoshis': Value.number({
    name: i18n('Minimum Announced Channel Size'),
    description: i18n('Smallest announced channel your node will accept'),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: i18n('satoshis'),
    footnote: `${i18n('Default')}: 100000`,
  }),
  'channel.min-private-funding-satoshis': Value.number({
    name: i18n('Minimum Unannounced Channel Size'),
    description: i18n('Smallest unannounced channel your node will accept'),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: i18n('satoshis'),
    footnote: `${i18n('Default')}: 100000`,
  }),
  'channel.max-funding-satoshis': Value.number({
    name: i18n('Maximum Channel Size'),
    description: i18n('Largest channel your node will accept'),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: i18n('satoshis'),
    footnote: `${i18n('Default')}: 5000000000`,
  }),
  'channel.max-accepted-htlcs': Value.number({
    name: i18n('Maximum Accepted HTLCs'),
    description: i18n(
      'How many payments may be in flight in each direction on a channel at once',
    ),
    required: false,
    default: null,
    min: 1,
    max: 483,
    integer: true,
    footnote: `${i18n('Default')}: 30`,
  }),
  'bitcoind.startup-locked-utxos-behavior': Value.select({
    name: i18n('Locked UTXO Behavior'),
    description: i18n(
      'What to do when coins are still locked from a channel funding that was interrupted. Stop refuses to start until you unlock them yourself; Unlock releases them automatically; Ignore starts and leaves them locked.',
    ),
    default: 'stop',
    values: {
      stop: i18n('Stop'),
      unlock: i18n('Unlock'),
      ignore: i18n('Ignore'),
    },
  }),
  'trampoline-payments-enable': Value.toggle({
    name: i18n('Trampoline Payments'),
    default: false,
    description: i18n(
      'Relay trampoline payments, letting light wallets that cannot compute a full route pay through your node',
    ),
  }),
})
