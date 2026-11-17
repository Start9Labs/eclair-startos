import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const acknowledgeRestore = sdk.Action.withoutInput(
  'acknowledge-restore',
  async ({ effects }) => ({
    name: i18n('Start Restored Node'),
    description: i18n(
      'Confirm that this backup holds the latest state of your channels.',
    ),
    warning: i18n(
      'Start Eclair only if no other copy of this node is running and nothing ran it after this backup was taken. Eclair broadcasting an out-of-date channel state lets the peer claim the whole channel balance.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),
  async ({ effects }) => null,
)
