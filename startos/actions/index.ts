import { sdk } from '../sdk'
import { clearnetVpn } from './clearnetVpn'
import { channels } from './config/channels'
import { general } from './config/general'
import { onChainFees } from './config/onChainFees'
import { performance } from './config/performance'
import { routingFees } from './config/routingFees'
import { nodeInfo } from './nodeInfo'
import { payInvoice } from './payInvoice'
import { setApiPassword } from './setApiPassword'

export const actions = sdk.Actions.of()
  .addAction(setApiPassword)
  .addAction(nodeInfo)
  .addAction(payInvoice)
  .addAction(general)
  .addAction(routingFees)
  .addAction(onChainFees)
  .addAction(channels)
  .addAction(performance)
  .addAction(clearnetVpn)
