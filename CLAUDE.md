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

**Stack**: Vite + React 19 + TypeScript, Tailwind 4 (via `@tailwindcss/vite`), shadcn/ui on Radix, React Router 7, Supabase (Postgres + Auth + Storage + Edge Functions). Path alias `@/*` → `src/*` (see `vite.config.ts` and `tsconfig.app.json`).

**Single-backend model**: All backend I/O goes through the Supabase JS client — there is no separate Node/Express API. An earlier Redux + Express + Prisma stack was removed (see `docs/SIMPLIFIED_ARCHITECTURE.md`). Do not reintroduce Redux, Prisma, or a custom auth server; extend via Supabase Edge Functions under `supabase/functions/` instead (`chatbot`, `business-operations`, `send-notification`, `upload-image` already exist there).

**Auth + routing** are the load-bearing layer:
- `src/contexts/AuthContext.tsx` is the single source of truth for `user`, `session`, and `profile`. It subscribes to `supabase.auth.onAuthStateChange` and fetches the row from `profiles` keyed by `auth.users.id`. It deliberately ignores the `SIGNED_IN` event during initial load to avoid a double profile fetch — preserve this guard when editing.
- `src/routers/Router.tsx` defines `ProtectedRoute` which gates by `profile.role` (`'individual' | 'business' | 'admin'`). Role-gated trees: `/business/*` → business pages, `/dashboard|/explore|/ai|/maps|/settings|/edit-profile|/payment` → individual pages. `/business/:id` is shared (any authenticated user).
- Post-login redirect logic lives in the `useEffect` at the top of `Router.tsx` — business users land on `/business/dashboard`, individuals on `/dashboard`.

**Feature layout**:
- `src/roles/{business,individual,admin}/pages/` — role-scoped page components (the route targets).
- `src/components/` — shared UI grouped by domain (`ui/` = shadcn primitives, plus `places/`, `reviews/`, `recommendations/`, `notifications/`, `upload/`, `auth/`, `business/`, `admin/`). Add new shadcn components with `npx shadcn@latest add <name>` — config in `components.json` (style `new-york`, base color `neutral`, alias `@/components`).
- `src/services/*.ts` — thin wrappers over `supabase.from(...)` and Edge Function calls (`businessService`, `eventService`/`eventsService`, `reviewService`/`reviewsService`, `bookingService`, `favoriteService`, `notificationsService`, `recommendationsService`, `geminiService`, `maps/`). Page components should call services, not the Supabase client directly.
- `src/layout/dashboard/` — shared authenticated shell (`Layout`, `Header`, `SideNav`, `Main`, `Footer`) rendered by `ProtectedRoute` via `<Outlet />`.
- `src/hooks/` — `useNotifications`, `usePlaces`, `useRecommendations`.

**Database & types**:
- `src/types/database.ts` is a hand-written `Database` type passed to `createClient<Database>`. It is **not** generated from Supabase — when you add columns/tables, update this file by hand (or the typed queries will silently drift). `src/lib/supabase.ts` exports `Tables<'name'>` and `Enums<'name'>` helpers against it.
- Canonical schema lives in `database-schema.sql` (full bootstrap) plus numbered migrations in `supabase/migrations/` (`001_create_notifications_table.sql` → `004_fix_signup_trigger.sql`). Apply in order via Supabase SQL Editor or `supabase db push`. All tables use RLS.
- Legacy directories (`src/auth/`, `src/context/`, `src/custom-components/`, `src/stores/`) predate the Supabase-only rewrite — prefer `src/pages/auth/`, `src/contexts/`, and `src/components/` for new work.

**Build**: `vite.config.ts` defines manual chunk splits (`react-vendor`, `ui-vendor`, `maps-vendor`, `supabase-vendor`) and raises the chunk-size warning limit to 1000 kB. If you add a large dep, consider extending `manualChunks` rather than silencing the warning.

**Deployment**: Vercel (`vercel.json`). Set all four `VITE_*` vars in the Vercel project; the build will succeed without them but the app will crash at runtime on the `supabase.ts` check.
