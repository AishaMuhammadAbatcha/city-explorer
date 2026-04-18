# TR-ACE Roadmap

> **Pivot**: From a city-discovery app to an agentic AI search assistant that finds "everything" online — products, places, facts, videos — via deep Google API integration with Gemini as the reasoning layer.

## Vision

Single conversational surface. User asks anything in natural language; an agent decomposes the query, routes to the right Google API(s), synthesizes with Gemini, and returns typed result cards (`ProductCard`, `PlaceCard`, `VideoCard`, `ArticleCard`, `AnswerCard`). The breadth of Google-API integration is the moat.

## Decisions (locked — MVP, lowest cost)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Business-side feature set | **Delete entirely** | User directive; eliminates whole code paths |
| 2 | Shopping data source | **schema.org JSON-LD parsing only** | Free; no SerpAPI or Merchant Center fees |
| 3 | Daily cost ceiling per user | **$0.10/day** | Fits inside Google free tiers for early users |
| 4 | v1 must-have | **Places + web search** | Maps already integrated; shopping deferred to Phase 4 |
| 5 | Auth model | **Anonymous-first, login only to persist** | Lower friction + cheaper infra |
| 6 | LLM provider | **Gemini only** | Already in deps; generous free tier; native function-calling |

### Google API budget tier (MVP-friendly)

| API | Free tier | Used in |
|-----|-----------|---------|
| Programmable Search | 100 queries/day | Phase 2 |
| Places Nearby Search (basic) | Free with basic fields | Phase 2 |
| Geocoding | 40K/month | Phase 3 |
| YouTube Data API | 10K units/day | Phase 3 |
| Knowledge Graph Search | Free | Phase 3 |
| Gemini (gemini-2.0-flash) | 15 RPM free | Every phase |

Anything paid (Place Details, Shopping API, SerpAPI) stays out of MVP.

---

## Phase 1 — Demolish & refoundation

**Goal**: strip the app to auth + empty search shell. No business code, no role branching, no unused pages.

**Delete**:
- `src/roles/business/`, `src/roles/admin/`, `src/components/business/`, `src/components/admin/`, `src/components/reviews/`, `src/components/recommendations/`, `src/components/notifications/`, `src/components/places/` (rebuilt in Phase 3)
- All of `src/services/` except `geminiService.ts` and `maps/`
- Legacy dirs: `src/auth/`, `src/context/`, `src/custom-components/`, `src/stores/`
- `src/roles/individual/pages/{Dashboard,Explore,ExploreAI,ExploreMaps,PaymentPage,Interests,Profile,EditProfile}.tsx`
- `src/hooks/{useNotifications,usePlaces,useRecommendations}.ts`

**Modify**:
- `src/routers/Router.tsx` → 3 routes only (`/`, `/settings`, auth)
- `src/contexts/AuthContext.tsx` → remove role logic
- `src/types/database.ts` → drop `role` from `profiles`, drop legacy table types
- `src/layout/dashboard/*` → minimal shell (no role-based nav)
- `src/pages/auth/{Login,Signup}.tsx` → no role selection

**New**:
- `src/pages/Search.tsx` — `/` placeholder ("Ask me anything — coming soon")
- `src/pages/Settings.tsx` — `/settings` minimal profile editor
- `supabase/migrations/005_drop_legacy_tables.sql` — drop `businesses`, `events`, `deals`, `bookings`, `reviews`, `favorites`, `notifications`; drop `role` column from `profiles`

**Success criteria**: `npm run build` green · `npm run lint` no new errors · login works · `/` shows placeholder · no dead-code references.

**Effort**: 3–5 days / 1 agent run

---

## Phase 2 — Search core MVP

**Goal**: user types a query, receives a Gemini-synthesized answer grounded in ≥1 tool call. Streamed.

**Scope**:
- New Edge Function `supabase/functions/agent-run` (Deno + Gemini SDK, function-calling enabled)
- Tools v1: `web_search` (Programmable Search), `places_search` (Maps Places)
- Tables: `conversations`, `messages`, `tool_calls` with RLS
- Chat UI on `/` with SSE streaming
- `AnswerCard` component (markdown + inline citations)

**Success criteria**: end-to-end query → streamed answer with ≥1 citation · RLS enforced · cost per query logged.

**Effort**: 1–2 weeks

**Status**: Implemented 2026-04-18. Commits (oldest → newest):

