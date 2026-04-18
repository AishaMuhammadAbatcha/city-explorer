// Google Programmable Search JSON API client.
//
// Free tier: 100 queries/day. Paid tier: $5 per 1000 queries
// (~$0.005/call). Phase 2 logs 0 cost_usd — Phase 7 will enforce
// budget caps.
//
// https://developers.google.com/custom-search/v1/overview

export interface WebSearchInput {
  query: string
  num_results?: number
}

export interface WebSearchResultItem {
  title: string
  link: string
  snippet: string
  displayLink: string
}

export interface WebSearchOutput {
  items: WebSearchResultItem[]
}

interface CSEApiItem {
  title?: string
  link?: string
  snippet?: string
  displayLink?: string
}

interface CSEApiResponse {
  items?: CSEApiItem[]
  error?: { message?: string }
}

export async function runWebSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  const cseId = Deno.env.get('GOOGLE_CSE_ID')
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')
  if (!cseId) throw new Error('GOOGLE_CSE_ID is not set')

  const num = Math.min(Math.max(input.num_results ?? 5, 1), 10)
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', cseId)
  url.searchParams.set('q', input.query)
  url.searchParams.set('num', String(num))

  const res = await fetch(url.toString())
  const json = (await res.json()) as CSEApiResponse
  if (!res.ok) {
    throw new Error(`web_search failed: ${res.status} ${json.error?.message ?? res.statusText}`)
  }

  const items: WebSearchResultItem[] = (json.items ?? []).map((it) => ({
    title: it.title ?? '',
    link: it.link ?? '',
    snippet: it.snippet ?? '',
    displayLink: it.displayLink ?? '',
  }))

  return { items }
}

export const WEB_SEARCH_DECLARATION = {
  name: 'web_search',
  description:
    'Search the public web via Google Programmable Search. Use for general questions, news, facts, tutorials, and anything outside the Google Maps domain.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query in natural language.' },
      num_results: {
        type: 'integer',
        description: 'Number of results to return (1-10). Defaults to 5.',
      },
    },
    required: ['query'],
  },
}
