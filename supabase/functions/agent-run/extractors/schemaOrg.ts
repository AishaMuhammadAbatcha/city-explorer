// schema.org JSON-LD extractors.
//
// Strategy: pull every <script type="application/ld+json"> block out of
// the HTML with a permissive regex, JSON.parse each block defensively,
// flatten any @graph arrays, then walk the resulting node set looking
// for Product / Offer / Organization shapes.
//
// We do not attempt to execute JS or resolve references like
// @id → node lookups beyond the cases we actually see in the wild
// (Google's structured-data testing tool is far more lenient; we
// match the common producer patterns).

export interface ProductExtract {
  name: string
  image?: string
  price: string
  currency?: string
  url?: string
  brand?: string
  sellerName?: string
  offerUrl?: string
  priceIsRange: boolean
}

export interface OrgExtract {
  name: string
  url?: string
  telephone?: string
  email?: string
}

const JSON_LD_RE = /<script\b[^>]*type=["'](application\/ld\+json)["'][^>]*>([\s\S]*?)<\/script>/gi

export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = []
  let match: RegExpExecArray | null
  while ((match = JSON_LD_RE.exec(html)) !== null) {
    const raw = match[2].trim()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        for (const p of parsed) pushWithGraph(blocks, p)
      } else {
        pushWithGraph(blocks, parsed)
      }
    } catch {
      // Silently skip malformed JSON-LD (common in the wild: trailing
      // commas, CDATA wrappers, etc).
    }
  }
  return blocks
}

function pushWithGraph(acc: unknown[], node: unknown): void {
  if (!isObject(node)) {
    acc.push(node)
    return
  }
  const graph = (node as Record<string, unknown>)['@graph']
  if (Array.isArray(graph)) {
    for (const g of graph) acc.push(g)
    const rest: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k !== '@graph') rest[k] = v
    }
    if (Object.keys(rest).length > 0) acc.push(rest)
  } else {
    acc.push(node)
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function typeMatches(node: Record<string, unknown>, wanted: string[]): boolean {
  const t = node['@type']
  if (typeof t === 'string') return wanted.includes(t)
  if (Array.isArray(t)) return t.some((v) => typeof v === 'string' && wanted.includes(v))
  return false
}

function walk(nodes: unknown[], visit: (node: Record<string, unknown>) => void): void {
  const stack: unknown[] = [...nodes]
  const seen = new WeakSet<object>()
  while (stack.length) {
    const cur = stack.pop()
    if (!isObject(cur)) continue
    if (seen.has(cur)) continue
    seen.add(cur)
    visit(cur)
    for (const v of Object.values(cur)) {
      if (Array.isArray(v)) {
        for (const item of v) stack.push(item)
      } else if (isObject(v)) {
        stack.push(v)
      }
    }
  }
}

function coerceString(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const s = v.trim()
    return s.length > 0 ? s : undefined
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return undefined
}

function resolveImage(v: unknown): string | undefined {
  if (!v) return undefined
  if (typeof v === 'string') return v.trim() || undefined
  if (Array.isArray(v)) {
    for (const item of v) {
      const r = resolveImage(item)
      if (r) return r
    }
    return undefined
  }
  if (isObject(v)) {
    const url = coerceString(v['url']) ?? coerceString(v['contentUrl'])
    return url
  }
  return undefined
}

function resolveName(v: unknown): string | undefined {
  if (typeof v === 'string') return v.trim() || undefined
  if (isObject(v)) return coerceString(v['name'])
  if (Array.isArray(v)) {
    for (const item of v) {
      const n = resolveName(item)
      if (n) return n
    }
  }
  return undefined
}

interface OfferInfo {
  price: string
  currency?: string
  url?: string
  sellerName?: string
  priceIsRange: boolean
}

function readOffer(offer: Record<string, unknown>): OfferInfo | null {
  const isAggregate = typeMatches(offer, ['AggregateOffer'])
  let rawPrice: string | undefined
  let priceIsRange = false
  if (isAggregate) {
    rawPrice = coerceString(offer['lowPrice']) ?? coerceString(offer['price'])
    priceIsRange = rawPrice != null
  } else {
    rawPrice = coerceString(offer['price'])
  }
  if (!rawPrice) return null
  const currency =
    coerceString(offer['priceCurrency']) ?? coerceString(offer['currency'])
  const url = coerceString(offer['url'])
  const sellerName = resolveName(offer['seller'])
  return { price: rawPrice, currency, url, sellerName, priceIsRange }
}

function findOfferInfo(product: Record<string, unknown>): OfferInfo | null {
  const offers = product['offers']
  if (!offers) return null
  if (Array.isArray(offers)) {
    for (const o of offers) {
      if (isObject(o)) {
        const info = readOffer(o)
        if (info) return info
      }
    }
    return null
  }
  if (isObject(offers)) return readOffer(offers)
  return null
}

export function findProduct(nodes: unknown[]): ProductExtract | null {
  let best: ProductExtract | null = null
  walk(nodes, (node) => {
    if (!typeMatches(node, ['Product'])) return
    const name = resolveName(node['name'])
    if (!name) return
    const offer = findOfferInfo(node)
    if (!offer) return
    const image = resolveImage(node['image'])
    const url = coerceString(node['url'])
    const brand = resolveName(node['brand'])
    const candidate: ProductExtract = {
      name,
      image,
      price: offer.price,
      currency: offer.currency,
      url,
      brand,
      sellerName: offer.sellerName,
      offerUrl: offer.url,
      priceIsRange: offer.priceIsRange,
    }
    // Prefer first found; schema.org convention is one Product per page.
    if (!best) best = candidate
  })
  return best
}

export function findOrganization(nodes: unknown[]): OrgExtract | null {
  let best: OrgExtract | null = null
  walk(nodes, (node) => {
    if (!typeMatches(node, ['Organization', 'Store', 'LocalBusiness'])) return
    const name = resolveName(node['name'])
    if (!name) return
    const url = coerceString(node['url'])
    const telephone = coerceString(node['telephone'])
    const email = coerceString(node['email'])
    const candidate: OrgExtract = { name, url, telephone, email }
    if (!best) {
      best = candidate
    } else if (!best.telephone && !best.email && (telephone || email)) {
      // Upgrade: prefer an org node that actually carries contact info.
      best = candidate
    }
  })
  return best
}
