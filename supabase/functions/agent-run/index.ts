// TR-ACE agent-run edge function (Phase 3 — multi-step ReAct loop).
//
// Flow per request:
//   1. Verify user JWT, extract user_id.
//   2. Create-or-reuse a conversation, insert the user message.
//   3. Open an SSE stream back to the client.
//   4. Insert an empty assistant placeholder message so tool_calls
//      can be FK'd as we go.
//   5. Loop up to 5 iterations (ReAct):
//      - Emit step_start.
//      - Call Gemini with current contents + tool declarations.
//      - If the response carries a functionCall, check the time /
//        cost circuit breakers, execute the tool, log the tool_call
//        row with step_number, append the functionCall +
//        functionResponse to contents, accumulate any typed cards.
//      - Otherwise break out with the final text.
//   6. Chunk the final text as tokens, dedupe cards, update the
//      placeholder message with content + citations + cards, emit
//      `done`.
//
// Circuit breakers:
//   - 5 iteration hard cap.
//   - 30 s wall clock.
//   - $0.05 accumulated tool cost.
//
// Costs are logged only (Phase 7 will enforce per-user daily caps).

// @ts-expect-error Deno remote module, resolved at runtime.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders, handlePreflight } from './cors.ts'
import { createSSEStream, SSE_HEADERS, type SSEEvent } from './sse.ts'
import {
  callGemini,
  extractFunctionCall,
  extractText,
  type GeminiContent,
  type GeminiRequest,
} from './gemini.ts'
import {
  runWebSearch,
  WEB_SEARCH_DECLARATION,
  WEB_SEARCH_COST_USD,
  type WebSearchOutput,
} from './tools/webSearch.ts'
import {
  runPlacesSearch,
  PLACES_SEARCH_DECLARATION,
  PLACES_SEARCH_COST_USD,
  type PlacesSearchOutput,
} from './tools/placesSearch.ts'
import {
  runYoutubeSearch,
  YOUTUBE_SEARCH_DECLARATION,
  type YouTubeSearchOutput,
} from './tools/youtubeSearch.ts'
import {
  runKnowledgeGraph,
  KNOWLEDGE_GRAPH_DECLARATION,
  type KnowledgeGraphOutput,
} from './tools/knowledgeGraph.ts'
import { runGeocode, GEOCODE_DECLARATION, GEOCODE_COST_USD } from './tools/geocode.ts'
import {
  runShoppingSearch,
  SHOPPING_SEARCH_DECLARATION,
  SHOPPING_SEARCH_COST_USD,
  type ShoppingSearchOutput,
} from './tools/shoppingSearch.ts'

// @ts-expect-error Deno global is present at runtime.
declare const Deno: { env: { get(key: string): string | undefined }; serve(handler: (req: Request) => Promise<Response> | Response): void }

const MAX_ITERATIONS = 5
const MAX_WALL_CLOCK_MS = 30_000
const MAX_TURN_COST_USD = 0.05

const SYSTEM_INSTRUCTION = `You are TR-ACE, an agentic search assistant that helps users find things online — products, places, facts, articles, videos.

You can call up to 5 tools across multiple steps. Plan the smallest set of calls that answers the query well, then write a final markdown answer.

Tools:
- places_search — real-world locations: restaurants, venues, shops, landmarks, services.
- web_search — general web: news, tutorials, comparisons, opinions.
- youtube_search — reviews, vlogs, how-tos, or when the user wants video.
- knowledge_graph — authoritative summaries of well-known entities.
- geocode — resolve an ambiguous address to lat/lng BEFORE places_search when helpful. Not an end-user answer on its own.
- shopping_search — products for sale with verified price + seller. Required for any shopping query.

Rules:
- Break the user's request into sub-questions and call the right tool for each.
- Do not call the same tool with the same arguments twice.
- Cite every factual claim with [1], [2]… that map to the tool output URLs/links. Never invent URLs, prices, phone numbers, addresses, or ratings.
- When you have enough information, stop calling tools and reply with a concise markdown answer.
- Prefer short paragraphs and short lists. The UI renders result cards automatically from tool outputs, so don't duplicate full listings in prose — narrate and highlight.

Shopping guardrails:
- For product/shopping queries (price, buy, cheapest, where to buy, seller), call shopping_search, not web_search.
- Never state a price, seller name, or seller contact that is not present in a tool output. If no verified price was returned for an item, do not list that item.
- When comparing products, cite the seller and price from shopping_search output only.`

