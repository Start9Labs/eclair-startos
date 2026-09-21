import { T } from '@start9labs/start-sdk'
import { eclairConf } from '../fileModels/eclair.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { apiError, eclairApi, literal, row, sats } from './payments'

const { InputSpec, Value, Variants } = sdk

type ParsedInvoice = {
  amount?: number
  nodeId: string
  description?: string
}

type ReviewedInvoice = { invoice: string; decoded: ParsedInvoice }
const reviewedInvoices = new Map<string, ReviewedInvoice>()

async function decodeInvoice(invoice: string): Promise<ParsedInvoice> {
  const password = await eclairConf.read((c) => c['api.password']).once()
  const parsed = await eclairApi(password)('parseinvoice', { invoice })
  if (!parsed.ok) {
    throw new Error(
      i18n('The invoice could not be decoded: ${error}', {
        error: literal(apiError(parsed.text)),
      }),
    )
  }
  return JSON.parse(parsed.text) as ParsedInvoice
}

const inputSpec = async ({
  effects,
  prefill,
}: {
  effects: T.Effects
  prefill: unknown | null
}) => {
  const invoice =
    typeof (prefill as { invoice?: unknown } | null)?.invoice === 'string'
      ? (prefill as { invoice: string }).invoice.trim()
      : null
  const decoded = invoice ? await decodeInvoice(invoice) : null
  if (invoice && decoded && effects.eventId) {
    reviewedInvoices.set(effects.eventId, { invoice, decoded })
  }
  const details = decoded
    ? decoded.amount === undefined
      ? i18n('Amountless invoice to ${destination}; enter the amount below.', {
          destination: decoded.nodeId,
        })
      : i18n('Invoice details: ${amount} sats to ${destination}.', {
          amount: sats(decoded.amount),
          destination: decoded.nodeId,
        })
    : i18n('A Lightning invoice.')
  const description = decoded
    ? `${details} ${i18n('Description')}: ${decoded.description || '-'}`
    : details

  return InputSpec.of({
    invoice: Value.text({
      name: i18n('Invoice'),
      description,
      required: true,
      default: null,
      placeholder: 'lnbc…',
      immutable: true,
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
    confirmed: Value.toggle({
      name: i18n('I verified the amount and destination'),
      description: i18n(
        'Confirm these details before sending. Lightning payments cannot be reversed.',
      ),
      default: false,
    }),
  })
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

export const payInvoice = sdk.Action.withInput(
  'pay-invoice',
  async ({ effects }) => ({
    name: i18n('Pay Invoice'),
    description: i18n('Pay a Lightning invoice from this node.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Payments'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({}),
  async ({ effects, input }): Promise<T.ActionResult & { version: '1' }> => {
    if (!input.confirmed) {
      throw new Error(
        i18n(
          'Confirm these details before sending. Lightning payments cannot be reversed.',
        ),
      )
    }
    const invoice = input.invoice.trim()
    const reviewed = effects.eventId
      ? reviewedInvoices.get(effects.eventId)
      : undefined
    if (effects.eventId) reviewedInvoices.delete(effects.eventId)
    if (reviewed && reviewed.invoice !== invoice) {
      throw new Error(
        i18n(
          'The invoice changed after review. Reopen the action and verify its details.',
        ),
      )
    }
    const decoded = reviewed?.decoded ?? (await decodeInvoice(invoice))
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

    const password = await eclairConf.read((c) => c['api.password']).once()
    const paid = await eclairApi(password)('payinvoice', {
      invoice,
      maxFeePct: String(input['max-fee-percent']),
      blocking: 'true',
      ...(entered === null ? {} : { amountMsat: String(entered * 1000) }),
    })
    const result: PaymentResult | null = paid.ok ? JSON.parse(paid.text) : null
    if (result?.type !== 'payment-sent') {
      const reason = result?.failures?.length
        ? result.failures
            .map((f) => f.t ?? f.failureMessage ?? f.failureType?.name ?? '')
            .filter(Boolean)
            .join('; ')
        : apiError(paid.text)
      throw new Error(
        i18n('Payment failed: ${reason}', { reason: literal(reason) }),
      )
    }
    const amount = sats(result.recipientAmount)
    const fee = sats(
      (result.parts ?? []).reduce((sum, p) => sum + (p.feesPaid ?? 0), 0),
    )
    const destination = result.recipientNodeId ?? decoded.nodeId
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