- `4ffa94fd` db: add agent core tables (conversations, messages, tool_calls)
- `245de0b8` types: add agent database + SSE event types
- `e094555a` chore: remove edge functions that depended on dropped tables
- `25142508` feat: add agent-run edge function with web_search and places_search tools
- `bec656a8` feat: add useAgentStream and useConversation hooks
- `249ad990` feat: implement chat UI on /search with streaming
- `89389431` feat: enable anonymous sign-in on app load

Runtime prerequisites (not performed by the agent run): enable
anonymous sign-ins in Supabase, apply migration 006, set
`GEMINI_API_KEY` / `GOOGLE_API_KEY` / `GOOGLE_CSE_ID` with
`supabase secrets set`, deploy the `agent-run` function.

---

## Phase 3 — Agentic planner

**Goal**: multi-step reasoning — decompose, pick N tools, aggregate.

**Scope**:
- Plan-then-act loop in `agent-run` (max 5 steps, hard budget cap)
- Tool registry: `youtube_search`, `knowledge_graph`, `geocode`, `directions`, `maps_embed`
- Typed cards: `PlaceCard`, `VideoCard`, `ArticleCard`, `ProductCard` (stub)
- Visible step-trace UI ("Step 1/3: Searching…")

**Success criteria**: "best ramen in Lagos with directions" returns 3+ places with embedded Maps + one-click directions · p95 cost ≤ $0.02/query.

**Effort**: 1–2 weeks

**Status**: Implemented 2026-04-18. Commits (oldest → newest):

- `697b4f5d` db: add cards column and step_number for multi-step agent
- `6bccfa52` types: add Card union and step_start SSE event
- `1403759b` feat: add youtube_search, knowledge_graph, geocode tools
- `52fff1a2` feat: multi-step ReAct loop in agent-run with cost and iteration caps
- `5c3085fc` feat: add typed result card components
- `e6a0eec6` feat: add step trace UI for multi-step agent
- `55cf2dda` feat: wire multi-step events into chat UI

Sub-decisions (locked during execution):

- ReAct loop (no plan-first phase).
- Caps: 5 iterations · 30 s wall clock · $0.05 per-turn tool cost.
- New tools: `youtube_search`, `knowledge_graph`, `geocode` — no
  `directions` tool; Phase 6 ships the free deep-link pattern and
  `PlaceCard` already uses it.
- Cards come from structured tool outputs, not LLM inference. Kinds:
  `place`, `video`, `article`, `product` (product stub — Phase 4 fills
  it from schema.org/Product).
- Embedded inline maps deferred to Phase 6 to keep latency down.

Runtime prerequisites (not performed by the agent run):

1. Apply migration `007_multi_step_agent.sql`.
2. Enable three additional Google APIs in the same GCP project that
   holds `GOOGLE_API_KEY`: **YouTube Data API v3**, **Knowledge Graph
   Search API**, **Geocoding API**.
3. Redeploy the edge function: `supabase functions deploy agent-run`.

---

## Phase 4 — Shopping & seller data (riskiest)

**Goal**: "find me a [product] with price and seller."

**Scope**:
- Fetch top web-search results, parse `schema.org/Product` JSON-LD
- Extract price, currency, seller, buy URL into `ProductCard`
- Seller contact from `schema.org/Organization` metadata
- No paid shopping APIs (per locked decision)

**Success criteria**: ≥70% of top-20 product pages yield a parseable Product JSON-LD · ProductCard shows image/price/seller/buy URL · scraping stays on public SERP pages + schema.org metadata only.

**Effort**: 2 weeks

**Risks**: structured-data gaps; hallucinated prices when data is thin.

**Status**: Implemented 2026-04-18. Commits (oldest → newest):

- `c1a7663e` feat: add HTML fetch + schema.org JSON-LD extractors
- `f1725aa7` feat: add shopping_search tool with JSON-LD parsing
- `67fe0d59` feat: register shopping_search in agent-run tool registry
- `17cd93bf` types: extend ProductCard with price and verification fields
- `e011d9da` feat: render real ProductCard with verified price and seller
- `a8b85c64` style: avoid unused-var destructure in schemaOrg @graph flatten

Sub-decisions (locked during execution):

- No headless browser; raw `fetch` only. JS-rendered-only JSON-LD is
  an accepted miss.
- No paid shopping APIs — reuse Programmable Search + manual
  schema.org/Product + schema.org/Organization parsing.
