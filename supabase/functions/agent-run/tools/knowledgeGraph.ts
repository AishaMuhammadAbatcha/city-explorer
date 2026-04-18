// Google Knowledge Graph Search API.
//
// Free for non-commercial and low-volume use; no per-call price
// published. We log $0.
//
// https://developers.google.com/knowledge-graph

export interface KnowledgeGraphInput {
  query: string
  limit?: number
}

export interface KnowledgeGraphEntity {
  name: string
  description: string
  detailed_description: string
  url: string
  image: string
  types: string[]
}

export interface KnowledgeGraphOutput {
  entities: KnowledgeGraphEntity[]
}

interface KGResult {
  result?: {
    name?: string
    description?: string
    '@type'?: string | string[]
    detailedDescription?: { articleBody?: string; url?: string }
    image?: { contentUrl?: string }
    url?: string
  }
}

interface KGResponse {
  itemListElement?: KGResult[]
  error?: { message?: string }
}

export async function runKnowledgeGraph(input: KnowledgeGraphInput): Promise<KnowledgeGraphOutput> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')

  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10)
  const url = new URL('https://kgsearch.googleapis.com/v1/entities:search')
  url.searchParams.set('query', input.query)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('indent', 'true')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const json = (await res.json()) as KGResponse
  if (!res.ok) {
    throw new Error(`knowledge_graph failed: ${res.status} ${json.error?.message ?? res.statusText}`)
  }

  const entities: KnowledgeGraphEntity[] = (json.itemListElement ?? [])
    .map((it) => it.result)
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => {
      const types = Array.isArray(r['@type']) ? r['@type'] : r['@type'] ? [r['@type']] : []
      const detailUrl = r.detailedDescription?.url ?? r.url ?? ''
      return {
        name: r.name ?? '',
        description: r.description ?? '',
        detailed_description: r.detailedDescription?.articleBody ?? '',
        url: detailUrl,
        image: r.image?.contentUrl ?? '',
        types,
      }
    })

  return { entities }
}

export const KNOWLEDGE_GRAPH_DECLARATION = {
  name: 'knowledge_graph',
  description:
    'Look up factual entities (people, places, organizations, concepts) in the Google Knowledge Graph. Use for authoritative summaries of well-known entities rather than open web snippets.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Entity name or topic to look up.' },
      limit: {
        type: 'integer',
        description: 'Number of entities to return (1-10). Defaults to 5.',
      },
    },
    required: ['query'],
  },
}
