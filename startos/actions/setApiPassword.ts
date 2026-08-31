import { utils } from '@start9labs/start-sdk'
import { eclairConf } from '../fileModels/eclair.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setApiPassword = sdk.Action.withoutInput(
  // id
  'set-api-password',

  // metadata
  async ({ effects }) => {
    const existing = await eclairConf
      .read((c) => c['api.password'])
      .const(effects)

    return {
      name: existing ? i18n('Rotate API Password') : i18n('Set API Password'),
      description: existing
        ? i18n(
            'Generate a new API password. Every client you have connected will need the new one.',
          )
        : i18n('Generate the password your Eclair clients authenticate with'),
      warning: existing
        ? i18n(
            'Eclair reads its password once at startup, so the new password takes effect when the service restarts.',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  // the execution function
  async ({ effects }) => {
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })

    await eclairConf.merge(effects, { 'api.password': password })

    return {
      version: '1',
      title: i18n('Eclair API Password'),
      message: i18n(
        'Save this somewhere safe. Clients authenticate with an empty username and this password; it is shown only now.',
      ),
      result: {
        type: 'single',
        value: password,
        copyable: true,
        masked: true,
        qr: false,
      },
    }
  },
)
