import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.6:4',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.2 or later. After a restore, Eclair stays stopped until you confirm the backup holds your latest channel state. A payment request from another service is refused if it pre-sets the confirmation or the maximum fee.',
    es_ES:
      'Requiere StartOS 0.4.2 o posterior. Tras una restauración, Eclair permanece detenido hasta que confirmes que la copia de seguridad contiene el estado más reciente de tus canales. Se rechaza una solicitud de pago de otro servicio si preestablece la confirmación o la comisión máxima.',
    de_DE:
      'Erfordert StartOS 0.4.2 oder neuer. Nach einer Wiederherstellung bleibt Eclair gestoppt, bis du bestätigst, dass das Backup den neuesten Stand deiner Kanäle enthält. Eine Zahlungsanforderung eines anderen Dienstes wird abgelehnt, wenn sie die Bestätigung oder die maximale Gebühr voreinstellt.',
    pl_PL:
      'Wymaga StartOS 0.4.2 lub nowszego. Po przywróceniu Eclair pozostaje zatrzymany, dopóki nie potwierdzisz, że kopia zapasowa zawiera najnowszy stan twoich kanałów. Żądanie płatności od innej usługi jest odrzucane, jeśli wstępnie ustawia potwierdzenie lub maksymalną opłatę.',
    fr_FR:
      "Nécessite StartOS 0.4.2 ou une version ultérieure. Après une restauration, Eclair reste arrêté jusqu'à ce que vous confirmiez que la sauvegarde contient l'état le plus récent de vos canaux. Une demande de paiement d'un autre service est refusée si elle prédéfinit la confirmation ou les frais maximum.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
