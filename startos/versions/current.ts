import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.4:1',
  releaseNotes: {
    en_US: `The Node Reachability health check runs once per start.

**Compatibility:** The API rejects requests carrying an Origin header, including browser API and WebSocket connections. Browser front-ends must use their own backend. Command-line clients and StartOS actions are unaffected. Existing channels do not need to be closed before updating.`,
    es_ES: `La comprobación de estado Accesibilidad del nodo se ejecuta una vez por inicio.

**Compatibilidad:** La API rechaza las solicitudes con una cabecera Origin, incluidas las conexiones API y WebSocket desde navegadores. Las interfaces web deben usar su propio backend. Los clientes de línea de comandos y las acciones de StartOS no se ven afectados. No es necesario cerrar los canales existentes antes de actualizar.`,
    de_DE: `Die Statusprüfung Erreichbarkeit des Knotens läuft einmal pro Start.

**Kompatibilität:** Die API lehnt Anfragen mit einem Origin-Header ab, einschließlich API- und WebSocket-Verbindungen aus Browsern. Browser-Oberflächen müssen ein eigenes Backend verwenden. Kommandozeilen-Clients und StartOS-Aktionen sind nicht betroffen. Bestehende Kanäle müssen vor dem Update nicht geschlossen werden.`,
    pl_PL: `Kontrola stanu Osiągalność węzła jest wykonywana raz przy każdym uruchomieniu.

**Zgodność:** API odrzuca żądania z nagłówkiem Origin, w tym połączenia API i WebSocket z przeglądarek. Interfejsy przeglądarkowe muszą korzystać z własnego backendu. Nie dotyczy to klientów wiersza poleceń ani akcji StartOS. Nie trzeba zamykać istniejących kanałów przed aktualizacją.`,
    fr_FR: `La vérification d’état Joignabilité du nœud s’exécute une fois par démarrage.

**Compatibilité :** L’API rejette les requêtes contenant un en-tête Origin, y compris les connexions API et WebSocket depuis un navigateur. Les interfaces web doivent utiliser leur propre backend. Les clients en ligne de commande et les actions StartOS ne sont pas affectés. Il n’est pas nécessaire de fermer les canaux existants avant la mise à jour.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
