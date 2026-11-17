import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.6:4',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.2 or later. New backups require confirmation of the latest channel state before Eclair starts after restore; existing backups restore their original package without this gate. Pay Invoice no longer has a fee field or confirmation toggle: fees are capped at 21 sats or 3%, whichever is more, and shown before you pay.',
    es_ES:
      'Requiere StartOS 0.4.2 o posterior. Las nuevas copias de seguridad requieren confirmar el estado más reciente de los canales antes de iniciar Eclair tras restaurarlas; las copias existentes restauran su paquete original sin esta protección. Pagar factura ya no tiene campo de comisión ni casilla de confirmación: las comisiones se limitan a 21 sats o al 3 %, lo que sea mayor, y se muestran antes de pagar.',
    de_DE:
      'Erfordert StartOS 0.4.2 oder neuer. Neue Backups erfordern nach der Wiederherstellung die Bestätigung des neuesten Kanalzustands, bevor Eclair startet; bestehende Backups stellen ihr ursprüngliches Paket ohne diese Sperre wieder her. Rechnung bezahlen hat kein Gebührenfeld und keinen Bestätigungsschalter mehr: Gebühren sind auf 21 Sats oder 3 % begrenzt, je nachdem, was höher ist, und werden vor dem Bezahlen angezeigt.',
    pl_PL:
      'Wymaga StartOS 0.4.2 lub nowszego. Nowe kopie zapasowe wymagają potwierdzenia najnowszego stanu kanałów przed uruchomieniem Eclair po przywróceniu; istniejące kopie przywracają swój oryginalny pakiet bez tej blokady. Zapłać fakturę nie ma już pola opłaty ani przełącznika potwierdzenia: opłaty są ograniczone do 21 satów lub 3%, zależnie od tego, co większe, i pokazywane przed zapłatą.',
    fr_FR:
      'Nécessite StartOS 0.4.2 ou une version ultérieure. Les nouvelles sauvegardes exigent la confirmation du dernier état des canaux avant de démarrer Eclair après restauration ; les sauvegardes existantes restaurent leur paquet d’origine sans ce blocage. Payer une facture n’a plus de champ de frais ni de case de confirmation : les frais sont plafonnés à 21 sats ou 3 %, le plus élevé des deux, et affichés avant le paiement.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
