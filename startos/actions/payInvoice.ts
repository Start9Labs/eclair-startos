import { T } from '@start9labs/start-sdk'
import { eclairConf } from '../fileModels/eclair.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { apiPort } from '../utils'

const { InputSpec, Value, Variants } = sdk

const inputSpec = InputSpec.of({
  invoice: Value.text({
    name: i18n('Invoice'),
    description: i18n('A BOLT11 payment request.'),
    required: true,
    default: null,
    placeholder: 'lnbc…',
  }),
  amount: Value.union({
    name: i18n('Amount'),
    description: i18n(
      'Most invoices state their amount; enter one only when the invoice leaves it open.',
    ),
    default: 'invoice',
    variants: Variants.of({
      invoice: {
        name: i18n('As stated in the invoice'),
        spec: InputSpec.of({}),
      },
      custom: {
        name: i18n('Enter an amount'),
        spec: InputSpec.of({
          sats: Value.number({
            name: i18n('Amount to pay'),
            description: null,
            required: true,
            default: null,
            min: 1,
            integer: true,
            units: 'sats',
            placeholder: null,
          }),
        }),
      },
    }),
  }),
  'max-fee-percent': Value.number({
    name: i18n('Maximum fee'),
    description: i18n(
      'The most this node may pay in routing fees, as a percentage of the amount.',
    ),
    required: true,
    default: 1,
    min: 0,
    max: 100,
    step: 0.1,
    integer: false,
    units: '%',
    placeholder: null,
  }),
})

type ParsedInvoice = {
  amount?: number
  nodeId: string
  description?: string
}

type PaymentResult = {
  type: 'payment-sent' | 'payment-failed'
  paymentPreimage?: string
  recipientAmount?: number
  recipientNodeId?: string
  parts?: { feesPaid: number }[]
  // A local failure carries its reason as `t`; a remote one as `failureMessage`.
  failures?: {
    t?: string
    failureType?: { name?: string }
    failureMessage?: string
  }[]
}

const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(Math.floor(msat / 1000))

export const payInvoice = sdk.Action.withInput(
  'pay-invoice',
  async ({ effects }) => ({
    name: i18n('Pay Invoice'),
    description: i18n('Pay a Lightning invoice from this node.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({}),
  async ({ effects, input }): Promise<T.ActionResult & { version: '1' }> => {
    const password = await eclairConf.read((c) => c['api.password']).once()
    const call = async (method: string, params: Record<string, string>) => {
      const res = await fetch(`http://127.0.0.1:${apiPort}/${method}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`:${password}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      })
      const text = await res.text()
      return { ok: res.ok, text }
    }
    const invoice = input.invoice.trim()

    const parsed = await call('parseinvoice', { invoice })
    if (!parsed.ok) {
      throw new Error(
        i18n('The invoice could not be decoded: ${error}', {
          error: apiError(parsed.text),
        }),
      )
    }
    const decoded: ParsedInvoice = JSON.parse(parsed.text)
    const entered =
      input.amount.selection === 'custom' ? input.amount.value.sats : null
    if (decoded.amount === undefined && entered === null) {
      throw new Error(
        i18n('This invoice carries no amount; select "Enter an amount".'),
      )
    }
    if (decoded.amount !== undefined && entered !== null) {
      throw new Error(
        i18n(
          'This invoice already carries an amount of ${amount} sats; select "As stated in the invoice".',
          { amount: sats(decoded.amount) },
        ),
      )
    }

    const paid = await call('payinvoice', {
      invoice,
      maxFeePct: String(input['max-fee-percent']),
      blocking: 'true',
      ...(entered === null ? {} : { amountMsat: String(entered * 1000) }),
    })
    const result: PaymentResult | null = paid.ok ? JSON.parse(paid.text) : null
    if (result?.type !== 'payment-sent') {
      throw new Error(
        i18n('Payment failed: ${reason}', {
          reason: result?.failures?.length
            ? result.failures
                .map(
                  (f) => f.t ?? f.failureMessage ?? f.failureType?.name ?? '',
                )
                .filter(Boolean)
                .join('; ')
            : apiError(paid.text),
        }),
      )
    }
    const amount = sats(result.recipientAmount)
    const fee = sats(
      (result.parts ?? []).reduce((sum, p) => sum + (p.feesPaid ?? 0), 0),
    )
    const destination = result.recipientNodeId ?? decoded.nodeId
    const row = (name: string, value: string, copyable: boolean) => ({
      name,
      description: null,
      copyable,
      qr: false,
      masked: false,
      type: 'single' as const,
      value,
    })
    return {
      version: '1' as const,
      title: i18n('Payment sent'),
      message: i18n('Paid ${amount} sats to ${destination}.', {
        amount,
        destination,
      }),
      result: {
        type: 'group' as const,
        value: [
          row(i18n('Amount'), `${amount} sats`, false),
          row(i18n('Fee'), `${fee} sats`, false),
          row(i18n('Description'), decoded.description || '-', false),
          row(i18n('Destination'), destination, true),
          row(i18n('Preimage'), result.paymentPreimage ?? '', true),
        ],
      },
    }
  },
)

// Eclair's API answers an error with a JSON `error` field; anything else is passed through.
function apiError(text: string): string {
  try {
    return String(JSON.parse(text).error ?? text).replace(/\s+/g, ' ')
  } catch {
    return text.trim() || 'unknown'
  }
}
