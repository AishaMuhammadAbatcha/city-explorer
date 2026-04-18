// Minimal robots.txt checker with fail-open semantics.
//
// Policy:
//   - 2 s timeout on the robots.txt fetch; on timeout / network error
//     / non-2xx we ALLOW the fetch (fail-open, per Phase 4 sub-decision 7).
//   - Per-origin cache with 10 min TTL keyed by URL origin.
//   - Only Disallow rules are honored; Allow overrides and wildcards
//     beyond leading path prefix are not implemented. This is
//     intentionally small — we are a single-page metadata reader, not
//     a crawler, and honoring the coarse Disallow list is enough for
//     polite behavior.

interface RobotsCacheEntry {
  disallowedPrefixes: string[]
  expiresAt: number
}

const CACHE_TTL_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 2000
const originCache = new Map<string, RobotsCacheEntry>()

function parseRobots(txt: string, userAgent: string): string[] {
  // Normalize the UA for matching — robots.txt User-agent lines are
  // compared against the product token, not the full UA header.
  const uaToken = userAgent.split('/')[0].toLowerCase()
  const lines = txt.split(/\r?\n/)
  const groups: { agents: string[]; disallow: string[] }[] = []
  let current: { agents: string[]; disallow: string[] } | null = null
  let sawRuleForCurrent = false

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const field = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()

    if (field === 'user-agent') {
      if (!current || sawRuleForCurrent) {
        current = { agents: [], disallow: [] }
        groups.push(current)
        sawRuleForCurrent = false
      }
      current.agents.push(value.toLowerCase())
    } else if (field === 'disallow') {
      if (!current) {
        current = { agents: ['*'], disallow: [] }
        groups.push(current)
      }
      sawRuleForCurrent = true
      if (value.length > 0) current.disallow.push(value)
    } else if (field === 'allow') {
      sawRuleForCurrent = true
    }
  }

  const matching = groups.filter(
    (g) => g.agents.includes('*') || g.agents.includes(uaToken),
  )
  const prefixes: string[] = []
  for (const g of matching) prefixes.push(...g.disallow)
  return prefixes
}

async function loadRobots(origin: string, userAgent: string): Promise<RobotsCacheEntry> {
  const cached = originCache.get(origin)
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let disallowedPrefixes: string[] = []
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': userAgent, Accept: 'text/plain,*/*' },
    })
    if (res.ok) {
      const txt = await res.text()
      disallowedPrefixes = parseRobots(txt, userAgent)
    }
    // non-2xx → fail-open (empty disallow list)
  } catch {
    // timeout / network error → fail-open
  } finally {
    clearTimeout(timer)
  }

  const entry: RobotsCacheEntry = {
    disallowedPrefixes,
    expiresAt: now + CACHE_TTL_MS,
  }
  originCache.set(origin, entry)
  return entry
}

export async function isFetchAllowed(url: string, userAgent: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  const origin = parsed.origin
  const path = parsed.pathname + parsed.search

  const { disallowedPrefixes } = await loadRobots(origin, userAgent)
  for (const prefix of disallowedPrefixes) {
    if (prefix === '/') return false
    if (path.startsWith(prefix)) return false
  }
  return true
}

export function __clearRobotsCacheForTests(): void {
  originCache.clear()
}
