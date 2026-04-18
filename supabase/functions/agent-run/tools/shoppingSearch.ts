// shopping_search tool — Phase 4.
//
// Pipeline:
//   1. LLM supplies a shopping-style query (we never mutate it).
//   2. We CSE-search over-fetched URLs (up to maxResults * 2, capped at 10).
//   3. For each URL in parallel: robots.txt check → HTML fetch →
//      extract schema.org/Product + Organization.
//   4. Drop anything without a price. Never synthesize a price.
//   5. Return at most maxResults verified products.
//
// Budgets are enforced in layers so one stuck site can't stall the
// batch: 3 s per-URL (fetchHtml), 2 s robots.txt, 12 s overall (outer
// AbortController → Promise.race against the parallel fetches).

import { webSearchRaw, type WebSearchOutput } from './webSearch.ts'
import { fetchHtml, DEFAULT_USER_AGENT } from '../extractors/fetchHtml.ts'
import { isFetchAllowed } from '../extractors/robotsTxt.ts'
import {
  extractJsonLdBlocks,
  findOrganization,
  findProduct,
} from '../extractors/schemaOrg.ts'

export const SHOPPING_SEARCH_COST_USD = 0.005

const PER_URL_TIMEOUT_MS = 3000
const OVERALL_TIMEOUT_MS = 12_000

export interface ShoppingSearchInput {
  query: string
  max_results?: number
}

export interface ShoppingProduct {
  name: string
  price: string
  price_is_range: boolean
  currency?: string
  image?: string
  seller: string | null
  seller_contact: string | null
  url: string
  verified: true
}

export interface ShoppingSearchOutput {
  products: ShoppingProduct[]
  note: string
  duration_ms: number
  error?: string
}

async function extractFromUrl(
  url: string,
  timeoutMs: number,
): Promise<ShoppingProduct | null> {
  try {
    const allowed = await isFetchAllowed(url, DEFAULT_USER_AGENT)
    if (!allowed) return null
    const fetched = await fetchHtml(url, { timeoutMs })
    if (!fetched) return null
    const blocks = extractJsonLdBlocks(fetched.html)
    const product = findProduct(blocks)
    if (!product || !product.price) return null
    const org = findOrganization(blocks)
    return {
      name: product.name,
      price: product.price,
      price_is_range: product.priceIsRange,
      currency: product.currency,
      image: product.image,
      seller: product.sellerName ?? org?.name ?? null,
      seller_contact: org?.telephone ?? org?.email ?? null,
      url: product.url ?? product.offerUrl ?? fetched.finalUrl,
      verified: true,
    }
  } catch {
    return null
  }
}

export async function runShoppingSearch(
  input: ShoppingSearchInput,
): Promise<ShoppingSearchOutput> {
  const t0 = Date.now()
  const query = (input.query ?? '').trim()
  const requested = Math.min(Math.max(input.max_results ?? 5, 1), 10)

  if (!query) {
    return {
      products: [],
      note: 'shopping_search requires a non-empty query',
      duration_ms: Date.now() - t0,
      error: 'empty query',
    }
  }

  const overFetch = Math.min(requested * 2, 10)
  let cseResults: WebSearchOutput
  try {
    cseResults = await webSearchRaw(query, overFetch)
  } catch (err) {
    return {
      products: [],
      note: 'search failed before any page could be fetched',
      duration_ms: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  const urls = cseResults.items.map((it) => it.link).filter((u): u is string => !!u)

  // Overall cap: race the parallel fetch against a wall-clock timeout
  // so a batch of slow sites can't starve the agent turn.
  const pending = Promise.allSettled(
    urls.map((u) => extractFromUrl(u, PER_URL_TIMEOUT_MS)),
  )
  const overall = new Promise<'timeout'>((resolve) =>
    setTimeout(() => resolve('timeout'), OVERALL_TIMEOUT_MS),
  )
  const raced = await Promise.race([pending, overall])

  let products: ShoppingProduct[] = []
  let note: string
  if (raced === 'timeout') {
    note = `shopping_search timed out after ${OVERALL_TIMEOUT_MS} ms; returning any results resolved so far (0)`
  } else {
    for (const r of raced) {
      if (r.status === 'fulfilled' && r.value) products.push(r.value)
    }
    products = products.slice(0, requested)
    note = `Parsed ${products.length} verified products from ${urls.length} results`
  }

  return {
    products,
    note,
    duration_ms: Date.now() - t0,
  }
}

export const SHOPPING_SEARCH_DECLARATION = {
  name: 'shopping_search',
  description:
    'Find products for sale across the web with verified price and seller. Fetches top search-result pages and parses schema.org/Product JSON-LD. Only returns products with an extractable price. Use for any shopping, buy, price, cheapest, or where-to-buy query. Never synthesize a price yourself — if this tool returns zero products, say so.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Natural-language product query, e.g. "Nike Pegasus 40 mens size 10". Include model numbers and sizes for better results.',
      },
      max_results: {
        type: 'integer',
        description: 'Number of verified products to return (1-10). Defaults to 5.',
      },
    },
    required: ['query'],
  },
}
