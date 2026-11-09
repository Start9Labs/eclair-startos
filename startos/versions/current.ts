import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.6:2',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. Services that depend on Eclair now receive only its API password, and can no longer read its seeds or other files.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Los servicios que dependen de Eclair ahora solo reciben su contraseña de API y ya no pueden leer sus semillas ni sus demás archivos.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Dienste, die von Eclair abhängen, erhalten jetzt nur noch dessen API-Passwort und können seine Seeds und übrigen Dateien nicht mehr lesen.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Usługi zależne od Eclair otrzymują teraz tylko jego hasło API i nie mogą już odczytać jego seedów ani innych plików.',
    fr_FR:
      "Nécessite StartOS 0.4.1 ou une version ultérieure. Les services qui dépendent d'Eclair ne reçoivent plus que son mot de passe d'API et ne peuvent plus lire ses seeds ni ses autres fichiers.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
