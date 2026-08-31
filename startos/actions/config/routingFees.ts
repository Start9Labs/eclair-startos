import { eclairConf, fullConfigSpec } from '../../fileModels/eclair.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const routingFees = sdk.Action.withInput(
  // id
  'routing-fees',

  // metadata
  async ({ effects }) => ({
    name: i18n('Routing Fees'),
    description: i18n(
      'What you charge to route payments through your channels',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  fullConfigSpec.filter({
    'relay.fees.public-channels.fee-base-msat': true,
    'relay.fees.public-channels.fee-proportional-millionths': true,
    'relay.fees.private-channels.fee-base-msat': true,
    'relay.fees.private-channels.fee-proportional-millionths': true,
  }),

  // optionally pre-fill the input form
  async ({ effects }) => (await eclairConf.read().const(effects)) ?? undefined,

  // the execution function
  async ({ effects, input }) => eclairConf.merge(effects, input),
)
