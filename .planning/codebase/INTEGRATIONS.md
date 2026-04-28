# External Integrations

**Analysis Date:** 2026-04-28

## APIs & External Services

**Supabase:**
- Database & Auth - Core backend service
  - Endpoint: `VITE_SUPABASE_URL` (env var)
  - Client: `@supabase/supabase-js@2.57.4`
  - Auth: Anonymous sign-ins enabled (every visitor auto-authenticated)
  - Integration point: `src/lib/supabase.ts` exports typed client

**Google Maps & Places:**
- Google Maps JavaScript API - Map rendering with AdvancedMarker
  - Client: `@vis.gl/react-google-maps@1.5.5`
  - API Key: `VITE_GOOGLE_MAPS_API_KEY` (env var)
  - Map ID: `VITE_MAP_ID` (env var, custom map styling)
  - Integration: `src/main.tsx` wraps app in `<APIProvider>`; map component in `src/components/chat/cards/PlaceCard.tsx`

- Places API (New) - Trending places + location search
  - Used in: Supabase edge function `supabase/functions/trending-places/index.ts`
  - API Key: `GOOGLE_PLACES_API_KEY` (server secret, set via `supabase secrets set`)
  - Search call cost: $0.025/request
  - Caching: 24h TTL in `trending_cache` table (6 category searches per location rounded to 3 decimals)

**Google Search & Knowledge:**
- Custom Search JSON API - Web search tool
  - Used in: agent-run edge function for `web_search` tool
  - API Key: `GOOGLE_API_KEY` (server secret, shared for all Google Data APIs)
  - Free tier: 100 queries/day
  - Search engine: `GOOGLE_CSE_ID` (Programmable Search Engine ID, set via `supabase secrets set`)

- Knowledge Graph Search API - Knowledge lookup
  - Used in: agent-run edge function for `knowledge_graph` tool
  - API Key: `GOOGLE_API_KEY` (shared)
  - Free for low-volume use

**YouTube Data API v3:**
- Video search tool in agent-run
  - Used in: agent-run edge function for `youtube_search` tool
  - API Key: `GOOGLE_API_KEY` (shared)
  - Free tier: 10,000 quota units/day (search = 100 units)

**Google Geocoding API:**
- Location geocoding in agent-run
  - Used in: agent-run edge function for `geocode` tool
  - API Key: `GOOGLE_API_KEY` (shared)
  - Free tier: 40,000 calls/month, then $0.005/call

**Google Generative Language API (Gemini):**
- Browser-side (optional): `@google/generative-ai@0.24.1`
  - API Key: `VITE_GEMINI_API_KEY` (optional, client-side)
  - Model: gemini-2.0-flash-exp
  - Used in: `src/services/geminiService.ts` (fallback for local chat responses)
  - Fallback: Mock responses if key missing

- Server-side (agent-run): Gemini API with full ReAct loop
  - API Key: `GEMINI_API_KEY` (server secret, set via `supabase secrets set`)
  - Model: gemini-2.0-flash-exp
  - Cost tracking: $0.0001/1k input tokens, $0.0004/1k output tokens
  - Used in: `supabase/functions/agent-run/index.ts`

## Data Storage

**Primary Database:**
- Supabase PostgreSQL
  - Tables:
    - `profiles` - User account data (id, email, full_name, avatar_url, phone, address, city, timestamps)
    - `conversations` - Chat sessions (id, user_id, title, shared, share_slug, timestamps)
    - `messages` - Chat messages (id, conversation_id, role, content, citations JSON, cards JSON, created_at)
    - `tool_calls` - Agent tool execution logs (id, message_id, tool_name, input, output, status, cost, duration_ms, error_message)
    - `user_preferences` - Personalization (user_id, default_location, currency, search_radius_m, price_range_min/max)
    - `saved_results` - Bookmarked search results (user_id, type, title, data JSON)
    - `llm_calls` - Gemini invocation logs (user_id, tokens in/out, cost_usd, duration_ms)
    - `trending_cache` - Cached trending places (location hash, category, results JSON, expires_at)

  - Connection: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  - Security: RLS on all tables; service-role only for certain operations (daily usage cap, cost tracking)
  - Migrations: `supabase/migrations/001_*.sql` through `011_trending_cache.sql`

**File Storage:**
- None currently implemented; app is fully stateless except for Supabase database

**Caching:**
- Database-backed: `trending_cache` table with 24h TTL (Places API results)
- Client-side: React component state (no Redux)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built on PostgreSQL)
  - Anonymous sign-ins enabled (every visitor gets a JWT without email/password)
  - Email/password sign-up and sign-in supported
  - Password reset flow via email
  - Session management: autoRefreshToken, persistSession in browser localStorage
  - CSRF protection: detectSessionInUrl enabled

