// Bounded HTML fetcher for schema.org JSON-LD extraction.
//
// Caps: 3 s timeout, 2 MB body, User-Agent identifying TR-ACE. We stream
// the response body and abort mid-read as soon as we cross maxBytes so a
// hostile or just large server cannot exhaust the edge-function memory.
//
// Redirects: we rely on Deno's built-in `redirect: "follow"` (platform
// default is 20). We don't manually cap to 3 — an extra few redirect
// hops is cheaper than re-implementing the fetch redirect loop, and
// the outer timeout already bounds the worst case.
//
// Returns null on any failure (non-2xx, timeout, size-cap hit, network
// error) so callers can just filter nulls out of `Promise.allSettled`.

export interface FetchHtmlOptions {
  timeoutMs?: number
  maxBytes?: number
}

export interface FetchHtmlResult {
  html: string
  finalUrl: string
}

export const DEFAULT_USER_AGENT =
  'TR-ACE-Agent/1.0 (+https://tr-ace.dev/bot; schema.org product metadata reader)'

const DEFAULT_TIMEOUT_MS = 3000
const DEFAULT_MAX_BYTES = 2_000_000

export async function fetchHtml(
  url: string,
  opts: FetchHtmlOptions = {},
): Promise<FetchHtmlResult | null> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        Accept: 'text/html,*/*',
      },
    })

    if (!res.ok || !res.body) return null

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8', { fatal: false })
    let received = 0
    let html = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > maxBytes) {
        try {
          await reader.cancel()
        } catch {
          // ignore
        }
        return null
      }
      html += decoder.decode(value, { stream: true })
    }
    html += decoder.decode()

    return { html, finalUrl: res.url || url }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
