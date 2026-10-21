import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.5:0',
  releaseNotes: {
    en_US: 'Updated Eclair to 0.14.5 with security hardening fixes, including issues exploitable by malicious nodes. Upstream strongly recommends upgrading; existing channels do not need to be closed. Updated the StartOS SDK. Full release notes: https://github.com/ACINQ/eclair/releases/tag/v0.14.5',
    es_ES: 'Eclair actualizado a 0.14.5 con mejoras de seguridad, incluidas correcciones de problemas explotables por nodos maliciosos. El proyecto recomienda encarecidamente actualizar; no es necesario cerrar los canales existentes. SDK de StartOS actualizado. Notas completas: https://github.com/ACINQ/eclair/releases/tag/v0.14.5',
    de_DE: 'Eclair auf 0.14.5 aktualisiert, mit Sicherheitskorrekturen für unter anderem durch bösartige Knoten ausnutzbare Schwachstellen. Das Projekt empfiehlt das Update dringend; bestehende Kanäle müssen nicht geschlossen werden. StartOS-SDK aktualisiert. Vollständige Versionshinweise: https://github.com/ACINQ/eclair/releases/tag/v0.14.5',
    pl_PL: 'Zaktualizowano Eclair do 0.14.5 z poprawkami bezpieczeństwa, w tym problemów możliwych do wykorzystania przez złośliwe węzły. Projekt zdecydowanie zaleca aktualizację; nie trzeba zamykać istniejących kanałów. Zaktualizowano SDK StartOS. Pełne informacje o wydaniu: https://github.com/ACINQ/eclair/releases/tag/v0.14.5',
    fr_FR: 'Eclair passe à la version 0.14.5 avec des correctifs de sécurité, notamment pour des problèmes exploitables par des nœuds malveillants. Le projet recommande vivement la mise à jour ; il n’est pas nécessaire de fermer les canaux existants. SDK StartOS mis à jour. Notes complètes : https://github.com/ACINQ/eclair/releases/tag/v0.14.5',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
