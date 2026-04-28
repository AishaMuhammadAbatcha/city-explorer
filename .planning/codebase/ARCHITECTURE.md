# Architecture

**Analysis Date:** 2026-04-28

## Pattern Overview

**Overall:** Event-driven, multi-layer client-server SPA with agentic AI orchestration and Supabase persistence.

**Key Characteristics:**
- Client-side React 19 SPA with Vite build, Tailwind 4 styling via shadcn/ui and Radix primitives
- Supabase (PostgreSQL + Auth + Edge Functions) as the single persistent backend
- Server-side agentic AI orchestration via the `agent-run` edge function (Deno runtime, Gemini 2.0 Flash LLM)
- Server-Sent Events (SSE) streaming from edge function to client for real-time token + step visibility
- Role-less auth: anonymous sign-in on boot + optional account upgrade
- Row-Level Security on all database tables; service-role edge function insert only

## Layers

**Presentation (React Components):**
- Purpose: Render UI, collect user input, display streamed responses
- Location: `src/components/`, `src/pages/`
- Contains: Page containers, chat UI (input/output), result cards, navigation, forms
- Depends on: Auth context, hooks (data fetching + RPC), types
- Used by: Browser DOM; feeds user queries and receives streamed AI responses

**State Management (Context + Hooks):**
- Purpose: Manage user auth, conversation/message state, preferences, persisted results
- Location: `src/contexts/AuthContext.tsx`, `src/hooks/`
- Contains: AuthContext (user/session/profile lifecycle), custom hooks for conversations, saved results, usage stats
- Depends on: Supabase client, types
- Used by: All page components and chat UI

**Data Access (Supabase Client):**
- Purpose: Typed query builder for conversations, messages, tool_calls, saved_results tables; RLS enforced by server
- Location: `src/lib/supabase.ts`, `src/types/database.ts`
- Contains: Supabase client instance, Database type definition (hand-written, not generated)
- Depends on: @supabase/supabase-js, environment variables
- Used by: Hooks, AuthContext, ShareView for direct SELECT/INSERT/UPDATE/DELETE

**Server-Side Orchestration (Edge Function):**
- Purpose: Accept a user message, invoke Gemini in a ReAct loop, call external tools, persist conversation + trace
- Location: `supabase/functions/agent-run/`
- Contains: Request → auth → daily-cap check → conversation creation → SSE stream setup → ReAct loop (Gemini call + tool invocation) → response synthesis → persistence
- Depends on: Deno fetch API, Gemini API, tool SDKs (web search, places search, YouTube, knowledge graph, geocode, shopping), Supabase service-role client
- Used by: Chat page via `useAgentStream` hook (fetch to `{SUPABASE_URL}/functions/v1/agent-run`)

**Routing & Auth Guard:**
- Purpose: Gate access to authenticated routes, manage navigation post-login
- Location: `src/routers/Router.tsx`, `src/components/auth/ProtectedRoute.tsx`
- Contains: Public routes (/, /login, /signup, /forgot-password, /share/:slug), protected routes (/search, /map, /history, /saved, /usage, /settings wrapped in ProtectedRoute), post-login redirect logic
- Depends on: React Router 7, AuthContext
- Used by: App root; blocks unauthenticated access to authenticated pages

**Layout & Shell:**
- Purpose: Render the authenticated dashboard shell (header, sidebar, footer, main content area)
- Location: `src/layout/dashboard/` (Layout.tsx, Header.tsx, SideNav.tsx, Main.tsx, Footer.tsx)
- Contains: Responsive sidebar (collapsed ↔ expanded), header with logo and nav, main area for page content
- Depends on: React, Tailwind
- Used by: ProtectedRoute as the wrapper for all authenticated pages via React Router Outlet

## Data Flow

**Search Request Flow (Primary):**

