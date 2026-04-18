// TR-ACE agent-run edge function (Phase 7 — hardening).
//
// Flow per request:
//   1. Verify user JWT, extract user_id.
//   2. Call get_daily_usage RPC. If the caller is over the rolling-
//      24h cost or request cap, emit an SSE `error` with a machine-
//      readable code + reset_at and close the stream (no work done,
//      no tokens burned).
//   3. Create-or-reuse a conversation, insert the user message.
//   4. Open an SSE stream back to the client.
//   5. Insert an empty assistant placeholder message so tool_calls
//      and llm_calls can FK to it as we go.
//   6. Loop up to 5 iterations (ReAct):
//      - Emit step_start.
//      - Call Gemini with current contents + tool declarations, log
//        an llm_calls row (tokens + cost + duration).
//      - If the response carries a functionCall, check the per-turn
//        and per-day budgets, execute the tool. On tool failure we
//        log a tool_calls row with status='error', emit a
//        tool_call_end carrying {error, message}, feed the same back
//        to Gemini as the functionResponse, and continue the loop.
//      - Otherwise break out with the final text.
//   7. Chunk the final text as tokens, dedupe cards, update the
//      placeholder message with content + citations + cards, emit
//      `done`.
//
// Per-turn circuit breakers (Phase 3):
//   - 5 iteration hard cap.
//   - 30 s wall clock.
//   - $0.05 accumulated tool cost.
//
// Per-user rolling-24h caps (Phase 7):
//   - $0.10 total cost (tool_calls + llm_calls).
//   - 50 user messages.
//
// Both layers coexist: the daily cap is checked up front and is also
// threaded through the turn so the final LLM synthesis won't be made
// if it would push the user past budget.

// @ts-expect-error Deno remote module, resolved at runtime.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders, handlePreflight } from './cors.ts'
import { createSSEStream, SSE_HEADERS, type SSEEvent } from './sse.ts'
import {
  callGemini,
  extractFunctionCall,
  extractText,
  extractUsage,
  GEMINI_MODEL,
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

// Phase 7 — per-user rolling-24h caps. Enforced at the top of the
// request (hard deny) AND tracked across the turn (truncate when the
// remaining budget would be exceeded by the next estimated call).
const DAILY_COST_CAP_USD = 0.10
const DAILY_REQUEST_CAP = 50

// Phase 7 — Gemini pricing constants (per 1K tokens, USD). Conservative
// public-tier numbers for gemini-2.0-flash. Used to cost each LLM
// invocation and feed the same daily cap that covers tool_calls.
const GEMINI_INPUT_COST_PER_1K = 0.0001
const GEMINI_OUTPUT_COST_PER_1K = 0.0004

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

// ---------------------------------------------------------------------
// Phase 7 helpers — daily caps + LLM logging.
// ---------------------------------------------------------------------

interface DailyUsage {
  total_cost_usd: number
  message_count: number
}

async function fetchDailyUsage(admin: SupabaseClient, userId: string): Promise<DailyUsage> {
  const { data, error } = await admin.rpc('get_daily_usage', { p_user_id: userId })
  if (error) {
    console.error('get_daily_usage rpc failed:', error.message)
    return { total_cost_usd: 0, message_count: 0 }
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return { total_cost_usd: 0, message_count: 0 }
  return {
    total_cost_usd: Number((row as { total_cost_usd?: unknown }).total_cost_usd ?? 0) || 0,
    message_count: Number((row as { message_count?: unknown }).message_count ?? 0) || 0,
  }
}

// Reset timestamp for the cap: 24h after the oldest qualifying record
// inside the current 24h window. For the rate cap we use messages; for
// the cost cap we pick the earlier of the oldest tool_calls row and
// the oldest llm_calls row. Falls back to now+24h on any error so the
// client always has a valid ISO timestamp.
async function userConversationIds(admin: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await admin.from('conversations').select('id').eq('user_id', userId)
  return ((data as { id: string }[] | null) ?? []).map((r) => r.id)
}

async function userMessageIds(admin: SupabaseClient, userId: string): Promise<string[]> {
  const convoIds = await userConversationIds(admin, userId)
  if (convoIds.length === 0) return []
  const { data } = await admin.from('messages').select('id').in('conversation_id', convoIds)
  return ((data as { id: string }[] | null) ?? []).map((r) => r.id)
}

async function computeRateResetAt(admin: SupabaseClient, userId: string): Promise<string> {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  try {
    const convoIds = await userConversationIds(admin, userId)
    if (convoIds.length > 0) {
      const { data } = await admin
        .from('messages')
        .select('created_at')
        .in('conversation_id', convoIds)
        .eq('role', 'user')
        .gt('created_at', windowStart)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      const oldest = (data as { created_at?: string } | null)?.created_at
      if (oldest) return new Date(new Date(oldest).getTime() + 24 * 60 * 60 * 1000).toISOString()
    }
  } catch (err) {
    console.error('computeRateResetAt failed:', err instanceof Error ? err.message : String(err))
  }
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

async function computeCostResetAt(admin: SupabaseClient, userId: string): Promise<string> {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const candidates: string[] = []
  try {
    const messageIds = await userMessageIds(admin, userId)
    if (messageIds.length > 0) {
      const { data: tc } = await admin
        .from('tool_calls')
        .select('created_at')
        .in('message_id', messageIds)
        .gt('created_at', windowStart)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      const t = (tc as { created_at?: string } | null)?.created_at
      if (t) candidates.push(t)

      const { data: lc } = await admin
        .from('llm_calls')
        .select('created_at')
        .in('message_id', messageIds)
        .gt('created_at', windowStart)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      const l = (lc as { created_at?: string } | null)?.created_at
      if (l) candidates.push(l)
    }
  } catch (err) {
    console.error('computeCostResetAt failed:', err instanceof Error ? err.message : String(err))
  }
  if (candidates.length === 0) return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const oldest = candidates.sort()[0]
  return new Date(new Date(oldest).getTime() + 24 * 60 * 60 * 1000).toISOString()
}

function geminiCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1000) * GEMINI_INPUT_COST_PER_1K +
    (outputTokens / 1000) * GEMINI_OUTPUT_COST_PER_1K
  )
}

