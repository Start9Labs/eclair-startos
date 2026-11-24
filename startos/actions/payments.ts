import { eclairConf } from '../fileModels/eclair.conf'
import { i18n } from '../i18n'
import { apiPort } from '../utils'

export const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(msat / 1000)

export const literal = (text: string) => text.replace(/\$/g, '$$$$')

export const eclairApi =
  (password: string | null) =>
  async (method: string, params: Record<string, string>) => {
    const res = await fetch(`http://127.0.0.1:${apiPort}/${method}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`:${password}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    })
    return { ok: res.ok, text: await res.text() }
  }

// Eclair's API answers an error with a JSON `error` field; anything else is passed through.
export function apiError(text: string): string {
  try {
    return String(JSON.parse(text).error ?? text).replace(/\s+/g, ' ')
  } catch {
    return text.trim() || 'unknown'
  }
}

export const multilineRow = (name: string, value: string) => ({
  name,
  description: null,
  copyable: false,
  qr: false,
  masked: false,
  type: 'multiline' as const,
  value,
  filename: null,
})

export const row = (
  name: string,
  value: string,
  copyable: boolean,
  qr = false,
) => ({
  name,
  description: null,
  copyable,
  qr,
  launchable: false,
  masked: false,
  type: 'single' as const,
  value,
})

export type ParsedInvoice = {
  prefix: string
  timestamp: number
  nodeId: string
  description?: string
  descriptionHash?: string
  paymentHash: string
  expiry?: number
  amount?: number
}

export async function decodeInvoice(invoice: string): Promise<ParsedInvoice> {
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
