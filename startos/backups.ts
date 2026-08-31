import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('main').setOptions({
      exclude: [
        // The gossip graph, which Eclair re-downloads from its peers, and the
        // logs. Everything else — the seeds, the channel database and the
        // audit history — is what a restore needs, and StartOS stops the
        // service before copying it.
        'mainnet/network.sqlite',
        'mainnet/network.sqlite-shm',
        'mainnet/network.sqlite-wal',
        'eclair.log',
        'notifications.log',
      ],
    }),
)
