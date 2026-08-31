import { setApiPassword } from '../actions/setApiPassword'
import { eclairConf } from '../fileModels/eclair.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchCredentials = sdk.setupOnInit(async (effects) => {
  // Eclair refuses to start with the API enabled and no password, so the task
  // is critical: it blocks startup until the credential exists.
  if (!(await eclairConf.read((c) => c['api.password']).const(effects))) {
    await sdk.action.createOwnTask(effects, setApiPassword, 'critical', {
      reason: i18n(
        'Generate the password that every Eclair client authenticates with',
      ),
    })
  }
})