interface LoggedGeminiCall {
  resp: Awaited<ReturnType<typeof callGemini>>
  input_tokens: number
  output_tokens: number
  cost_usd: number
  duration_ms: number
}

async function callGeminiLogged(
  admin: SupabaseClient,
  placeholderId: string,
  iteration: number | null,
  request: GeminiRequest,
): Promise<LoggedGeminiCall> {
  const started = Date.now()
  let resp: Awaited<ReturnType<typeof callGemini>> | null = null
  let status: 'success' | 'error' = 'success'
  let errorMessage: string | null = null
  try {
    resp = await callGemini(request)
  } catch (err) {
    status = 'error'
    errorMessage = err instanceof Error ? err.message : String(err)
  }
  const duration_ms = Date.now() - started
  const usage = resp ? extractUsage(resp) : {}
  const input_tokens = usage.promptTokenCount ?? 0
  const output_tokens = usage.candidatesTokenCount ?? 0
  const cost_usd = geminiCost(input_tokens, output_tokens)

  const { error: insErr } = await admin.from('llm_calls').insert({
    message_id: placeholderId,
    model: GEMINI_MODEL,
    input_tokens,
    output_tokens,
    duration_ms,
    cost_usd,
    iteration,
    status,
    error_message: errorMessage?.slice(0, 500) ?? null,
  })
  if (insErr) console.error('failed to log llm_call:', insErr.message)

  if (status === 'error' || !resp) {
    throw new Error(errorMessage ?? 'Gemini call failed')
  }

  return { resp, input_tokens, output_tokens, cost_usd, duration_ms }
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

// ---------------------------------------------------------------------
// Phase 5 helpers — personalization + prior-turn card summaries.
// ---------------------------------------------------------------------

interface UserPrefsRow {
  default_location: string | null
  currency: string | null
  search_radius_m: number | null
  price_range_min: number | string | null
  price_range_max: number | string | null
}

function buildPrefsBlock(row: UserPrefsRow): string {
  const lines: string[] = []
  if (row.default_location && row.default_location.trim().length > 0) {
    lines.push(`- Default location: ${row.default_location.trim()}`)
  }
  if (row.currency && row.currency.trim().length > 0) {
    lines.push(`- Currency preference: ${row.currency.trim()}`)
  }
  if (typeof row.search_radius_m === 'number' && row.search_radius_m > 0) {
    const km = row.search_radius_m / 1000
    const formatted = Number.isInteger(km) ? `${km}` : km.toFixed(1)
    lines.push(`- Search radius: ${formatted} km`)
  }
  const pmin = row.price_range_min != null ? Number(row.price_range_min) : null
  const pmax = row.price_range_max != null ? Number(row.price_range_max) : null
  if ((pmin != null && !Number.isNaN(pmin)) || (pmax != null && !Number.isNaN(pmax))) {
    const lo = pmin != null && !Number.isNaN(pmin) ? `$${pmin}` : '—'
    const hi = pmax != null && !Number.isNaN(pmax) ? `$${pmax}` : '—'
    lines.push(`- Price range: ${lo}–${hi}`)
  }
  if (lines.length === 0) return ''
  return [
    'User preferences:',
    ...lines,
    "Use these as defaults when the user's query is ambiguous about location, currency, radius, or price.",
  ].join('\n')
}

interface PriorCard {
  kind?: string
  id?: string
  title?: string
  name?: string
}

function titleOf(card: PriorCard): string {
  return (card.title ?? card.name ?? '').toString().trim()
}

function summarisePriorCards(cards: PriorCard[]): string {
  const byKind = new Map<string, PriorCard[]>()
  for (const c of cards) {
    if (!c || typeof c.kind !== 'string') continue
    const list = byKind.get(c.kind) ?? []
    list.push(c)
    byKind.set(c.kind, list)
  }
  if (byKind.size === 0) return ''
  const parts: string[] = []
  for (const [kind, list] of byKind) {
    const names = list
      .map(titleOf)
      .filter((t) => t.length > 0)
      .slice(0, 3)
    const titles = names.length > 0 ? ` (${names.join(', ')}...)` : ''
    parts.push(`${list.length} ${kind}s${titles}`)
  }
  return `[Previously shown: ${parts.join(', ')}]`
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

  // Open the SSE stream up front so cap errors can be delivered as SSE
  // events (the client renders them as friendly toasts with countdown
  // text rather than a raw 4xx).
  const sse = createSSEStream()
  const resp = new Response(sse.stream, {
    status: 200,
    headers: { ...corsHeaders(origin), ...SSE_HEADERS },
  })

  const runAgent = async () => {
    const emit = (e: SSEEvent) => sse.emit(e)
    try {
      // ------------------------------------------------------------
      // Phase 7 — daily cap pre-check. One RPC, hard deny on exceed.
      // ------------------------------------------------------------
      const usage = await fetchDailyUsage(adminClient, userId)

      if (usage.message_count >= DAILY_REQUEST_CAP) {
        const reset_at = await computeRateResetAt(adminClient, userId)
        emit({
          type: 'error',
          code: 'daily_rate_cap',
          reset_at,
          message: 'Daily search limit reached.',
        })
        return
      }
      if (usage.total_cost_usd >= DAILY_COST_CAP_USD) {
        const reset_at = await computeCostResetAt(adminClient, userId)
        emit({
          type: 'error',
          code: 'daily_cost_cap',
          reset_at,
          message: 'Daily cost limit reached.',
        })
        return
      }

      // Remaining daily budget — the turn is allowed to spend up to
      // this much more before we truncate.
      let runningDailyCost = usage.total_cost_usd

      // ------------------------------------------------------------
      // Create/reuse conversation and persist the user message.
      // ------------------------------------------------------------
      let conversationId = body.conversation_id
      if (!conversationId) {
        const title = body.message.slice(0, 60)
        const { data: convo, error: convoErr } = await userClient
          .from('conversations')
          .insert({ user_id: userId, title })
          .select('id')
          .single()
        if (convoErr || !convo) {
          throw new Error(`failed to create conversation: ${convoErr?.message ?? 'unknown'}`)
        }
        conversationId = convo.id as string
      } else {
        await userClient
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)
      }

      const { error: userMsgErr } = await userClient.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: body.message,
      })
      if (userMsgErr) {
        throw new Error(`failed to persist user message: ${userMsgErr.message}`)
      }

      emit({ type: 'conversation_id', id: conversationId })

      // ------------------------------------------------------------
      // Prior-turn context + user preferences (Phase 5).
      // ------------------------------------------------------------
      const { data: priorRows } = await userClient
        .from('messages')
        .select('role, content, cards, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20)

      const history: GeminiContent[] = (priorRows ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => {
          const role = m.role === 'assistant' ? ('model' as const) : ('user' as const)
          let text = m.content
          if (m.role === 'assistant' && Array.isArray(m.cards) && m.cards.length > 0) {
            const summary = summarisePriorCards(m.cards as PriorCard[])
            if (summary.length > 0) text = `${text}\n${summary}`
          }
          return { role, parts: [{ text }] }
        })

      const { data: prefsRow } = await adminClient
        .from('user_preferences')
        .select('default_location, currency, search_radius_m, price_range_min, price_range_max')
        .eq('user_id', userId)
        .maybeSingle()

      const prefsBlock = prefsRow ? buildPrefsBlock(prefsRow as UserPrefsRow) : ''
      const systemPromptText =
        prefsBlock.length > 0 ? `${SYSTEM_INSTRUCTION}\n\n${prefsBlock}` : SYSTEM_INSTRUCTION

      // Placeholder assistant row so tool_calls + llm_calls can FK to
      // it as we go.
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

      // Worst-case per-call cost is places_search. Used to decide
      // whether to even attempt the next tool given the remaining
      // daily budget.
      const MAX_TOOL_COST = PLACES_SEARCH_COST_USD

      let contents: GeminiContent[] = history
      const cards: Card[] = []
      let citations: Citation[] = []
      let totalCost = 0
      let iteration = 0
      let finalText = ''
      let stopReason: 'text' | 'iteration_cap' | 'circuit_breaker' | 'daily_budget' = 'text'
      const startTime = Date.now()

      while (iteration < MAX_ITERATIONS) {
        iteration += 1
        const label = iteration === 1 ? 'Planning' : `Step ${iteration}`
        emit({ type: 'step_start', iteration, label })

        const reqPayload: GeminiRequest = {
          systemInstruction: { role: 'system', parts: [{ text: systemPromptText }] },
          tools,
          contents,
        }
        const logged = await callGeminiLogged(adminClient, placeholderId, iteration, reqPayload)
        runningDailyCost += logged.cost_usd
        const fcall = extractFunctionCall(logged.resp)

        if (!fcall) {
          finalText = extractText(logged.resp)
          stopReason = 'text'
          break
        }

        // Per-turn circuit breakers (Phase 3).
        if (Date.now() - startTime > MAX_WALL_CLOCK_MS || totalCost > MAX_TURN_COST_USD) {
          stopReason = 'circuit_breaker'
          finalText = extractText(logged.resp)
          break
        }

        // Per-user daily budget (Phase 7). If the worst-case next tool
        // would push us over, truncate this turn cleanly so the user
        // still gets whatever we've already gathered.
        if (runningDailyCost + MAX_TOOL_COST > DAILY_COST_CAP_USD) {
          stopReason = 'daily_budget'
          finalText = extractText(logged.resp)
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
              toolOutput = { error: true, message: errorMessage }
          }
        } catch (err) {
          // Phase 7 — tool failure is never fatal. We record it, tell
          // the UI, feed a structured error back to Gemini so the ReAct
          // loop can try a different tool, and keep going.
          status = 'error'
          errorMessage = err instanceof Error ? err.message : String(err)
          toolOutput = {
            error: true,
            message: `Tool failed: ${fcall.name}. Details: ${errorMessage?.slice(0, 200) ?? ''}`,
          }
          costThisCall = 0
        }

        const duration = Date.now() - started
        totalCost += costThisCall
        runningDailyCost += costThisCall

        const isError = status !== 'success'
        emit({
          type: 'tool_call_end',
          tool: fcall.name,
          output: toolOutput,
          duration_ms: duration,
          summary: summariseToolOutput(fcall.name, toolOutput),
          ...(isError
            ? { error: true, error_message: errorMessage?.slice(0, 200) ?? undefined }
            : {}),
        })

        const { error: tcErr } = await adminClient.from('tool_calls').insert({
          message_id: placeholderId,
          tool_name: fcall.name,
          input: fcall.args as Record<string, unknown>,
          output: toolOutput as Record<string, unknown>,
          duration_ms: duration,
          cost_usd: costThisCall,
          status,
          error_message: errorMessage?.slice(0, 500) ?? null,
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

      // If we broke without a text reply, ask Gemini once more with the
      // accumulated context for the final synthesis (no tools this
      // time, force a text answer) — but only if the daily budget still
      // allows a small Gemini call.
      if (stopReason !== 'text' && finalText.length === 0) {
        if (runningDailyCost < DAILY_COST_CAP_USD) {
          try {
            const synth = await callGeminiLogged(adminClient, placeholderId, null, {
              systemInstruction: {
                role: 'system',
                parts: [{ text: systemPromptText }],
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
            runningDailyCost += synth.cost_usd
            finalText = extractText(synth.resp)
          } catch (err) {
            console.error('final synthesis failed:', err instanceof Error ? err.message : String(err))
          }
        }
      }

      if (stopReason === 'iteration_cap' && finalText.length > 0) {
        finalText += '\n\n_(Stopped after 5 steps — ask a follow-up to go deeper.)_'
      } else if (stopReason === 'circuit_breaker') {
        finalText +=
          (finalText.length > 0 ? '\n\n' : '') +
          '_(Stopped early due to time/cost budget — partial results.)_'
      } else if (stopReason === 'daily_budget') {
        finalText +=
          (finalText.length > 0 ? '\n\n' : '') + '_(Stopped — daily budget reached.)_'
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
      emit({ type: 'error', code: 'internal', message: 'agent failed — see server logs' })
    } finally {
      sse.close()
    }
  }

  runAgent()

  return resp
})
