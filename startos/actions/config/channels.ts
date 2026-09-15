import { eclairConf, fullConfigSpec } from '../../fileModels/eclair.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const channels = sdk.Action.withInput(
  // id
  'channels',

  // metadata
  async ({ effects }) => ({
    name: i18n('Channel Settings'),
    description: i18n('Which channels your node is willing to open and accept'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  fullConfigSpec.filter({
    'channel.min-public-funding-satoshis': true,
    'channel.min-private-funding-satoshis': true,
    'channel.max-funding-satoshis': true,
    'channel.max-accepted-htlcs': true,
    'bitcoind.startup-locked-utxos-behavior': true,
  }),

  // optionally pre-fill the input form
  async ({ effects }) => (await eclairConf.read().once()) ?? undefined,

  // the execution function
  async ({ effects, input }) => eclairConf.merge(effects, input),
)
