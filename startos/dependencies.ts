import { autoconfig } from 'bitcoin-core-startos/startos/actions/config/autoconfig'
import { i18n } from './i18n'
import { depBitcoindDescription } from './manifest/i18n'
import { sdk } from './sdk'

const bitcoind = sdk.Dependency.required('bitcoind', {
  description: depBitcoindDescription,
  metadata: {
    title: 'Bitcoin',
    icon: 'https://raw.githubusercontent.com/Start9Labs/bitcoin-core-startos/feec0b1dae42961a257948fe39b40caf8672fce1/dep-icon.svg',
  },
  versionRange: '>=31.1:0',
  kind: 'running',
  healthChecks: ['bitcoind', 'sync-progress'],
}).withInit(async (effects) => {
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
})

export const dependencies = sdk.Dependencies.of().addDependency(bitcoind)
