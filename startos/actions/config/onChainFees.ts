import { eclairConf, fullConfigSpec } from '../../fileModels/eclair.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const onChainFees = sdk.Action.withInput(
  'on-chain-fees',

  async () => ({
    name: i18n('On-Chain Fees'),
    description: i18n(
      'What your node pays to open and close channels on the blockchain',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    'on-chain-fees.confirmation-priority.funding': true,
    'on-chain-fees.confirmation-priority.closing': true,
    'on-chain-fees.max-closing-feerate': true,
    'on-chain-fees.max-funding-feerate': true,
  }),

  async () => (await eclairConf.read().once()) ?? undefined,

  async ({ effects, input }) => eclairConf.merge(effects, input),
)
