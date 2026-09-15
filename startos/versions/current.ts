import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.3:0',
  releaseNotes: {
    en_US:
      'Updated Eclair to 0.14.3, a recommended security-hardening release that addresses issues malicious nodes could exploit. Adds a configurable cap on funding and splice transaction feerates; existing channels remain compatible and do not need to be closed. [Full upstream release notes](https://github.com/ACINQ/eclair/releases/tag/v0.14.3)',
    es_ES:
      'Se actualizó Eclair a la versión 0.14.3, una versión recomendada de refuerzo de seguridad que corrige problemas que podrían aprovechar nodos maliciosos. Añade un límite configurable a la tasa de comisión de las transacciones de financiación y empalme; los canales existentes siguen siendo compatibles y no es necesario cerrarlos. [Notas completas de la versión upstream](https://github.com/ACINQ/eclair/releases/tag/v0.14.3)',
    de_DE:
      'Eclair wurde auf 0.14.3 aktualisiert, eine empfohlene Version zur Sicherheitshärtung, die von bösartigen Knoten ausnutzbare Probleme behebt. Fügt eine konfigurierbare Obergrenze für die Gebührenrate von Finanzierungs- und Splice-Transaktionen hinzu; bestehende Kanäle bleiben kompatibel und müssen nicht geschlossen werden. [Vollständige Upstream-Versionshinweise](https://github.com/ACINQ/eclair/releases/tag/v0.14.3)',
    pl_PL:
      'Zaktualizowano Eclair do wersji 0.14.3, zalecanego wydania wzmacniającego bezpieczeństwo, które usuwa problemy możliwe do wykorzystania przez złośliwe węzły. Dodano konfigurowalny limit stawki opłat dla transakcji finansowania i splice; istniejące kanały pozostają zgodne i nie trzeba ich zamykać. [Pełne informacje o wydaniu upstream](https://github.com/ACINQ/eclair/releases/tag/v0.14.3)',
    fr_FR:
      'Mise à jour d’Eclair vers la version 0.14.3, une version recommandée de renforcement de la sécurité qui corrige des problèmes exploitables par des nœuds malveillants. Ajoute un plafond configurable au taux de frais des transactions de financement et de splice ; les canaux existants restent compatibles et ne doivent pas être fermés. [Notes de version complètes en amont](https://github.com/ACINQ/eclair/releases/tag/v0.14.3)',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
