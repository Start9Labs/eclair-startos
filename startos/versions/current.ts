import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.4:0',
  releaseNotes: {
    en_US: `Updated Eclair to 0.14.4 with security fixes against malicious peers and forged browser API requests, plus fixes for channel funding, splicing and payment settlement.

**Compatibility:** The API rejects requests carrying an Origin header, including browser API and WebSocket connections. Browser front-ends must use their own backend. Command-line clients and StartOS actions are unaffected. Existing channels do not need to be closed before updating.

[Full release notes](https://github.com/ACINQ/eclair/blob/v0.14.4/docs/release-notes/eclair-v0.14.4.md)`,
    es_ES: `Eclair se actualiza a 0.14.4 con correcciones de seguridad contra pares maliciosos y solicitudes API falsificadas desde navegadores, además de correcciones en la financiación de canales, el splicing y la liquidación de pagos.

**Compatibilidad:** La API rechaza las solicitudes con una cabecera Origin, incluidas las conexiones API y WebSocket desde navegadores. Las interfaces web deben usar su propio backend. Los clientes de línea de comandos y las acciones de StartOS no se ven afectados. No es necesario cerrar los canales existentes antes de actualizar.

[Notas completas de la versión](https://github.com/ACINQ/eclair/blob/v0.14.4/docs/release-notes/eclair-v0.14.4.md)`,
    de_DE: `Eclair wurde auf 0.14.4 aktualisiert, mit Sicherheitskorrekturen gegen bösartige Peers und gefälschte Browser-API-Anfragen sowie Korrekturen bei Kanalfinanzierung, Splicing und Zahlungsabwicklung.

**Kompatibilität:** Die API lehnt Anfragen mit einem Origin-Header ab, einschließlich API- und WebSocket-Verbindungen aus Browsern. Browser-Oberflächen müssen ein eigenes Backend verwenden. Kommandozeilen-Clients und StartOS-Aktionen sind nicht betroffen. Bestehende Kanäle müssen vor dem Update nicht geschlossen werden.

[Vollständige Versionshinweise](https://github.com/ACINQ/eclair/blob/v0.14.4/docs/release-notes/eclair-v0.14.4.md)`,
    pl_PL: `Zaktualizowano Eclair do 0.14.4 z poprawkami bezpieczeństwa chroniącymi przed złośliwymi węzłami i sfałszowanymi żądaniami API z przeglądarek oraz poprawkami finansowania kanałów, splicingu i rozliczania płatności.

**Zgodność:** API odrzuca żądania z nagłówkiem Origin, w tym połączenia API i WebSocket z przeglądarek. Interfejsy przeglądarkowe muszą korzystać z własnego backendu. Nie dotyczy to klientów wiersza poleceń ani akcji StartOS. Nie trzeba zamykać istniejących kanałów przed aktualizacją.

[Pełne informacje o wydaniu](https://github.com/ACINQ/eclair/blob/v0.14.4/docs/release-notes/eclair-v0.14.4.md)`,
    fr_FR: `Mise à jour d’Eclair vers 0.14.4 avec des correctifs de sécurité contre les pairs malveillants et les requêtes API forgées depuis un navigateur, ainsi que des corrections du financement des canaux, du splicing et du règlement des paiements.

**Compatibilité :** L’API rejette les requêtes contenant un en-tête Origin, y compris les connexions API et WebSocket depuis un navigateur. Les interfaces web doivent utiliser leur propre backend. Les clients en ligne de commande et les actions StartOS ne sont pas affectés. Il n’est pas nécessaire de fermer les canaux existants avant la mise à jour.

[Notes de version complètes](https://github.com/ACINQ/eclair/blob/v0.14.4/docs/release-notes/eclair-v0.14.4.md)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
