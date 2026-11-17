import { eclairConf, fullConfigSpec } from '../../fileModels/eclair.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const paymentSettings = sdk.Action.withInput(
  'payment-settings',
  async ({ effects }) => ({
    name: i18n('Payment Settings'),
    description: i18n('How much this node may pay to send a payment'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({
    'router.path-finding.default.boundaries.max-fee-flat-sat': true,
    'router.path-finding.default.boundaries.max-fee-proportional-percent': true,
  }),
  async ({ effects }) => (await eclairConf.read().once()) ?? undefined,
  async ({ effects, input }) => eclairConf.merge(effects, input),
)
