import type { StreamEvent } from '../types'
const base = '/api/v1'
async function failure(r: Response): Promise<never> {
  const x = await r.json().catch(() => ({}))
  throw new Error(typeof x.detail === 'string' ? x.detail : `Request failed (${r.status}).`)
}
export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const r = await fetch(base + path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-Atlas-Request': '1' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
  if (!r.ok) return failure(r)
  if (r.status === 204) return undefined as T
  return r.json()
}
export async function streamChat(
  body: unknown,
  signal: AbortSignal,
  onEvent: (e: StreamEvent) => void,
) {
  const r = await fetch(base + '/chat', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Atlas-Request': '1' },
    body: JSON.stringify(body),
    signal,
  })
  if (!r.ok) return failure(r)
  if (!r.body) throw new Error('This browser cannot stream responses.')
  const reader = r.body.getReader(),
    decoder = new TextDecoder()
  let buffer = '',
    finished = false
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let n: number
      while ((n = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, n).trim()
        buffer = buffer.slice(n + 1)
        if (!line.startsWith('data:')) continue
        const e = JSON.parse(line.slice(5)) as StreamEvent
        onEvent(e)
        if (e.type === 'done') finished = true
      }
    }
  } finally {
    reader.releaseLock()
  }
  if (!finished) throw new Error('The stream was interrupted. You can regenerate this response.')
}
export function err(e: unknown) {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.'
}
export function dateLabel(s: string) {
  return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
