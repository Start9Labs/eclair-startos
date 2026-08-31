import { T } from '@start9labs/start-sdk'
import { eclairConf } from '../fileModels/eclair.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { GetInfo, apiPort } from '../utils'

export const nodeInfo = sdk.Action.withoutInput(
  // id
  'node-info',

  // metadata
  async ({ effects }) => ({
    name: i18n('Node Info'),
    description: i18n('Identity and reachability of your Eclair node'),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }): Promise<T.ActionResult & { version: '1' }> => {
    const password = await eclairConf.read((c) => c['api.password']).once()

    const res = await fetch(`http://127.0.0.1:${apiPort}/getinfo`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`:${password}`).toString('base64')}`,
      },
    })
    if (!res.ok) {
      return {
        version: '1',
        title: i18n('Node Info'),
        message: i18n('Error fetching node info'),
        result: {
          type: 'single',
          value: `${res.status} ${res.statusText}`,
          copyable: false,
          qr: false,
          masked: false,
        },
      }
    }

    const info = (await res.json()) as GetInfo

    return {
      version: '1',
      title: i18n('Node Info'),
      message: i18n('Information about your Eclair node.'),
      result: {
        type: 'group',
        value: [
          {
            name: i18n('Node Alias'),
            description: i18n('The friendly identifier for your node'),
            type: 'single',
            value: info.alias,
            copyable: true,
            qr: false,
            masked: false,
          },
          {
            name: i18n('Node Id'),
            description: i18n('The public key of your node'),
            type: 'single',
            value: info.nodeId,
            copyable: true,
            qr: true,
            masked: false,
          },
          {
            name: i18n('Node URIs'),
            description: i18n(
              'The addresses peers use to open a channel with you. Empty until your Peer interface has a public address.',
            ),
            type: 'single',
            value: info.publicAddresses.length
              ? info.publicAddresses
                  .map((a) => `${info.nodeId}@${a}`)
                  .join('\n')
              : i18n('None'),
            copyable: true,
            qr: false,
            masked: false,
          },
          {
            name: i18n('Block Height'),
            description: i18n('The chain height Eclair has processed'),
            type: 'single',
            value: String(info.blockHeight),
            copyable: false,
            qr: false,
            masked: false,
          },
        ],
      },
    }
  },
)
