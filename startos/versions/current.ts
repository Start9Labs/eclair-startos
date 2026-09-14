import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.3:1',
  releaseNotes: {
    en_US:
      "Eclair now picks a peer port it can actually announce. Where another Lightning service already holds port 9735, Eclair used to fall back to a port it could not announce and was silently reachable over Tor only; it now settles on a working port automatically. A node with a Tor address keeps its current port so the address keeps working, and Node Reachability explains how to move if you want clearnet too. An affected node's URI will show its new port.",
    es_ES:
      'Eclair ahora elige un puerto de pares que puede anunciar de verdad. Cuando otro servicio Lightning ya ocupa el puerto 9735, Eclair recurría antes a un puerto que no podía anunciar y solo era accesible por Tor, sin avisar; ahora se queda automáticamente con un puerto que funciona. Un nodo con dirección Tor conserva su puerto actual para que la dirección siga funcionando, y Accesibilidad del nodo explica cómo cambiarlo si también quieres clearnet. El URI de un nodo afectado mostrará su nuevo puerto.',
    de_DE:
      'Eclair wählt jetzt einen Peer-Port, den es auch ankündigen kann. Belegt bereits ein anderer Lightning-Dienst Port 9735, wich Eclair bisher auf einen Port aus, den es nicht ankündigen konnte, und war unbemerkt nur über Tor erreichbar; nun legt es sich automatisch auf einen funktionierenden Port fest. Ein Knoten mit Tor-Adresse behält seinen aktuellen Port, damit die Adresse weiter funktioniert; die Erreichbarkeitsprüfung erklärt, wie Sie wechseln, wenn Sie zusätzlich Clearnet wollen. Bei einem betroffenen Knoten zeigt die URI den neuen Port.',
    pl_PL:
      'Eclair wybiera teraz port peerów, który faktycznie może ogłosić. Gdy inna usługa Lightning zajmuje już port 9735, Eclair przechodził wcześniej na port, którego nie mógł ogłosić, i był osiągalny wyłącznie przez Tor, bez żadnego ostrzeżenia; teraz automatycznie ustala działający port. Węzeł z adresem Tor zachowuje obecny port, aby adres nadal działał, a kontrola osiągalności węzła wyjaśnia, jak go zmienić, jeśli chcesz także clearnet. URI takiego węzła pokaże nowy port.',
    fr_FR:
      'Eclair choisit désormais un port pair qu’il peut réellement annoncer. Lorsqu’un autre service Lightning occupe déjà le port 9735, Eclair se rabattait auparavant sur un port qu’il ne pouvait pas annoncer et n’était joignable que via Tor, sans le signaler ; il retient maintenant automatiquement un port fonctionnel. Un nœud doté d’une adresse Tor conserve son port actuel pour que l’adresse continue de fonctionner, et la vérification de joignabilité explique comment changer si vous voulez aussi le clearnet. L’URI d’un nœud concerné affichera son nouveau port.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
