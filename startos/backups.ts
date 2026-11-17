import { acknowledgeRestore } from './actions/acknowledgeRestore'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('main')
      .setOptions({
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
      })
      .setPostRestore(async (effects) => {
        await sdk.action.createOwnTask(
          effects,
          acknowledgeRestore,
          'critical',
          {
            reason: i18n(
              'This channel database came from a backup. If this node ran anywhere after the backup was taken, its channel state is out of date and starting Eclair can lose the funds in those channels.',
            ),
          },
        )
      }),
)
