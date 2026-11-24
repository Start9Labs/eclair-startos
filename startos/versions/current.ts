import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.6:6',
  releaseNotes: {
    en_US:
      "A payment prompt from another service shows only the invoice's amount and destination; the description appears in the result after paying.",
    es_ES:
      'Una solicitud de pago de otro servicio muestra solo el importe y el destino de la factura; la descripción aparece en el resultado tras pagar.',
    de_DE:
      'Eine Zahlungsaufforderung eines anderen Dienstes zeigt nur Betrag und Ziel der Rechnung; die Beschreibung erscheint nach der Zahlung im Ergebnis.',
    pl_PL:
      'Prośba o płatność od innej usługi pokazuje tylko kwotę i miejsce docelowe faktury; opis pojawia się w wyniku po zapłacie.',
    fr_FR:
      'Une demande de paiement d’un autre service n’affiche que le montant et la destination de la facture ; la description apparaît dans le résultat après le paiement.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
