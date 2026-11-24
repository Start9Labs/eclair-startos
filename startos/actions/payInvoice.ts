import { T } from '@start9labs/start-sdk'
import { eclairConf } from '../fileModels/eclair.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { paymentFeeDefaults } from '../utils'
import {
  apiError,
  decodeInvoice,
  eclairApi,
  literal,
  multilineRow,
  normalizeInvoice,
  row,
  sats,
} from './payments'

const { InputSpec, Value, Variants } = sdk

const inputSpec = async ({
  effects,
  prefill,
}: {
  effects: T.Effects
  prefill: unknown | null
}) => {
  const invoice =
    typeof (prefill as { invoice?: unknown } | null)?.invoice === 'string'
      ? normalizeInvoice((prefill as { invoice: string }).invoice)
      : null
  const decoded = invoice ? await decodeInvoice(invoice) : null
  const boundaries = await eclairConf
    .read((c) => ({
      flatSat:
        c['router.path-finding.default.boundaries.max-fee-flat-sat'] ??
        paymentFeeDefaults.flatSat,
      percent:
        c[
          'router.path-finding.default.boundaries.max-fee-proportional-percent'
        ] ?? paymentFeeDefaults.percent,
    }))
    .once()
  const { flatSat, percent } = boundaries ?? paymentFeeDefaults
  // Fee policy disclosure must not depend on invoice prefill.
  const feePolicy = i18n(
    'Routing fees are capped at ${flat} sats or ${percent}% of the amount, whichever is more.',
    { flat: String(flatSat), percent: String(percent) },
  )
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

  return InputSpec.of({
    invoice: Value.text({
      name: i18n('Invoice'),
      description: `${details} ${feePolicy}`,
      required: true,
      default: null,
      placeholder: 'lnbc…',
      immutable: true,
    }),
    amount: Value.union({
      name: i18n('Amount'),
      description: i18n(
        'Most invoices state their amount.\n- As stated in the invoice: pay exactly the amount the invoice carries\n- Enter an amount: only for an invoice that leaves the amount open',
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
  })
}

type PaymentResult = {
  type: 'payment-sent' | 'payment-failed'
  paymentPreimage?: string
  recipientAmount?: number
  recipientNodeId?: string
  parts?: { feesPaid: number }[]
  // Display fees only after all parts settle.
  feesPending?: boolean
  // A local failure carries its reason as `t`; a remote one as `failureMessage`.
  failures?: {
    t?: string
    failureType?: { name?: string }
    failureMessage?: string
  }[]
}

// One getsentinfo entry per payment part; `sent` carries the preimage and fees.
type SentInfo = {
  recipientAmount?: number
  recipientNodeId?: string
  status?: {
    type?: 'pending' | 'failed' | 'sent'
    paymentPreimage?: string
    feesPaid?: number
  }
}

const parseJson = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

const allPartsFailed = (parts: SentInfo[] | null) =>
  parts?.every((part) => part.status?.type === 'failed') ?? false

const sentPayment = (parts: SentInfo[] | null): PaymentResult | null => {
  const sent = parts?.filter((part) => part.status?.type === 'sent') ?? []
  if (!sent.length) return null
  return {
    type: 'payment-sent',
    paymentPreimage: sent[0].status?.paymentPreimage,
    recipientAmount: sent[0].recipientAmount,
    recipientNodeId: sent[0].recipientNodeId,
    parts: sent.map((part) => ({ feesPaid: part.status?.feesPaid ?? 0 })),
    feesPending: parts?.some((part) => part.status?.type === 'pending'),
  }
}

export const payInvoice = sdk.Action.withInput(
  'pay-invoice',
  async ({ effects }) => ({
    name: i18n('Pay Invoice'),
    description: i18n('Pay a Lightning invoice from this node.'),
    warning: i18n(
      'Lightning payments cannot be reversed. Eclair pays the destination an invoice names and the amount it states, so check an invoice first with Decode Invoice.',
    ),
    allowedStatuses: 'only-running',
    group: i18n('Payments'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({}),
  async ({ effects, input }): Promise<T.ActionResult & { version: '1' }> => {
    const invoice = normalizeInvoice(input.invoice)
    const decoded = await decodeInvoice(invoice)
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
    const api = eclairApi(password)
    const getSentInfo = async () => {
      const info = await api('getsentinfo', {
        paymentHash: decoded.paymentHash,
      }).catch(() => null)
      const parts = info?.ok ? parseJson<SentInfo[]>(info.text) : null
      return Array.isArray(parts) ? parts : null
    }
    const before = await getSentInfo()
    let paid: Awaited<ReturnType<typeof api>> | null = null
    let result = sentPayment(before)
    // Never resubmit a payment whose recorded outcome is sent, pending, or unknown.
    if (allPartsFailed(before)) {
      paid = await api('payinvoice', {
        invoice,
        blocking: 'true',
        ...(entered === null ? {} : { amountMsat: String(entered * 1000) }),
      }).catch(() => null)
      result = paid?.ok ? parseJson<PaymentResult>(paid.text) : null
      if (result?.type !== 'payment-sent') {
        const after = await getSentInfo()
        const sent = sentPayment(after)
        // Failure of one attempt does not settle other attempts sharing its hash.
        if (sent) {
          result = sent
        } else if (
          allPartsFailed(after) &&
          (result?.type === 'payment-failed' || (paid && !paid.ok))
        ) {
          result = { type: 'payment-failed', failures: result?.failures }
        } else {
          result = null
        }
      }
    }
    if (!result) {
      return {
        version: '1' as const,
        title: i18n('Payment pending'),
        message: i18n(
          'The payment of ${amount} sats to ${destination} has no confirmed final result and can still complete. Do not pay a replacement invoice. Run Pay Invoice again with the same invoice to see its final result.',
          {
            amount: sats(entered === null ? decoded.amount : entered * 1000),
            destination: decoded.nodeId,
          },
        ),
        result: {
          type: 'group' as const,
          value: [row(i18n('Payment hash'), decoded.paymentHash, true)],
        },
      }
    }
    if (result?.type !== 'payment-sent') {
      const reason = result?.failures?.length
        ? result.failures
            .map((f) => f.t ?? f.failureMessage ?? f.failureType?.name ?? '')
            .filter(Boolean)
            .join('; ')
        : apiError(paid?.text ?? '')
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
          ...(result.feesPending
            ? []
            : [row(i18n('Fee'), `${fee} sats`, false)]),
          multilineRow(i18n('Description'), decoded.description || '-'),
          row(i18n('Destination'), destination, true),
          row(i18n('Preimage'), result.paymentPreimage ?? '', true),
        ],
      },
    }
  },
)
