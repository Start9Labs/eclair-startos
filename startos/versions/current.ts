import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.2:0',
  releaseNotes: {
    en_US: 'Initial release of Eclair for StartOS',
    es_ES: 'Lanzamiento inicial de Eclair para StartOS',
    de_DE: 'Erstveröffentlichung von Eclair für StartOS',
    pl_PL: 'Pierwsze wydanie Eclair dla StartOS',
    fr_FR: 'Version initiale d’Eclair pour StartOS',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