- LLM writes the shopping query verbatim; tool signature
  `shopping_search(query, max_results?=5)`.
- Per-URL cap: 3 s fetch timeout, 2 MB body, follow redirects; robots.txt
  checked with a 2 s timeout and fail-open (10 min per-origin cache).
- Overall tool cap: 12 s wall clock, inside the 30 s turn budget.
- `Promise.allSettled` for parallel URL fetches so one stuck site
  cannot stall the batch.
- User-Agent: `TR-ACE-Agent/1.0 (+https://tr-ace.dev/bot; schema.org
  product metadata reader)`.
- Only products with an extractable price are returned; prices are
  never synthesized.
- System-prompt guardrails added: shopping_search is required for
  product queries, and the model must not quote a price / seller /
  contact not present in tool output.

Runtime prerequisites (not performed by the agent run):

1. No new environment variables or Google Cloud APIs.
2. Redeploy the edge function: `supabase functions deploy agent-run`.

Expected real-world hit rate: 40–70% of result pages yield parseable
JSON-LD in practice. Amazon/Walmart frequently block datacenter IPs
and return 503/captcha — accepted limitation for MVP.

---

## Phase 5 — Memory & personalization

**Scope**:
- `/history` UI over persisted conversations
- User prefs table: default location, currency, radius, price range
- `saved_results` table
- Last N turns passed to Gemini for follow-ups

**Success criteria**: "show me more like that" works across turns · prefs survive logout/login.

**Effort**: 1 week

**Status**: Implemented 2026-04-18. Commits (oldest → newest):

- `28a52dd9` db: add user_preferences and saved_results tables
- `86faaace` types: add user_preferences and saved_results database types
- `eccab8a4` feat: add hooks for preferences, saved results, and conversation list
- `6bf95e68` feat: personalize agent with user prefs and prior-turn card summaries
- `ff561047` feat: add SaveButton overlay for cards
- `376a7292` feat: add /history conversation list page
- `d9304b7c` feat: add /saved results page
- `2af44152` feat: preferences form and anonymous-account upgrade in Settings

Sub-decisions (locked during execution):

- Two new tables: `user_preferences` (PK = user_id) and
  `saved_results` (one row per bookmark). Dedupe on `saved_results`
  via a unique expression index on `(user_id, card->>'kind',
  card->>'id')` — no generated columns.
- Preferences injected into the system prompt only for fields the user
  has actually set; null fields are skipped. If all fields are null,
  no block is emitted.
- Follow-up context: for each assistant message in the last-10 window
  that had cards, a transient one-line summary
  `[Previously shown: N places (Title A, Title B, Title C...), M videos]`
  is appended to the text passed to Gemini. One line per kind.
  Never written back to the DB.
- `saved_results` are deliberately NOT fetched into the agent context —
  out of Phase 5 scope.
- `/history` and `/saved` are standalone pages (not Settings tabs) and
  capped at 50 rows with no pagination.
- Save button is a small bookmark icon overlay at top-right of each
  card. Anonymous users see a disabled icon with a "Sign in to save"
  tooltip.
- Deleting a conversation on `/history` uses the existing FK cascade
  to drop its messages and tool_calls.
- Anonymous-to-permanent upgrade UI lives as a Settings section that
  calls the existing `upgradeAnonymous` helper from Phase 2; rendered
  only when `isAnonymous === true`.

Runtime prerequisites (not performed by the agent run):

1. Apply migration `008_memory_and_preferences.sql`.
2. Redeploy the edge function: `supabase functions deploy agent-run`.
3. No new environment variables or Google Cloud APIs.

---

## Phase 6 — Directions & mobile handoff

**Scope**:
- "Get directions" on `PlaceCard` → `google.com/maps/dir/?api=1&destination=…` deep link
- Origin = browser geolocation when granted
- Inline Map on `PlaceCard` via `@vis.gl/react-google-maps` (already installed)
- Shareable conversation permalinks

**Success criteria**: one tap from result → Maps app on iOS/Android/web · share link renders full conversation.

**Effort**: 3–5 days

**Status**: Implemented 2026-04-18. Commits (oldest → newest):

- `17862afc` db: add share_slug and shared flag for public conversation sharing
- `5c815482` types: extend conversations with share_slug and shared fields
- `fbcaed1e` feat: mount Google Maps APIProvider at app root; add useGeolocation hook
- `40b7d612` feat: render inline interactive map inside PlaceCard
- `851c060d` feat: pre-fill origin in Maps directions URL when geolocation granted
- `6a7f0976` feat: add readOnly prop to cards to hide SaveButton on share pages
- `695127a0` feat: add useShareConversation hook + share button
- `40400554` feat: add public /share/:slug read-only conversation view

