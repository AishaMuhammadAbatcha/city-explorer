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

---

## Phase 5 — Memory & personalization

**Scope**:
- `/history` UI over persisted conversations
- User prefs table: default location, currency, radius, price range
- `saved_results` table
- Last N turns passed to Gemini for follow-ups

**Success criteria**: "show me more like that" works across turns · prefs survive logout/login.

**Effort**: 1 week

---

## Phase 6 — Directions & mobile handoff

**Scope**:
- "Get directions" on `PlaceCard` → `google.com/maps/dir/?api=1&destination=…` deep link
- Origin = browser geolocation when granted
- Inline Map on `PlaceCard` via `@vis.gl/react-google-maps` (already installed)
- Shareable conversation permalinks

**Success criteria**: one tap from result → Maps app on iOS/Android/web · share link renders full conversation.

**Effort**: 3–5 days

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