1. User types in `/search` page, hits ChatInput button
2. `Search.tsx` calls `useAgentStream().sendMessage({ message, conversationId })`
3. `useAgentStream` fetches to `{SUPABASE_URL}/functions/v1/agent-run` with Bearer token + JSON body: `{ message, conversation_id }`
4. Edge function (agent-run):
   - Verifies JWT, extracts user_id
   - Calls RPC `get_daily_usage(user_id)` to check rolling-24h cost/request caps
   - If over cap: emits SSE `error` event and closes stream
   - Otherwise: creates or reuses conversation, inserts user message row in `messages` table
   - Opens SSE stream back to client
   - Inserts placeholder assistant message (empty content)
   - Enters ReAct loop (max 5 iterations, 30s wall clock, $0.05 per-turn budget):
     - Emits `step_start` SSE event
     - Calls Gemini with conversation history + system instruction + tool declarations
     - Logs LLM call to `llm_calls` table (tokens + cost + duration)
     - If Gemini returns a function call: checks per-turn + daily budget, executes tool (web_search, places_search, youtube_search, knowledge_graph, geocode, shopping_search)
     - Logs tool call to `tool_calls` table (input + output + duration + cost + status)
     - Emits `tool_call_start` and `tool_call_end` SSE events
     - On error: emits error event, feeds it back to Gemini, continues loop
     - Otherwise: breaks with final text
   - Extracts cards (PlaceCard, VideoCard, ArticleCard, ProductCard) and citations from tool outputs
   - Updates placeholder message with final content + citations + cards
   - Chunks response text as tokens, emits `token` SSE events
   - Emits `done` event, closes stream

5. Client-side `useAgentStream` async generator parses SSE frames:
   - `conversation_id`: set conversationId state, update URL param
   - `step_start`, `token`, `tool_call_*`, `done`: call `replaceLast()` to append to trace or update message content
   - `error`: toast error, abort stream

6. `Search.tsx` renders real-time via `MessageList` + `MessageBubble` + `StepTrace` + `CardGrid` components

7. On stream end, `refetch()` loads persisted messages + tool_calls from DB (via `useConversation`)

**Conversation List & History:**

- `useConversationList` queries `conversations` table filtered by auth.uid(), ordered by updated_at DESC
- History page (`pages/History.tsx`) renders list, allows click-to-reopen or delete

**Saved Results:**

- Cards are saved to `saved_results` table via `useSavedResults().save(card, sourceMessageId)`
- Saved page (`pages/Saved.tsx`) groups by card kind and renders grid
- Only available to authenticated (non-anonymous) users

**Sharing:**

- Share button calls `useShareConversation().share(conversationId)`: generates UUID slug, sets conversations.shared = true
- Link is `/share/{slug}` (public route, outside ProtectedRoute)
- `ShareView.tsx` fetches conversation + messages anonymously, renders with readOnly=true (no ChatInput, no SaveButton overlays)

**Usage & Stats:**

- `useUsageStats` calls RPC `get_daily_usage(user_id)` to fetch rolling-24h cost + request counts
- Usage page renders them for monitoring

## State Management Strategy

**AuthContext (single source of truth for auth):**
- Subscribes to `supabase.auth.onAuthStateChange` on mount
- On boot: calls `getSession()` → if none, calls `signInAnonymously()`
- On SIGNED_IN/TOKEN_REFRESHED: fetches profile row from `profiles` table
- Guards against double profile fetch during init via `isInitializing` flag
- Provides: `user`, `session`, `profile`, `loading`, `isAnonymous`, methods (signIn, signUp, signOut, upgradeAnonymous, updateProfile)

**Conversation State (in-memory during active conversation):**
- `useConversation` fetches messages + reconstructs trace events from tool_calls rows
- `appendLocal()` adds optimistic local messages (before persistence)
- `replaceLast()` updates the last message in-place (for streaming content + trace)
- `refetch()` reloads from DB after stream ends

**Streaming State:**
- `streaming` boolean in Search.tsx
- `streamingId` tracks which message is currently being streamed
- `abortRef` holds abort function to cancel fetch if user leaves

## Key Abstractions

