import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.3:4',
  releaseNotes: {
    en_US: `Internal updates.

- Node Info shows each node URI in its own field, with a QR code
- The confirmation priority and Locked UTXO Behavior settings, and Pay Invoice's Amount, explain each option
- Rotate API Password warns that it restarts Eclair and that connected clients need the new password`,
    es_ES: `Actualizaciones internas.

- Información del nodo muestra cada URI del nodo en su propio campo, con un código QR
- Los ajustes de prioridad de confirmación y de comportamiento ante UTXO bloqueados, y el Importe de Pagar factura, explican cada opción
- Rotar la contraseña de la API advierte que reinicia Eclair y que los clientes conectados necesitan la nueva contraseña`,
    de_DE: `Interne Aktualisierungen.

- Knoteninformationen zeigt jede Knoten-URI in einem eigenen Feld, mit QR-Code
- Die Einstellungen zur Bestätigungspriorität und zum Verhalten bei gesperrten UTXOs sowie der Betrag bei Rechnung bezahlen erklären jede Option
- API-Passwort erneuern warnt, dass Eclair neu startet und verbundene Clients das neue Passwort benötigen`,
    pl_PL: `Aktualizacje wewnętrzne.

- Informacje o węźle pokazują każdy adres URI węzła w osobnym polu, z kodem QR
- Ustawienia priorytetu potwierdzenia i zachowania przy zablokowanych UTXO oraz Kwota w Zapłać fakturę objaśniają każdą opcję
- Zmień hasło API ostrzega, że uruchamia Eclair ponownie i że połączeni klienci potrzebują nowego hasła`,
    fr_FR: `Mises à jour internes.

- Informations sur le nœud affiche chaque URI du nœud dans son propre champ, avec un code QR
- Les réglages de priorité de confirmation et de comportement des UTXO verrouillés, ainsi que le Montant de Payer une facture, expliquent chaque option
- Renouveler le mot de passe de l’API avertit qu’Eclair redémarre et que les clients connectés ont besoin du nouveau mot de passe`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
