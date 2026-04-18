# agent-run

Edge function that powers TR-ACE's search. Accepts a user message +
optional conversation id, drives a multi-step ReAct loop against
Gemini (up to 5 tool calls per turn), streams step/trace/token events
back as Server-Sent Events, and persists the turn with typed result
cards.

**Tools registered**: `web_search`, `places_search`, `youtube_search`,
`knowledge_graph`, `geocode`, `shopping_search`.

**Per-turn circuit breakers** (Phase 3): 5-iteration hard cap, 30 s
wall clock, $0.05 accumulated tool cost. Exceeding any of these ends
the loop and appends a truncation note to the final answer. Phase 7
adds per-user daily caps on top.

## Caps and limits

Phase 7 enforces two rolling-24h caps per user on top of the per-turn
circuit breakers. Both are checked at the top of every request via a
single `get_daily_usage(p_user_id)` RPC:

| Cap                | Value  | Covers                              | SSE error code    |
|--------------------|--------|-------------------------------------|-------------------|
| Daily cost         | $0.10  | `tool_calls.cost_usd` + `llm_calls.cost_usd` | `daily_cost_cap`  |
| Daily request rate | 50     | `messages.role='user'` in the last 24h | `daily_rate_cap`  |

When a cap is hit, the edge function emits an SSE `error` event with
the code above and an ISO `reset_at` timestamp (24h after the oldest
qualifying record) and closes the stream — no work is done and no
tokens are spent. The client renders a `sonner` toast with a friendly
countdown.

### Gemini pricing constants

Hardcoded in `index.ts` for cost tracking:

```ts
const GEMINI_INPUT_COST_PER_1K  = 0.0001   // $0.10/1M input tokens
const GEMINI_OUTPUT_COST_PER_1K = 0.0004   // $0.40/1M output tokens
```

Token counts come from `usageMetadata.promptTokenCount` and
`usageMetadata.candidatesTokenCount` on each Gemini response; absent
fields default to 0.

### Graceful tool failures

Each tool executor is wrapped in `try/catch`. On failure the function:

1. Logs a `tool_calls` row with `status='error'` and the truncated
   error message.
2. Emits `tool_call_end` with `{ error: true, error_message }` so the
   UI can render an amber warning row in `StepTrace`.
3. Feeds `{ error: true, message }` back to Gemini as the
   `functionResponse` payload so the ReAct loop can acknowledge the
   failure and try a different tool.

Only an error from the Gemini API itself aborts the turn.

### pg function dependency

Migration `010_hardening.sql` must be applied before deploying this
version of the function. It creates:

- `llm_calls` table (Gemini invocations; RLS SELECT by owner, service-
  role INSERT only).
- `get_daily_usage(p_user_id uuid)` — `SECURITY DEFINER` aggregation
  returning `{ total_cost_usd, message_count }`. `EXECUTE` is revoked
  from `PUBLIC`/`anon`/`authenticated` and granted only to
  `service_role`, so the caps are tamper-proof from the browser.

## Required secrets

Set the following with the Supabase CLI before deploying. They are
never exposed to the browser — the edge function reads them from
`Deno.env`.

```sh
supabase secrets set \
  GEMINI_API_KEY=... \
  GOOGLE_API_KEY=... \
  GOOGLE_CSE_ID=...
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
are injected by the Supabase platform automatically — you do not need
to set them.

## Local development

```sh
# Copy your secrets into .env.local (never committed)
cat > supabase/.env.local <<'EOF'
GEMINI_API_KEY=...
GOOGLE_API_KEY=...
GOOGLE_CSE_ID=...
EOF

supabase functions serve agent-run --env-file supabase/.env.local
```

Then call `http://localhost:54321/functions/v1/agent-run` from the
Vite dev server with a valid user JWT in the `Authorization` header.

## Required Google Cloud setup

In the same Google Cloud project, enable:

1. **Custom Search JSON API** — backs `web_search`. Free tier: 100
   queries/day.
2. **Places API (New)** — backs `places_search`. Free tier: 10K Text
   Search (basic) calls/month.
3. **YouTube Data API v3** — backs `youtube_search`. Free tier:
   10,000 quota units/day (a search call is 100 units).
4. **Knowledge Graph Search API** — backs `knowledge_graph`. Free for
   low-volume use.
