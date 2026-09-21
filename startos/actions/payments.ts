import { apiPort } from '../utils'

export const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(Math.floor(msat / 1000))

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

export function apiError(text: string): string {
  try {
    return String(JSON.parse(text).error ?? text).replace(/\s+/g, ' ')
  } catch {
    return text.trim() || 'unknown'
  }
}

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
  masked: false,
  type: 'single' as const,
  value,
})
