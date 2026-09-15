import { eclairConf, fullConfigSpec } from '../../fileModels/eclair.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const general = sdk.Action.withInput(
  'general',

  async () => ({
    name: i18n('General Settings'),
    description: i18n('How your node presents itself on the Lightning Network'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    'node-alias': true,
    'node-color': true,
    'channel.channel-flags.announce-channel': true,
    'trampoline-payments-enable': true,
  }),

  async () => {
    const conf = await eclairConf.read().once()
    if (!conf) return undefined
    return { ...conf, 'node-color': `#${conf['node-color']}` }
  },

  async ({ effects, input }) =>
    // Eclair reads node-color with ByteVector.fromValidHex, which rejects the
    // leading # the color picker produces.
    eclairConf.merge(effects, {
      ...input,
      'node-color': input['node-color'].replace(/^#/, ''),
    }),
)