interface RequestBody {
  message: string
  conversation_id: string | null
}

interface Citation {
  url: string
  title: string
  snippet?: string
}

type Card =
  | {
      kind: 'place'
      id: string
      place_id: string
      name: string
      address: string
      rating?: number
      rating_count?: number
      lat: number
      lng: number
      maps_url: string
      snippet?: string
    }
  | {
      kind: 'video'
      id: string
      video_id: string
      title: string
      channel: string
      thumbnail: string
      url: string
      published_at?: string
    }
  | {
      kind: 'article'
      id: string
      title: string
      snippet: string
      url: string
      display_link: string
      source?: 'web' | 'kg'
    }
  | {
      kind: 'product'
      id: string
      title: string
      price?: string
      price_raw?: string
      currency?: string
      seller?: string
      seller_contact?: string
      image?: string
      url: string
      verified?: boolean
    }

function json(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

async function parseBody(req: Request): Promise<RequestBody | null> {
  try {
    const body = await req.json()
    if (typeof body?.message !== 'string' || body.message.trim().length === 0) return null
    const conversationId =
      typeof body.conversation_id === 'string' && body.conversation_id.length > 0 ? body.conversation_id : null
    return { message: body.message, conversation_id: conversationId }
  } catch {
    return null
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

function cardsFromWebSearch(out: WebSearchOutput): Card[] {
  return out.items
    .filter((it) => !!it.link)
    .map((it) => ({
      kind: 'article',
      id: it.link,
      title: it.title || it.displayLink || it.link,
      snippet: it.snippet || '',
      url: it.link,
      display_link: it.displayLink || hostOf(it.link),
      source: 'web',
    }))
}

function cardsFromPlaces(out: PlacesSearchOutput): Card[] {
  return out.places
    .filter((p) => !!p.id && !!p.location)
    .map((p) => ({
      kind: 'place',
      id: p.id,
      place_id: p.id,
      name: p.name,
      address: p.address,
      rating: p.rating ?? undefined,
      rating_count: p.rating_count ?? undefined,
      lat: p.location!.lat,
      lng: p.location!.lng,
      maps_url: p.maps_url,
    }))
}

function cardsFromYoutube(out: YouTubeSearchOutput): Card[] {
  return out.videos.map((v) => ({
    kind: 'video',
    id: v.video_id,
    video_id: v.video_id,
    title: v.title,
    channel: v.channel,
    thumbnail: v.thumbnail,
    url: v.url,
    published_at: v.published_at || undefined,
  }))
}

function cardsFromKnowledgeGraph(out: KnowledgeGraphOutput): Card[] {
  return out.entities
    .filter((e) => !!e.url)
    .map((e) => ({
      kind: 'article',
      id: e.url,
      title: e.name,
      snippet: e.detailed_description || e.description || '',
      url: e.url,
      display_link: hostOf(e.url),
      source: 'kg',
    }))
}

function citationsFromWebSearch(out: WebSearchOutput): Citation[] {
  return out.items
    .filter((it) => !!it.link)
    .map((it) => ({ url: it.link, title: it.title || it.displayLink, snippet: it.snippet || undefined }))
}

function citationsFromPlaces(out: PlacesSearchOutput): Citation[] {
  return out.places
    .filter((p) => !!p.maps_url)
    .map((p) => ({ url: p.maps_url, title: p.name, snippet: p.address || undefined }))
}

function citationsFromYoutube(out: YouTubeSearchOutput): Citation[] {
  return out.videos.map((v) => ({ url: v.url, title: v.title, snippet: v.channel || undefined }))
}

function formatPrice(price: string, currency: string | undefined, isRange: boolean): string {
  const cur = currency && currency.trim().length > 0 ? currency.trim() : ''
  const body = cur ? `${cur} ${price}` : price
  return isRange ? `from ${body}` : body
}

function cardsFromShopping(out: ShoppingSearchOutput): Card[] {
  return out.products.map((p) => ({
    kind: 'product',
    id: p.url,
    title: p.name,
    price: formatPrice(p.price, p.currency, p.price_is_range),
    price_raw: p.price,
    currency: p.currency,
    seller: p.seller ?? undefined,
    seller_contact: p.seller_contact ?? undefined,
    image: p.image,
    url: p.url,
    verified: true,
  }))
}

function citationsFromShopping(out: ShoppingSearchOutput): Citation[] {
  return out.products.map((p) => ({
    url: p.url,
    title: p.name,
    snippet: p.seller ? `Sold by ${p.seller}` : undefined,
  }))
}

function citationsFromKnowledgeGraph(out: KnowledgeGraphOutput): Citation[] {
  return out.entities
    .filter((e) => !!e.url)
    .map((e) => ({
      url: e.url,
      title: e.name,
      snippet: e.description || e.detailed_description || undefined,
    }))
}

function dedupeCards(cards: Card[]): Card[] {
  const seen = new Set<string>()
  const out: Card[] = []
  for (const c of cards) {
    const key = `${c.kind}:${c.id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const c of citations) {
    if (seen.has(c.url)) continue
    seen.add(c.url)
    out.push(c)
  }
  return out
}

function summariseToolOutput(tool: string, output: unknown): string {
  const o = output as {
    items?: unknown[]
    places?: unknown[]
    videos?: unknown[]
    entities?: unknown[]
    results?: unknown[]
    error?: string
  }
  if (o?.error) return `error: ${o.error}`
  switch (tool) {
    case 'web_search':
      return `Found ${o.items?.length ?? 0} articles`
    case 'places_search':
      return `Found ${o.places?.length ?? 0} places`
    case 'youtube_search':
      return `Found ${o.videos?.length ?? 0} videos`
    case 'knowledge_graph':
      return `Found ${o.entities?.length ?? 0} entities`
    case 'geocode':
      return `Geocoded ${o.results?.length ?? 0} matches`
    case 'shopping_search': {
      const products = (o as { products?: unknown[] }).products ?? []
      return `Found ${products.length} verified products`
    }
    default:
      return 'done'
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')

  const pre = handlePreflight(req)
  if (pre) return pre

  if (req.method !== 'POST') {
    return json(405, { error: 'method not allowed' }, origin)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { error: 'server misconfigured: supabase env missing' }, origin)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json(401, { error: 'missing bearer token' }, origin)
  }
  const accessToken = authHeader.slice(7).trim()

  const userClient: SupabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await userClient.auth.getUser(accessToken)
  if (authError || !authData?.user) {
    return json(401, { error: 'invalid token' }, origin)
  }
  const userId = authData.user.id

  const body = await parseBody(req)
  if (!body) return json(400, { error: 'invalid body' }, origin)

  let conversationId = body.conversation_id
  if (!conversationId) {
    const title = body.message.slice(0, 60)
    const { data: convo, error: convoErr } = await userClient
      .from('conversations')
      .insert({ user_id: userId, title })
      .select('id')
      .single()
    if (convoErr || !convo) {
      return json(500, { error: `failed to create conversation: ${convoErr?.message ?? 'unknown'}` }, origin)
    }
    conversationId = convo.id as string
  } else {
    await userClient.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
  }

  const { error: userMsgErr } = await userClient.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: body.message,
  })
  if (userMsgErr) {
    return json(500, { error: `failed to persist user message: ${userMsgErr.message}` }, origin)
  }

  // Load prior turns for context.
  const { data: priorRows } = await userClient
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  const history: GeminiContent[] = (priorRows ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }))

  const sse = createSSEStream()
  const resp = new Response(sse.stream, {
    status: 200,
    headers: { ...corsHeaders(origin), ...SSE_HEADERS },
  })

  const runAgent = async () => {
    const emit = (e: SSEEvent) => sse.emit(e)
    try {
      emit({ type: 'conversation_id', id: conversationId! })

      // Placeholder assistant row so tool_calls can FK to it as we go.
      const { data: placeholder, error: placeholderErr } = await adminClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: '',
          citations: [],
          cards: [],
        })
        .select('id')
        .single()
      if (placeholderErr || !placeholder) {
        throw new Error(`failed to create assistant placeholder: ${placeholderErr?.message ?? 'unknown'}`)
      }
      const placeholderId = placeholder.id as string

      const tools = [
        {
          functionDeclarations: [
            WEB_SEARCH_DECLARATION,
            PLACES_SEARCH_DECLARATION,
            YOUTUBE_SEARCH_DECLARATION,
            KNOWLEDGE_GRAPH_DECLARATION,
            GEOCODE_DECLARATION,
            SHOPPING_SEARCH_DECLARATION,
          ],
        },
      ]

      let contents: GeminiContent[] = history
      const cards: Card[] = []
      let citations: Citation[] = []
      let totalCost = 0
      let iteration = 0
      let finalText = ''
      let stopReason: 'text' | 'iteration_cap' | 'circuit_breaker' = 'text'
      const startTime = Date.now()

      while (iteration < MAX_ITERATIONS) {
        iteration += 1
        const label = iteration === 1 ? 'Planning' : `Step ${iteration}`
        emit({ type: 'step_start', iteration, label })

        const reqPayload: GeminiRequest = {
          systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
          tools,
          contents,
        }
        const geminiResp = await callGemini(reqPayload)
        const fcall = extractFunctionCall(geminiResp)

        if (!fcall) {
          finalText = extractText(geminiResp)
          stopReason = 'text'
          break
        }

        // Circuit breakers before running the tool.
        if (Date.now() - startTime > MAX_WALL_CLOCK_MS || totalCost > MAX_TURN_COST_USD) {
          stopReason = 'circuit_breaker'
          finalText = extractText(geminiResp)
          break
        }

        emit({ type: 'tool_call_start', tool: fcall.name, input: fcall.args })
        const started = Date.now()
        let toolOutput: unknown = {}
        let status: 'success' | 'error' | 'timeout' = 'success'
        let errorMessage: string | null = null
        let costThisCall = 0

        try {
          switch (fcall.name) {
            case 'web_search': {
              const out = await runWebSearch({
                query: String(fcall.args.query ?? ''),
                num_results:
                  typeof fcall.args.num_results === 'number' ? (fcall.args.num_results as number) : undefined,
              })
              toolOutput = out
              costThisCall = WEB_SEARCH_COST_USD
              citations = citations.concat(citationsFromWebSearch(out))
              cards.push(...cardsFromWebSearch(out))
              break
            }
            case 'places_search': {
              const out = await runPlacesSearch({
                query: String(fcall.args.query ?? ''),
                location:
                  typeof fcall.args.location === 'string' ? (fcall.args.location as string) : undefined,
                radius_m:
                  typeof fcall.args.radius_m === 'number' ? (fcall.args.radius_m as number) : undefined,
              })
              toolOutput = out
              costThisCall = PLACES_SEARCH_COST_USD
              citations = citations.concat(citationsFromPlaces(out))
              cards.push(...cardsFromPlaces(out))
              break
            }
            case 'youtube_search': {
              const out = await runYoutubeSearch({
                query: String(fcall.args.query ?? ''),
                max_results:
                  typeof fcall.args.max_results === 'number' ? (fcall.args.max_results as number) : undefined,
              })
              toolOutput = out
              costThisCall = 0
              citations = citations.concat(citationsFromYoutube(out))
              cards.push(...cardsFromYoutube(out))
              break
            }
            case 'knowledge_graph': {
              const out = await runKnowledgeGraph({
                query: String(fcall.args.query ?? ''),
                limit: typeof fcall.args.limit === 'number' ? (fcall.args.limit as number) : undefined,
              })
              toolOutput = out
              costThisCall = 0
              citations = citations.concat(citationsFromKnowledgeGraph(out))
              cards.push(...cardsFromKnowledgeGraph(out))
              break
            }
            case 'geocode': {
              const out = await runGeocode({ address: String(fcall.args.address ?? '') })
              toolOutput = out
              costThisCall = GEOCODE_COST_USD
              // geocode is a utility — no card, no citation.
              break
            }
            case 'shopping_search': {
              const out = await runShoppingSearch({
                query: String(fcall.args.query ?? ''),
                max_results:
                  typeof fcall.args.max_results === 'number'
                    ? (fcall.args.max_results as number)
                    : undefined,
              })
              toolOutput = out
              costThisCall = SHOPPING_SEARCH_COST_USD
              citations = citations.concat(citationsFromShopping(out))
              cards.push(...cardsFromShopping(out))
              break
            }
            default:
              status = 'error'
              errorMessage = `unknown tool: ${fcall.name}`
              toolOutput = { error: errorMessage }
          }
        } catch (err) {
          status = 'error'
          errorMessage = err instanceof Error ? err.message : String(err)
          toolOutput = { error: errorMessage }
        }

        const duration = Date.now() - started
        totalCost += costThisCall

        emit({
          type: 'tool_call_end',
          tool: fcall.name,
          output: toolOutput,
          duration_ms: duration,
          summary: summariseToolOutput(fcall.name, toolOutput),
        })

        const { error: tcErr } = await adminClient.from('tool_calls').insert({
          message_id: placeholderId,
          tool_name: fcall.name,
          input: fcall.args as Record<string, unknown>,
          output: toolOutput as Record<string, unknown>,
          duration_ms: duration,
          cost_usd: costThisCall,
          status,
          error_message: errorMessage,
          step_number: iteration,
        })
        if (tcErr) {
          console.error('failed to log tool_call:', tcErr.message)
        }

        contents = [
          ...contents,
          { role: 'model', parts: [{ functionCall: fcall }] },
          {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: fcall.name,
                  response: toolOutput as Record<string, unknown>,
                },
              },
            ],
          },
        ]

        if (iteration >= MAX_ITERATIONS) {
          stopReason = 'iteration_cap'
          break
        }
        // loop again — Gemini now sees the tool response.
      }

      // If we broke because we exhausted iterations without a text reply,
      // ask Gemini once more with the accumulated context for the final
      // synthesis (no tools this time, force a text answer).
      if (stopReason !== 'text' && finalText.length === 0) {
        try {
          const synth = await callGemini({
            systemInstruction: {
              role: 'system',
              parts: [{ text: SYSTEM_INSTRUCTION }],
            },
            contents: [
              ...contents,
              {
                role: 'user',
                parts: [
                  {
                    text: 'Stop calling tools and write the final answer now, grounded in the tool outputs you already have.',
                  },
                ],
              },
            ],
          })
          finalText = extractText(synth)
        } catch (err) {
          console.error('final synthesis failed:', err instanceof Error ? err.message : String(err))
        }
      }

      if (stopReason === 'iteration_cap' && finalText.length > 0) {
        finalText += '\n\n_(Stopped after 5 steps — ask a follow-up to go deeper.)_'
      } else if (stopReason === 'circuit_breaker') {
        finalText +=
          (finalText.length > 0 ? '\n\n' : '') +
          '_(Stopped early due to time/cost budget — partial results.)_'
      }

      if (finalText.length === 0) {
        finalText = 'I could not produce a grounded answer this turn — please rephrase or try again.'
      }

      // Stream the answer to the client in small chunks so it animates.
      for (const piece of finalText.match(/.{1,80}/gs) ?? [finalText]) {
        emit({ type: 'token', text: piece })
      }

      const dedupedCards = dedupeCards(cards)
      const dedupedCitations = dedupeCitations(citations)

      const { error: updErr } = await adminClient
        .from('messages')
        .update({
          content: finalText,
          citations: dedupedCitations as unknown as Record<string, unknown>[],
          cards: dedupedCards as unknown as Record<string, unknown>[],
        })
        .eq('id', placeholderId)
      if (updErr) console.error('failed to finalize assistant message:', updErr.message)

      emit({ type: 'done' })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('agent-run error:', detail)
      emit({ type: 'error', message: 'agent failed — see server logs' })
    } finally {
      sse.close()
    }
  }

  runAgent()

  return resp
})
