import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.6:2',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. Enables dependent services to connect without access to Eclair’s seeds or other private files. This protection requires updates to those services; updating Eclair alone does not remove their existing access.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Permite que los servicios dependientes se conecten sin acceso a las semillas de Eclair ni a otros archivos privados. Esta protección requiere actualizar esos servicios; actualizar solo Eclair no elimina su acceso existente.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Ermöglicht abhängigen Diensten die Verbindung ohne Zugriff auf Eclairs Seeds oder andere private Dateien. Dieser Schutz erfordert Updates dieser Dienste; ein Update von Eclair allein entzieht ihnen den bestehenden Zugriff nicht.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Umożliwia zależnym usługom łączenie się bez dostępu do seedów Eclair ani innych prywatnych plików. Ta ochrona wymaga aktualizacji tych usług; aktualizacja samego Eclair nie odbiera im dotychczasowego dostępu.',
    fr_FR:
      "Nécessite StartOS 0.4.1 ou une version ultérieure. Permet aux services dépendants de se connecter sans accès aux seeds d'Eclair ni aux autres fichiers privés. Cette protection nécessite des mises à jour de ces services ; mettre à jour Eclair seul ne supprime pas leur accès existant.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
