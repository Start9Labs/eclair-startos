import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  apiHostId,
  apiInterfaceId,
  apiPort,
  peerHostId,
  peerInterfaceId,
  peerPort,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const apiOrigin = await sdk.MultiHost.of(effects, apiHostId).bindPort(
    apiPort,
    { protocol: 'http' },
  )
  const api = sdk.createInterface(effects, {
    name: i18n('API'),
    id: apiInterfaceId,
    description: i18n(
      'Eclair has no web interface. This is its JSON API, which every client, dashboard and command line tool drives the node through. Sign in with an empty username and your API password.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: '',
    path: '',
    query: {},
  })

  const peerOrigin = await sdk.MultiHost.of(effects, peerHostId).bindPort(
    peerPort,
    {
      protocol: null,
      addSsl: null,
      preferredExternalPort: peerPort,
      secure: { ssl: false },
    },
  )
  const peer = sdk.createInterface(effects, {
    name: i18n('Peer'),
    id: peerInterfaceId,
    description: i18n('Listens for incoming connections from Lightning peers.'),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await apiOrigin.export([api]), await peerOrigin.export([peer])]
})