5. **Geocoding API** — backs `geocode`. Free tier: 40K calls/month,
   then $0.005/call.
6. **Generative Language API** — backs Gemini. Free tier: 15 RPM on
   `gemini-2.0-flash`.

Create a **Programmable Search Engine** at
<https://programmablesearchengine.google.com/controlpanel/create>.
Enable "Search the entire web" in settings. Copy the Search engine
ID (the `cx` value) into `GOOGLE_CSE_ID`.

Create one API key and restrict it to APIs (1)–(5) above — that
single key is used for `GOOGLE_API_KEY` across every Google-data
tool. `GEMINI_API_KEY` is the same or a different key with the
Generative Language API enabled.

## Supabase dashboard

Enable **Anonymous sign-ins** under Auth → Providers → Anonymous. The
client calls `supabase.auth.signInAnonymously()` on load, so every
visitor has a JWT to authorize the edge function with.

## Request contract

```http
POST /functions/v1/agent-run
Authorization: Bearer <user_jwt>
Content-Type: application/json

{ "message": "best ramen in Lagos", "conversation_id": null }
```

Response is `text/event-stream`. Event types:

- `conversation_id` — emitted first with the canonical id
- `step_start` — new ReAct iteration began (`iteration`, `label`)
- `tool_call_start` — a tool is executing
- `tool_call_end` — tool finished with output, duration_ms, summary
- `token` — incremental answer text
- `done` — final marker
- `error` — fatal; stream is closed after this

## shopping_search

Phase 4 tool. Fetches top Programmable Search results for a product
query and parses `schema.org/Product` JSON-LD out of each page to
build a verified `ProductCard` list.

- **No new env vars and no new Google Cloud APIs.** Reuses the existing
  Programmable Search quota (one CSE call per invocation, logged as
  $0.005); page fetches are direct HTTP and cost nothing.
- Relies on publisher-provided `application/ld+json` blocks. No
  headless browser — pages that render Product metadata via JavaScript
  will be missed. Expected real-world hit rate is 40–70%.
- Per-URL caps: **3 s fetch timeout**, **2 MB body** (streamed,
  aborted on overflow), redirects followed up to the platform default.
- Overall tool cap: **12 s wall clock** via an outer AbortController
  racing `Promise.allSettled` over the parallel fetches, so the tool
  fits inside the 30 s turn budget even when several sites hang.
- **robots.txt is honored with fail-open semantics**: 2 s fetch
  timeout, 10 min per-origin cache; any network or parse failure
  allows the fetch to proceed.
- User-Agent:
  `TR-ACE-Agent/1.0 (+https://tr-ace.dev/bot; schema.org product metadata reader)`.
- Products without an extractable price are dropped. The tool never
  synthesizes a price; the system prompt enforces the same rule on
  the model side.

Expect fewer products than `max_results` when many of the top N
organic results are JS-rendered, datacenter-blocked (Amazon/Walmart
often 503 datacenter IPs), or simply lack Product markup.

## Memory & personalization

Phase 5 additions. Before each turn the edge function reads the
caller's `user_preferences` row (service-role query scoped by
`user_id`) and appends a "User preferences" block to the system
prompt listing only the fields the user has set — `default_location`,
`currency`, `search_radius_m`, and `price_range_min`/`price_range_max`.
If no row exists, or every field is null, the prompt is sent
unchanged. The prior-turn context window (the last 10 messages passed
to Gemini) is also enriched: for each assistant message with a
non-empty `cards` array, a transient one-line summary like
`[Previously shown: 5 places (Place A, Place B, Place C...), 3 videos]`
is appended to the message text so follow-ups like "show me more like
that" land grounded. The summary is never written back to
`messages.content`.

## Phase scope reminder

- **Phase 2:** at most one tool call per turn.
- **Phase 3:** ReAct loop, 5 tools, 5-step/30s/$0.05 per-turn
  caps, typed result cards on `messages.cards`.
- **Phase 4:** `shopping_search` + schema.org/Product parsing,
  server-formatted price strings, shopping guardrails in the system
  prompt.
- **Phase 5 (this):** `user_preferences` injected into the system
  prompt, prior-turn card summaries appended to the 10-message
  context window. `saved_results` are deliberately NOT fetched into
  agent context.
- **Phase 7:** per-user $0.10/day cap enforced here.
