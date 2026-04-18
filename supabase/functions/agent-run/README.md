# agent-run

Edge function that powers TR-ACE's search. Accepts a user message +
optional conversation id, asks Gemini for a response, runs at most
one tool call (`web_search` or `places_search`), streams the synthesis
back as Server-Sent Events, and persists the turn.

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
3. **Generative Language API** — backs Gemini. Free tier: 15 RPM on
   `gemini-2.0-flash`.

Create a **Programmable Search Engine** at
<https://programmablesearchengine.google.com/controlpanel/create>.
Enable "Search the entire web" in settings. Copy the Search engine
ID (the `cx` value) into `GOOGLE_CSE_ID`.

Create one API key and restrict it to the three APIs above — that
single key is used for `GOOGLE_API_KEY` (both Custom Search and
Places) and separately `GEMINI_API_KEY` is the same or a different
key with Generative Language API enabled.

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
- `tool_call_start` — a tool is executing
- `tool_call_end` — tool finished with output + duration_ms
- `token` — incremental answer text
- `done` — final marker
- `error` — fatal; stream is closed after this

## Phase scope reminder

- **Phase 2 (this):** at most one tool call per turn. Cost tracking
  is log-only.
- **Phase 3:** multi-step plan/act loop, more tools, hard budget
  per query.
- **Phase 7:** per-user $0.10/day cap enforced here.
