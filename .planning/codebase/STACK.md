# Technology Stack

**Analysis Date:** 2026-04-28

## Languages

**Primary:**
- TypeScript ~5.8.3 - Application source code and type definitions
- JavaScript (ES2022) - Runtime target via Vite

**Secondary:**
- SQL - Supabase database migrations and RLS policies
- Markdown - Documentation and changelog

## Runtime

**Environment:**
- Node.js (via npm, no specific version pinned in package.json)
- Browser (modern DOM APIs, ES2022 support required)
- Deno - Supabase Edge Functions runtime

**Package Manager:**
- npm (no lockfile type specified, likely package-lock.json)

## Frameworks

**Core:**
- React 19.1.0 - UI library
- Vite 7.0.4 - Build tool and dev server (main entry at `src/main.tsx`)
- React Router 7.7.1 - Client-side routing

**Styling:**
- Tailwind CSS 4.1.11 - Utility-first CSS framework
- @tailwindcss/vite 4.1.11 - Vite plugin for Tailwind

**UI Component Library:**
- shadcn/ui - Headless component library built on Radix UI
- Radix UI primitives (@radix-ui/react-*) - 16 packages including Avatar, Dialog, Dropdown, Navigation, Popover, Progress, Radio, Scroll, Select, Separator, Switch, Tabs, Tooltip
- Lucide React 0.535.0 - Icon library

**Forms & Validation:**
- React Hook Form 7.62.0 - Form state management
- @hookform/resolvers 5.2.2 - Form validation adapters
- Zod 4.1.9 - Schema validation library

**Data Visualization:**
- Recharts 3.1.2 - Chart and graph component library

**Markdown & Content:**
- React Markdown 10.1.0 - Markdown rendering in React
- Remark GFM 4.0.1 - GitHub Flavored Markdown support

**Notifications & Toasts:**
- Sonner 2.0.7 - Toast notification library

**Theme Management:**
- Next Themes 0.4.6 - Dark/light mode provider

**Utilities:**
- clsx 2.1.1 - Conditional CSS class composition
- Tailwind Merge 3.3.1 - Merge Tailwind conflicting classes
- class-variance-authority 0.7.1 - Component variant utilities
- date-fns 4.1.0 - Date manipulation utilities
- react-error-boundary 6.0.0 - Error boundary component

## Maps & Geolocation

**Google Maps:**
- @vis.gl/react-google-maps 1.5.5 - React wrapper for Google Maps JavaScript API
- @types/google.maps 3.58.1 - TypeScript types for Google Maps
- VITE_GOOGLE_MAPS_API_KEY - Environment variable for API key
- VITE_MAP_ID - Environment variable for custom map styling via Google Maps Studio

## Backend & Database

**Database:**
- Supabase (PostgreSQL 15+) - Fully managed Postgres + Auth + Edge Functions
  - Hosted at VITE_SUPABASE_URL
  - Authenticated via VITE_SUPABASE_ANON_KEY
  - RLS (Row-Level Security) enabled on all tables
  - Tables: `profiles`, `conversations`, `messages`, `tool_calls`, `user_preferences`, `saved_results`, `llm_calls`, `trending_cache`

**Supabase Client:**
- @supabase/supabase-js 2.57.4 - Official Supabase JavaScript client
  - Location: `src/lib/supabase.ts`
  - Configured with autoRefreshToken, persistSession, detectSessionInUrl
  - Auth: Anonymous sign-ins enabled (every visitor gets a JWT)

**Edge Functions (Deno runtime):**
- agent-run - Multi-step ReAct loop with Gemini, streams SSE events
- trending-places - Caches Places API results with 24h TTL

## AI & Language Models

**Generative AI:**
- @google/generative-ai 0.24.1 - Google Gemini API client (optional in browser)
  - Model: gemini-2.0-flash-exp
  - Used in `src/services/geminiService.ts` for fallback chat responses
  - VITE_GEMINI_API_KEY optional; app uses mock responses if missing

**Edge Function AI:**
- Gemini API (server-side in agent-run function)
  - Cost-tracked: $0.0001/1k input tokens, $0.0004/1k output tokens
  - Requires GEMINI_API_KEY secret (set via `supabase secrets set`)

## External APIs

**Google Cloud Services:**
- Google Maps JavaScript API - Maps rendering and AdvancedMarker
- Places API (New) - For trending-places edge function (`GOOGLE_PLACES_API_KEY`)
- Custom Search JSON API - Web search tool in agent-run
- YouTube Data API v3 - Video search tool in agent-run
- Knowledge Graph Search API - Knowledge lookup tool in agent-run
- Geocoding API - Location geocoding tool in agent-run
- Generative Language API - Gemini access

All Google APIs use a shared GOOGLE_API_KEY secret except Gemini (separate GEMINI_API_KEY).

**Programmable Search Engine:**
- Google Custom Search Engine (CSE) - Backs web_search tool
- GOOGLE_CSE_ID - Search engine ID required (set via `supabase secrets set`)

## Development Tools

**Linting & Code Quality:**
- ESLint 9.30.1 - JavaScript/TypeScript linting
  - Flat config at `eslint.config.js`
  - Extends: eslint:recommended, typescript-eslint/recommended, react-hooks/recommended, react-refresh/vite
  - Ignores: dist/ directory

**Type Checking:**
- TypeScript 5.8.3 - Strict mode enabled
  - tsconfig.json defines baseUrl and path alias @/*
  - Target ES2022, module ESNext, bundler module resolution
  - Strict null checks and type checking enforced
  - No emit (Vite handles transpilation)

## Configuration Files

**Build & Dev:**
- `vite.config.ts` - Vite config with React plugin, Tailwind plugin, manual chunk splits (react-vendor, ui-vendor, maps-vendor, supabase-vendor), 1000 kB chunk warning limit
- `tsconfig.json` - TypeScript base config with path alias
- `tsconfig.app.json` - TypeScript app-specific config (src included)
- `tsconfig.node.json` - Implied, for build tools
- `components.json` - shadcn/ui config (style: new-york, baseColor: neutral, aliases configured)
- `.env.example` - Documents required VITE_* env vars (SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_MAPS_API_KEY, MAP_ID; optional VITE_GEMINI_API_KEY)

**Deployment:**
- `vercel.json` - Vercel hosting config (build: npm run build, output: dist, dev: npm run dev, SPA rewrites to index.html)

**Supabase:**
- `supabase/migrations/` - 11 numbered SQL migrations (001-011) defining schema, auth triggers, RLS, edge functions dependencies
  - Latest: 011_trending_cache.sql (trending cache table)
- `supabase/functions/agent-run/` - Edge function source (Deno TypeScript)
- `supabase/functions/trending-places/` - Edge function source (Deno TypeScript)

## npm Scripts

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Serve production build locally
npm run lint     # ESLint check (flat config in eslint.config.js)
```

## Production Build

- **Output:** `dist/` directory
- **Deployment:** Vercel
  - Env vars: All VITE_* variables required in Vercel project settings
  - Edge function secrets: Set separately via `supabase secrets set` before deploying agent-run

## Platform Requirements

**Development:**
- Node.js (npm)
- Supabase CLI (for local edge function development)
- Deno (implicit in Supabase Edge Functions)
- Browser with ES2022 support (modern Chrome, Firefox, Safari, Edge)

**Production:**
- Vercel (hosting)
- Supabase project (database + auth + edge functions)
- Google Cloud project (Maps, Places, Custom Search, YouTube, Knowledge Graph, Geocoding, Generative Language APIs)

---

*Stack analysis: 2026-04-28*
