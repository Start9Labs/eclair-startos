import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.6:7',
  releaseNotes: {
    en_US:
      'Pay Invoice reports a payment that is still in flight as pending, with its payment hash, instead of as failed. Running it again checks recorded outcomes before sending another attempt.',
    es_ES:
      'Pagar factura informa como pendiente, con su hash de pago, un pago que sigue en curso, en lugar de como fallido. Volver a ejecutarla comprueba los resultados registrados antes de enviar otro intento.',
    de_DE:
      'Rechnung bezahlen meldet eine noch laufende Zahlung als ausstehend, mit ihrem Zahlungs-Hash, statt als fehlgeschlagen. Ein erneuter Aufruf prüft die gespeicherten Ergebnisse, bevor ein weiterer Zahlungsversuch gesendet wird.',
    pl_PL:
      'Zapłać fakturę zgłasza płatność, która wciąż jest w toku, jako oczekującą, z jej hashem płatności, zamiast jako nieudaną. Ponowne uruchomienie sprawdza zapisane wyniki przed wysłaniem kolejnej próby płatności.',
    fr_FR:
      'Payer une facture signale un paiement encore en cours comme en attente, avec son hachage de paiement, au lieu de l’indiquer comme échoué. La relancer vérifie les résultats enregistrés avant d’envoyer une nouvelle tentative.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
