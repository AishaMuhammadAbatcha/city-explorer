# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173
- `npm run build` — Production build to `dist/`
- `npm run preview` — Serve the production build
- `npm run lint` — ESLint (flat config, `eslint.config.js`; ignores `dist/`)

There is no test runner configured in this project.

## Environment

Four `VITE_`-prefixed env vars are required in `.env` (see `.env.example`):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_MAP_ID`.
`src/lib/supabase.ts` throws at module load if either Supabase var is missing — the app will not boot without them.
`VITE_GEMINI_API_KEY` is optional; `src/services/geminiService.ts` falls back to mock responses when absent.

## Architecture

**Stack**: Vite + React 19 + TypeScript, Tailwind 4 (via `@tailwindcss/vite`), shadcn/ui on Radix, React Router 7, Supabase (Postgres + Auth + Edge Functions). Path alias `@/*` → `src/*` (see `vite.config.ts` and `tsconfig.app.json`).

**Product**: TR-ACE, an agentic AI search assistant. The project was pivoted from an earlier city-explorer app (businesses, events, reviews, bookings, role-based dashboards); that feature set and its Redux + Express + Prisma backend were removed. Do not reintroduce Redux, Prisma, a custom auth server, or role-based routing; extend via Supabase Edge Functions under `supabase/functions/` instead. Two edge functions live there today: `agent-run` (the ReAct loop) and `trending-places` (24h cache for Places API results). The older `upload-image`, `chatbot`, `business-operations`, and `send-notification` functions were removed; an empty `upload-image/` directory remains as a leftover stub — do not reintroduce it.

**Auth + routing** are the load-bearing layer:
- `src/contexts/AuthContext.tsx` is the single source of truth for `user`, `session`, `profile`, and `isAnonymous`. It subscribes to `supabase.auth.onAuthStateChange`, fetches the row from `profiles` keyed by `auth.users.id`, and on boot calls `supabase.auth.signInAnonymously()` so unauthenticated visitors can use the search experience. It deliberately ignores the `SIGNED_IN` event during initial load to avoid a double profile fetch — preserve this guard when editing. Requires **Anonymous Sign-Ins** to be enabled in the Supabase project's Authentication settings.
- `src/routers/Router.tsx` defines `ProtectedRoute` which gates by whether any `user` exists (including anonymous ones). There is no role system; the old `user_role` enum and `profiles.role` column were dropped in migration `005_drop_legacy_tables.sql`. Authenticated routes: `/search`, `/map`, `/history`, `/saved`, `/usage`, `/settings`. Public routes: `/`, `/login`, `/signup`, `/forgot-password`, `/share/:slug`.
- Post-login redirect logic lives in the `useEffect` at the top of `Router.tsx` — all users land on `/search`.

**Sharing**: conversations can be flipped public via `useShareConversation` (Phase 6). The owner sets `conversations.shared = true` + assigns a uuid `share_slug`; `/share/:slug` is a public route (outside `ProtectedRoute`) that fetches the conversation and messages anonymously via the Phase 6 RLS policies and renders them through `MessageList` with `readOnly=true` so `SaveButton` overlays and `ChatInput` are hidden.

**Feature layout**:
- `src/pages/` — top-level route components (`Search`, `Map`, `History`, `Saved`, `Usage`, `Settings`, `ShareView`, plus `auth/{Login,Signup,ForgotPassword}`). These are the route targets — there is no role-scoped directory structure.
- `src/components/` — shared UI grouped by domain: `ui/` (shadcn primitives), `chat/` (`MessageList`, `ChatInput`, `AnswerCard`, `StepTrace`, `ShareButton`, plus `cards/` for the typed result cards), `auth/ProtectedRoute`, `inputs/`, `layout/`. Add new shadcn components with `npx shadcn@latest add <name>` — config in `components.json` (style `new-york`, base color `neutral`, alias `@/components`).
- `src/services/` — currently just `geminiService.ts`, a client-side fallback that returns mock chat responses. The production agent is **not** here — it runs server-side in the `agent-run` edge function. Page components call `supabase.from(...)` directly through hooks in `src/hooks/`; there are no per-table service wrappers.
- `src/hooks/` — `useAgentStream`, `useConversation`, `useConversationList`, `useGeolocation`, `useSavedResults`, `useShareConversation`, `useTrendingPlaces`, `useUsageStats`, `useUserPreferences`.
- `src/layout/dashboard/` — shared authenticated shell (`Layout`, `Header`, `SideNav`, `Main`, `Footer`) rendered by `ProtectedRoute` via `<Outlet />`. The desktop sidebar expands on hover (collapsed 64px ↔ expanded 265px); it sits at `z-50`, above the header at `z-40`, so the expanded width can overlap the header without hiding the logo.

**Database & types**:
- `src/types/database.ts` is a hand-written `Database` type passed to `createClient<Database>`. It is **not** generated from Supabase — when you add columns/tables, update this file by hand (or the typed queries will silently drift). `src/lib/supabase.ts` exports `Tables<'name'>` and `Enums<'name'>` helpers against it. Domain types (`Message`, `Card`, `Citation`, `TraceEvent`, `AgentSSEEvent`) live in `src/types/agent.ts` and are shared with the edge function's response shape — keep both ends in sync when extending.
- Canonical schema lives in the numbered migrations in `supabase/migrations/` (`001_create_notifications_table.sql` → `011_trending_cache.sql`). Migrations 001–004 build the original city-explorer schema; `005_drop_legacy_tables.sql` tears it down for the TR-ACE pivot; 006–010 build the agent persistence, memory, sharing, and hardening layers; `011` adds the `trending_cache` table backing the `trending-places` function. For a fresh Supabase project, apply the end-state schema directly (`conversations`, `messages`, `tool_calls`, `user_preferences`, `saved_results`, `llm_calls`, `trending_cache`, plus `handle_new_user` / `set_updated_at` / `get_daily_usage`) rather than replaying all eleven in order — running 001–004 then 005 is wasteful on a fresh DB. All tables use RLS.

**Agent-run contract** (`supabase/functions/agent-run/`):
- Layout: `index.ts` (Deno.serve handler), `gemini.ts` (LLM calls + response parsing), `sse.ts` (event emitter), `cors.ts`, `tools/` (`webSearch`, `placesSearch`, `youtubeSearch`, `knowledgeGraph`, `geocode`, `shoppingSearch`), `extractors/` (cards + citations from tool output).
- ReAct loop on Gemini 2.0 Flash. Each iteration logs to `llm_calls` (token + cost) and `tool_calls` (input/output/cost/status) — the History and Step Trace UI replays from these rows, so do not skip the inserts when adding a new tool.
- Streams SSE back to the client; events: `conversation_id`, `step_start`, `tool_call_start`, `tool_call_end`, `token`, `done`, `error`. Parsed in `src/hooks/useAgentStream.ts` via an async generator.
- **Hard caps** (enforced server-side; surface gracefully on the client). Per-turn: 5 ReAct iterations, 30s wall clock, $0.05 tool spend. Per-user (rolling 24h): $0.10 cost cap, 50 messages, checked via the `get_daily_usage(user_id)` RPC at request entry. Daily-cap rejection emits an SSE `error` with a `reset_at` timestamp; the client renders a countdown toast — preserve this contract when changing cap behavior.
- Required server secrets (set via `supabase secrets set`, never in `.env`): `GEMINI_API_KEY` (Gemini), `GOOGLE_API_KEY` (shared key for Custom Search, YouTube, Knowledge Graph, Geocoding, and Places), `GOOGLE_CSE_ID` (Programmable Search Engine ID).

**Build**: `vite.config.ts` defines manual chunk splits (`react-vendor`, `ui-vendor`, `maps-vendor`, `supabase-vendor`) and raises the chunk-size warning limit to 1000 kB. If you add a large dep, consider extending `manualChunks` rather than silencing the warning.

**Deployment**: Vercel (`vercel.json`). Set all four `VITE_*` vars in the Vercel project; the build will succeed without them but the app will crash at runtime on the `supabase.ts` check. Edge functions deploy independently — `supabase functions deploy agent-run` and `supabase functions deploy trending-places` — with their secrets set via `supabase secrets set` against the linked project (see the Agent-run section above for required keys).