**Authentication Flow:**
- `src/contexts/AuthContext.tsx` - Single source of truth for auth state
  - On app load: checks for existing session; if none, calls `supabase.auth.signInAnonymously()`
  - Subscribes to `supabase.auth.onAuthStateChange` for token refresh
  - Provides user, profile (from `profiles` table), session, isAnonymous flags
  - Supports: signUp, signIn, signOut, resetPassword, updateProfile, upgradeAnonymous

- `src/routers/Router.tsx` - Route protection
  - `ProtectedRoute` gates all authenticated paths by `user` existence (includes anonymous)
  - Public routes: `/`, `/login`, `/signup`, `/forgot-password`, `/share/:slug`
  - Authenticated routes: `/search`, `/map`, `/history`, `/saved`, `/usage`, `/settings`
  - Post-login redirect: all users → `/search`

## Monitoring & Observability

**Error Tracking:**
- None configured (no Sentry, Rollbar, etc.)
- Console logging for development errors

**Logs:**
- Server-side: `tool_calls` and `llm_calls` tables provide audit trail
  - tool_calls: logs every agent tool execution with name, input, output, status, cost, error
  - llm_calls: logs every Gemini invocation with token counts and cost
  - Enables cost tracking and replay debugging

- Client-side: Browser console (development only)

**Performance Monitoring:**
- None configured; Supabase query performance visible in dashboard

## CI/CD & Deployment

**Hosting:**
- Vercel - Web application hosting
  - Build command: `npm run build`
  - Output directory: `dist/`
  - Install: `npm install`
  - SPA rewrites: all routes to `/index.html` (via `vercel.json`)
  - Environment variables: All VITE_* vars must be set in Vercel project settings

**Edge Functions Deployment:**
- Supabase Edge Functions (Deno runtime)
  - Deploy agent-run: `supabase functions deploy agent-run`
  - Deploy trending-places: `supabase functions deploy trending-places`
  - Secrets are set separately: `supabase secrets set KEY=value`
  - These run in Supabase infrastructure, not Vercel

**Database Deployment:**
- Supabase project (managed)
  - Migrations applied in order: `supabase db push` (development) or manual in dashboard (production)
  - No ORM; hand-written migrations + hand-written `src/types/database.ts`

## Environment Configuration

**Required env vars (for app to boot):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_MAP_ID` - Google Maps custom map ID

**Optional env vars:**
- `VITE_GEMINI_API_KEY` - Client-side Gemini (optional; app uses mocks if missing)

**Server secrets (set via `supabase secrets set`, never in .env):**
- `GEMINI_API_KEY` - Gemini API key for agent-run edge function
- `GOOGLE_API_KEY` - Shared Google Cloud key (Places, Custom Search, YouTube, Knowledge Graph, Geocoding)
- `GOOGLE_CSE_ID` - Programmable Search Engine ID
- `GOOGLE_PLACES_API_KEY` - Optional; trending-places uses GOOGLE_API_KEY if absent

**Secrets location:**
- `.env` file in local development (git-ignored)
- Vercel project settings for production (web UI)
- Supabase secrets backend for edge function runtime

**Missing/unused from `.env.example`:**
- Comments reference `GOOGLE_PLACES_API_KEY` but trending-places function may use `GOOGLE_API_KEY` instead

## Webhooks & Callbacks

**Incoming Webhooks:**
- None configured; the app is pull-only (agent-run is request-response over SSE)

**Outgoing Webhooks:**
- None configured

**Server-Sent Events (SSE):**
- agent-run edge function streams events back to browser
  - Event types: conversation_id, step_start, tool_call_start, tool_call_end, token, done, error
  - Parsed in `src/hooks/useAgentStream.ts`
  - No polling; full duplex stream until agent completes or error

**Sharing & Public Access:**
- Conversations can be shared via public `/share/:slug` route
  - Owner sets `conversations.shared = true` + `share_slug` (uuid)
  - RLS policies allow anonymous read via share_slug
  - `/share/:slug` fetches conversation + messages anonymously, renders read-only

## Rate Limits & Quotas

**Per-User (rolling 24h):**
- **Daily cost cap:** $0.10 (tool_calls.cost_usd + llm_calls.cost_usd)
- **Daily request rate:** 50 user messages
- Enforced via `get_daily_usage(p_user_id)` RPC (SECURITY DEFINER, service-role only)
- Checked at start of agent-run; if exceeded, SSE error emitted with reset_at timestamp

**Per-Turn (single agent request):**
- **Iteration cap:** 5 ReAct loops maximum
- **Wall clock:** 30 seconds maximum
- **Tool cost:** $0.05 accumulated tool cost maximum
- If any exceeded, turn truncated and note appended to final answer

**Google Cloud Free Tiers:**
- Custom Search: 100 queries/day
- Places API (New): 10,000 Text Search calls/month
- YouTube Data API: 10,000 quota units/day (100 per search)
- Knowledge Graph: Free for low-volume
- Geocoding: 40,000 calls/month
- Generative Language API (Gemini): 15 RPM on gemini-2.0-flash

---

*Integration audit: 2026-04-28*
