import { autoconfig } from 'bitcoin-core-startos/startos/actions/config/autoconfig'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  await sdk.action.createTask(effects, 'bitcoind', autoconfig, 'critical', {
    input: {
      kind: 'partial',
      accept: [{ zmqEnabled: true, txindex: true, prune: 0 }],
      set: { zmqEnabled: true, txindex: true, prune: 0 },
    },
    reason: i18n(
      'Eclair needs ZeroMQ and a full, transaction-indexed Bitcoin node',
    ),
    when: { condition: 'input-not-matches', once: false },
  })

  return {
    bitcoind: {
      kind: 'running',
      versionRange: '>=31.0:14',
      healthChecks: ['bitcoind', 'sync-progress'],
    },
  }
})