Sub-decisions (locked during execution):

- Inline map is a live `@vis.gl/react-google-maps` `Map` + `AdvancedMarker`
  at a fixed 180px height, `gestureHandling="cooperative"` and
  `disableDefaultUI` for compactness. No static-image fallback — MVP
  accepts one map load per PlaceCard.
- `APIProvider` is mounted once at app root inside
  `ThemeProvider > AuthProvider` so public (`/share/:slug`) and
  protected trees share the same Maps JS context. Missing
  `VITE_GOOGLE_MAPS_API_KEY` logs a single warning rather than blocking
  boot; missing `VITE_MAP_ID` skips the map on each card.
- Geolocation is lazy: requested only on Directions click via
  `useGeolocation`, which first consults
  `navigator.permissions.query({name:"geolocation"})` to skip a prompt
  when already granted/denied. Successful fixes are cached at module
  scope so a second click in the same session doesn't re-request.
  `getCurrentPosition` options: `enableHighAccuracy:false`,
  `timeout:5000`, `maximumAge:300000`. Denial or timeout opens Maps
  without `origin`.
- Sharing is an additive migration: `conversations.shared` boolean and
  `conversations.share_slug` uuid (unique, partial index). Two new
  public SELECT policies — one on `conversations`, one on `messages` —
  grant anon read when `shared=true`. Existing owner-only policies are
  untouched. `tool_calls` are deliberately NOT exposed publicly; the
  share page renders messages + cards only.
- Share slugs are lazily generated on the first share and reused on
  unshare → re-share so a link stays stable across toggle cycles.
- `/share/:slug` is mounted at the PUBLIC route tree (outside
  `ProtectedRoute`). It fetches with the anon Supabase client, renders
  `MessageList`/`MessageBubble`/`CardGrid` with `readOnly=true`, and
  omits `ChatInput`.
- `readOnly` prop threads from `MessageList` → `MessageBubble` →
  `CardGrid` → each of `PlaceCard`/`VideoCard`/`ArticleCard`/`ProductCard`.
  When true, `SaveButton` is not rendered.
- Share UI lives in two places: a compact icon on each `/history` row
  and a full-label button in the Search page header whenever a
  conversation is loaded. Either click runs `share`, copies the URL to
  clipboard, and fires a sonner toast.

Runtime prerequisites (not performed by the agent run):

1. Apply migration `009_conversation_sharing.sql`.
2. No new environment variables, Google Cloud APIs, or secrets.
3. No edge-function redeploy — Phase 6 is client-only.

Cost note: each `PlaceCard` triggers one Maps JS load. At the current
free tier (≈28.5K loads/month) this supports ~5,700 search results per
month at 5 places per search — comfortably within the $0.10/day/user
budget from Phase 7.

Deferred items: embedded Directions inline with a polyline; multi-stop
routes; QR codes on share links; explicit "revoke/re-issue" of share
slugs; making `tool_calls` visible on public share pages.

---

## Phase 7 — Hardening

**Scope**:
- Per-user daily rate limits (enforced in `agent-run`)
- Per-user daily $0.10 cost cap
- Tool-failure graceful degradation (partial results + note)
- Structured logging of every tool call to `tool_calls`
- Analytics: volume, tool-hit rates, latency, cost-per-query

**Success criteria**: synthetic abuse user cannot exceed $0.10/day · every Google API failure returns a user-visible partial-result state.

**Effort**: 1 week

---

## Cross-cutting risks

- **Cost runaway** — hard caps in Phase 7; watch spend earlier.
- **Latency** — multi-step agent 8–15s. Stream tokens, show skeletons.
- **Hallucination** — system prompt enforces "cite or say you don't know"; every claim surfaces source URL.
- **Structured-data gaps** — Phase 4 fallback: "I couldn't find a verified price" rather than guess.
- **Scraping legality** — stay on public SERP pages + schema.org metadata; no authenticated crawls.

## Out of scope (explicitly)

- Multi-user workspaces / teams
- Mobile native apps
- Paid shopping APIs (SerpAPI, Merchant Center)
- Voice input, image-based search
- Direct checkout / payments inside TR-ACE
- Non-Google search sources