**SSE Stream Parser:**
- Location: `useAgentStream.ts` → `parseSSE()` async generator
- Pattern: reads from fetch response body, buffers text, splits on `\n\n`, parses `data: {...}` JSON frames
- Yields typed AgentSSEEvent objects (conversation_id, step_start, token, tool_call_start/end, done, error)

**Message Trace Reconstruction:**
- Location: `useConversation.ts` → `traceFromToolCalls()`
- Pattern: takes tool_calls rows, sorts by step_number, constructs TraceEvent array (step_start, tool_call_start, tool_call_end, done)
- Used to display step-by-step reasoning UI in `StepTrace.tsx`

**Card Grid & Card Rendering:**
- Location: `src/components/chat/cards/`
- Pattern: Factory function `renderCard(card, sourceMessageId)` dispatches on card.kind
- Card types: PlaceCard (maps integration), VideoCard, ArticleCard, ProductCard
- Each card has SaveButton overlay (unless readOnly in ShareView)

**Daily Usage RPC:**
- Location: `supabase/migrations/010_hardening.sql` → `get_daily_usage(user_id)` function
- Returns: rolling-24h cost_usd + request_count for budget checks

## Entry Points

**Browser (index.html):**
- Location: `src/main.tsx`
- Mounts React root with BrowserRouter, ThemeProvider, AuthProvider, APIProvider (Google Maps), App

**App Root:**
- Location: `src/App.tsx`
- Renders Router (route definitions), Sonner Toaster (notifications), ErrorBoundary, EnvDebug

**Route Handler:**
- Location: `src/routers/Router.tsx`
- Renders Routes with public/protected groups
- On user login: redirects to /search via useEffect at top of Router

**Auth Initialization:**
- Location: `src/contexts/AuthContext.tsx` → useEffect in AuthProvider
- Runs on app boot: fetches session or creates anonymous session, subscribes to auth state changes

**Edge Function Entry:**
- Location: `supabase/functions/agent-run/index.ts` → Deno.serve(handler)
- Accepts POST with { message, conversation_id }, returns SSE stream

## Error Handling

**Strategy:** Three layers — client try-catch, edge function error events, RLS denials

**Client-side (`useAgentStream`, Search.tsx):**
- Fetch fails or res.ok=false → throw with `agent-run failed: {status} {text}`
- SSE parse error (malformed JSON) → logged, ignored, stream continues
- Agent error event (`type='error'`) → toast.error(message), abort stream
- Daily cap hit → special toast with reset countdown

**Edge Function:**
- JWT missing/invalid → 401 Unauthorized
- RPC fails (user not in profiles table) → 500 with error log
- Gemini API error → tool call logs with status='error', error_message, fed back to LLM
- Tool timeout/error → same, continues loop
- Daily cap exceeded → emits error event with code + reset_at, exits before work

**Database RLS:**
- conversations: `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE by owner
- messages: owner can append (INSERT) via RLS; edge function (service role) can write
- tool_calls: service role INSERT only; owner can SELECT through conversation FK
- saved_results: owner full CRUD
- Anonymous users can view shared conversations (no RLS check because shared=true)

## Cross-Cutting Concerns

**Logging:**
- Client: console.log/error in development mode (checked via import.meta.env.DEV)
- Edge function: console.error for failures, no structured logging
- Supabase: captures RLS violations, function logs via dashboard

**Validation:**
- Client: form validation in auth pages (email, password strength)
- Edge function: JWT verification, RPC budget checks, tool call budget checks
- Database: CHECK constraints (role IN ('user', 'assistant', 'system'), status IN ('success', 'error', 'timeout'))

**Authentication:**
- All requests to edge function: Bearer {access_token} in Authorization header
- JWT verified server-side via Supabase service role
- Session persisted in localStorage (Supabase SDK default)
- Anonymous users: is_anonymous=true flag on auth.users.is_anonymous

**Type Safety:**
- Client: TypeScript strict mode, Database type hand-written (not generated)
- Edge function: TypeScript with @ts-expect-error for Deno/remote modules
- Minimal runtime casting; cards/citations typed as Card and Citation interfaces

---

*Architecture analysis: 2026-04-28*
