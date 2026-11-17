import { sdk } from '../sdk'
import { acknowledgeRestore } from './acknowledgeRestore'
import { clearnetVpn } from './clearnetVpn'
import { channels } from './config/channels'
import { general } from './config/general'
import { onChainFees } from './config/onChainFees'
import { paymentSettings } from './config/paymentSettings'
import { performance } from './config/performance'
import { routingFees } from './config/routingFees'
import { nodeInfo } from './nodeInfo'
import { payInvoice } from './payInvoice'
import { receivePayment } from './receivePayment'
import { setApiPassword } from './setApiPassword'

export const actions = sdk.Actions.of()
  .addAction(setApiPassword)
  .addAction(nodeInfo)
  .addAction(payInvoice)
  .addAction(receivePayment)
  .addAction(general)
  .addAction(routingFees)
  .addAction(paymentSettings)
  .addAction(onChainFees)
  .addAction(channels)
  .addAction(performance)
  .addAction(clearnetVpn)
  .addAction(acknowledgeRestore)
