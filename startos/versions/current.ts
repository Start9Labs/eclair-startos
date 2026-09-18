import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.3:2',
  releaseNotes: {
    en_US: `Eclair now falls back to port 19735 (or 29735) when another service on the server holds 9735, so it can announce its clearnet address; an affected node's URI shows the new port. A node with a Tor address keeps its current port so the address keeps working, and Node Reachability explains how to move it.

The TunnelSats service can now route this node's clearnet traffic through its tunnel and announce the tunnel's address, by raising a prompt on Eclair.

New Payments actions: Pay Invoice pays a Lightning invoice from the node, and Receive Payment creates one for it to be paid.`,
    es_ES: `Eclair ahora recurre al puerto 19735 (o 29735) cuando otro servicio del servidor ocupa el 9735, de modo que puede anunciar su dirección clearnet; el URI de un nodo afectado muestra el nuevo puerto. Un nodo con dirección Tor conserva su puerto actual para que la dirección siga funcionando, y Accesibilidad del nodo explica cómo cambiarlo.

El servicio TunnelSats ahora puede enrutar el tráfico clearnet de este nodo por su túnel y anunciar la dirección del túnel, mostrando un aviso en Eclair.

Nuevas acciones de Pagos: Pagar factura paga una factura Lightning desde el nodo, y Recibir pago crea una para que se le pague.`,
    de_DE: `Eclair weicht jetzt auf Port 19735 (oder 29735) aus, wenn ein anderer Dienst auf dem Server Port 9735 belegt, und kann so seine Clearnet-Adresse ankündigen; bei einem betroffenen Knoten zeigt die URI den neuen Port. Ein Knoten mit Tor-Adresse behält seinen aktuellen Port, damit die Adresse weiter funktioniert; die Erreichbarkeitsprüfung erklärt, wie Sie ihn wechseln.

Der TunnelSats-Dienst kann den Clearnet-Verkehr dieses Knotens jetzt durch seinen Tunnel leiten und die Adresse des Tunnels ankündigen, indem er eine Aufforderung in Eclair auslöst.

Neue Aktionen unter Zahlungen: Rechnung bezahlen bezahlt eine Lightning-Rechnung vom Knoten aus, und Zahlung empfangen erstellt eine, mit der er bezahlt werden kann.`,
    pl_PL: `Eclair przechodzi teraz na port 19735 (lub 29735), gdy inna usługa na serwerze zajmuje port 9735, dzięki czemu może ogłosić swój adres clearnet; URI takiego węzła pokazuje nowy port. Węzeł z adresem Tor zachowuje obecny port, aby adres nadal działał, a kontrola osiągalności węzła wyjaśnia, jak go zmienić.

Usługa TunnelSats może teraz kierować ruch clearnet tego węzła przez swój tunel i ogłaszać adres tunelu, wyświetlając monit w Eclair.

Nowe akcje w grupie Płatności: Zapłać fakturę opłaca fakturę Lightning z węzła, a Odbierz płatność tworzy fakturę do opłacenia.`,
    fr_FR: `Eclair se rabat désormais sur le port 19735 (ou 29735) lorsqu’un autre service du serveur occupe le 9735, et peut ainsi annoncer son adresse clearnet ; l’URI d’un nœud concerné affiche le nouveau port. Un nœud doté d’une adresse Tor conserve son port actuel pour que l’adresse continue de fonctionner, et la vérification de joignabilité explique comment en changer.

Le service TunnelSats peut désormais acheminer le trafic clearnet de ce nœud par son tunnel et annoncer l'adresse du tunnel, en affichant une invite dans Eclair.

Nouvelles actions Paiements : Payer une facture règle une facture Lightning depuis le nœud, et Recevoir un paiement en crée une pour qu'il soit payé.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
