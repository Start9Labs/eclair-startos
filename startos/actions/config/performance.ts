import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

const { InputSpec, Value } = sdk

export const performance = sdk.Action.withInput(
  // id
  'performance',

  // metadata
  async ({ effects }) => ({
    name: i18n('Performance'),
    description: i18n('How much memory Eclair may use'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  InputSpec.of({
    maxHeapMib: Value.number({
      name: i18n('Maximum Heap Size'),
      description: i18n(
        'Ceiling on the memory Eclair may allocate. A node with many channels needs more; too low and Eclair stops with an out-of-memory error.',
      ),
      required: true,
      default: 1024,
      min: 256,
      integer: true,
      units: i18n('MiB'),
    }),
  }),

  // optionally pre-fill the input form
  async ({ effects }) => (await storeJson.read().once()) ?? undefined,

  // the execution function
  async ({ effects, input }) => storeJson.merge(effects, input),
)
