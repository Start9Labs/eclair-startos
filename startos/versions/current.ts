import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.6:0',
  releaseNotes: {
    en_US:
      'Updated Eclair to 0.14.6 with security hardening against malicious peers. Splices now require confirmed inputs by default. Existing channels do not need to be closed before updating. Updated start-sdk to 3.1.1. Full release notes: https://github.com/ACINQ/eclair/releases/tag/v0.14.6',
    es_ES:
      'Eclair actualizado a 0.14.6 con mejoras de seguridad contra pares maliciosos. Los splices ahora requieren entradas confirmadas por defecto. No es necesario cerrar los canales existentes antes de actualizar. start-sdk actualizado a 3.1.1. Notas completas: https://github.com/ACINQ/eclair/releases/tag/v0.14.6',
    de_DE:
      'Eclair auf 0.14.6 aktualisiert, mit Sicherheitsverbesserungen gegen bösartige Peers. Splices erfordern jetzt standardmäßig bestätigte Eingänge. Bestehende Kanäle müssen vor dem Update nicht geschlossen werden. start-sdk auf 3.1.1 aktualisiert. Vollständige Versionshinweise: https://github.com/ACINQ/eclair/releases/tag/v0.14.6',
    pl_PL:
      'Zaktualizowano Eclair do 0.14.6 z zabezpieczeniami przed złośliwymi węzłami. Splice domyślnie wymagają teraz potwierdzonych wejść. Nie trzeba zamykać istniejących kanałów przed aktualizacją. Zaktualizowano start-sdk do 3.1.1. Pełne informacje: https://github.com/ACINQ/eclair/releases/tag/v0.14.6',
    fr_FR:
      'Eclair mis à jour vers 0.14.6 avec un renforcement de la sécurité contre les pairs malveillants. Les splices exigent désormais des entrées confirmées par défaut. Il n’est pas nécessaire de fermer les canaux existants avant la mise à jour. start-sdk mis à jour vers 3.1.1. Notes complètes : https://github.com/ACINQ/eclair/releases/tag/v0.14.6',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
