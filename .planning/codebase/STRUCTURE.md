# Codebase Structure

**Analysis Date:** 2026-04-28

## Directory Layout

```
city-explorer/
├── src/
│   ├── main.tsx                          # React app entry (root mount)
│   ├── App.tsx                           # Root component (Router + Toaster + ErrorBoundary)
│   ├── index.css                         # Global styles
│   │
│   ├── routers/
│   │   └── Router.tsx                    # React Router 7 routes; public + protected
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx               # Auth context (user, session, profile, isAnonymous)
│   │
│   ├── pages/                            # Top-level route containers
│   │   ├── Search.tsx                    # Main chat search interface
│   │   ├── Map.tsx                       # Maps integration page
│   │   ├── History.tsx                   # Conversation history list
│   │   ├── Saved.tsx                     # Saved results grid
│   │   ├── Usage.tsx                     # Daily usage stats
│   │   ├── Settings.tsx                  # User settings + profile upgrade
│   │   ├── ShareView.tsx                 # Public shared conversation view
│   │   └── auth/
│   │       ├── Login.tsx                 # Email/password login
│   │       ├── Signup.tsx                # Email/password signup
│   │       └── ForgotPassword.tsx        # Password reset
│   │
│   ├── components/
│   │   ├── chat/                         # Chat UI components
│   │   │   ├── ChatInput.tsx             # Text input + send button
│   │   │   ├── MessageList.tsx           # Scrollable message container
│   │   │   ├── MessageBubble.tsx         # User/assistant message bubble
│   │   │   ├── AnswerCard.tsx            # Markdown answer + citations
│   │   │   ├── StepTrace.tsx             # Collapsible step/tool trace UI
│   │   │   ├── ShareButton.tsx           # Share conversation button
│   │   │   └── cards/
│   │   │       ├── CardGrid.tsx          # Grid layout for result cards
│   │   │       ├── PlaceCard.tsx         # Place card (map, rating, address)
│   │   │       ├── VideoCard.tsx         # YouTube video card
│   │   │       ├── ArticleCard.tsx       # Web article card
│   │   │       ├── ProductCard.tsx       # Shopping product card
│   │   │       ├── SaveButton.tsx        # Save card to saved_results
│   │   │       └── index.ts              # Export card components
│   │   │
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx        # Wrapper that gates by user existence
│   │   │
│   │   ├── layout/
│   │   │   └── ResponsiveContainer.tsx   # Responsive max-width container
│   │   │
│   │   ├── inputs/                       # Custom form inputs
│   │   │   ├── CustomTextField.tsx
│   │   │   ├── CustomTextArea.tsx
│   │   │   └── CustomSelect.tsx
│   │   │
│   │   ├── ui/                           # shadcn/ui primitives (Radix-based)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── ... (other Radix components)
│   │   │   └── sonner.tsx                # Toast notifications
│   │   │
│   │   ├── ErrorBoundary.tsx             # Error boundary wrapper
│   │   ├── EnvDebug.tsx                  # Dev-only env var display
│   │   └── TrendingPlacesModal.tsx       # Modal for trending places suggestions
│   │
│   ├── layout/
│   │   └── dashboard/                    # Authenticated dashboard shell
│   │       ├── Layout.tsx                # Main shell (header + sidebar + main)
│   │       ├── Header.tsx                # Top navigation bar
│   │       ├── SideNav.tsx               # Sidebar (collapsed/expanded)
│   │       ├── Main.tsx                  # Main content area
│   │       └── Footer.tsx                # Footer (if used)
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useAgentStream.ts             # Fetch + SSE stream parsing
│   │   ├── useConversation.ts            # Load conversation + messages + tool_calls
│   │   ├── useConversationList.ts        # Load list of conversations
│   │   ├── useSavedResults.ts            # Load + save + remove saved cards
│   │   ├── useShareConversation.ts       # Share/unshare conversation
│   │   ├── useUsageStats.ts              # Fetch daily usage via RPC
│   │   ├── useUserPreferences.ts         # Load + update user preferences
│   │   ├── useGeolocation.ts             # Browser geolocation API wrapper
│   │   └── useTrendingPlaces.ts          # Fetch trending places cache
│   │
│   ├── services/
│   │   └── geminiService.ts              # (Unused) fallback mock for Gemini
│   │
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase client instance + types
│   │   ├── utils.ts                      # Utility functions (cn, etc.)
│   │   ├── validations.ts                # Form validation schemas
│   │   └── responsive.ts                 # Responsive breakpoint helpers
│   │
│   ├── types/
│   │   ├── database.ts                   # Hand-written Database type (public.Tables)
│   │   └── agent.ts                      # Agent types (Message, Card, TraceEvent, etc.)
│   │
│   ├── assets/
│   │   └── image.jpg                     # Static assets
│   │
│   └── vite-env.d.ts                     # Vite env variable types
│
├── supabase/
│   ├── migrations/                       # SQL migrations (001-011)
│   │   ├── 001_create_notifications_table.sql
│   │   ├── 002_create_deals_table.sql
│   │   ├── 003_add_review_responses.sql
│   │   ├── 004_fix_signup_trigger.sql
│   │   ├── 005_drop_legacy_tables.sql    # Removes city-explorer schema
│   │   ├── 006_agent_core_tables.sql     # conversations, messages, tool_calls, RLS
│   │   ├── 007_multi_step_agent.sql      # step_number on tool_calls, llm_calls
│   │   ├── 008_memory_and_preferences.sql # user_preferences, saved_results
│   │   ├── 009_conversation_sharing.sql  # share_slug, shared on conversations
│   │   ├── 010_hardening.sql             # get_daily_usage RPC, daily caps
│   │   └── 011_trending_cache.sql        # trending_cache table + caching
│   │
│   ├── functions/
│   │   ├── agent-run/
│   │   │   ├── index.ts                  # Main edge function (Deno)
│   │   │   ├── gemini.ts                 # Gemini API calls + response parsing
│   │   │   ├── sse.ts                    # SSE stream creation + event emitting
│   │   │   ├── cors.ts                   # CORS header handling
│   │   │   └── tools/
│   │   │       ├── webSearch.ts          # Google Custom Search API
│   │   │       ├── placesSearch.ts       # Google Places API
│   │   │       ├── youtubeSearch.ts      # YouTube API
│   │   │       ├── knowledgeGraph.ts     # Google Knowledge Graph API
│   │   │       ├── geocode.ts            # Google Geocoding API
│   │   │       └── shoppingSearch.ts     # Google Shopping API
│   │   │
│   │   ├── trending-places/              # Caching edge function
│   │   │   └── index.ts
│   │   │
│   │   ├── _shared/                      # Shared Deno modules (utilities)
│   │   │
│   │   └── upload-image/                 # Legacy (not used)
│   │
│   └── config.toml                       # Supabase project config
│
├── vite.config.ts                        # Vite config (React plugin, Tailwind, alias)
├── tsconfig.json                         # TypeScript config (root)
├── tsconfig.app.json                     # TypeScript config (app; strict mode, path alias @/*)
├── package.json                          # Dependencies + npm scripts
├── package-lock.json                     # Lockfile
├── index.html                            # HTML entry point
├── tailwind.config.ts                    # Tailwind config
├── components.json                       # shadcn/ui config
└── .env.example                          # Environment variable template
```

## Directory Purposes

**src/pages/**
- Purpose: Top-level route components that fill the viewport
- Contains: Search (chat), Map, History, Saved, Usage, Settings, ShareView, and auth pages
- No subdirectories except auth/; all at top level for clear routing

**src/components/chat/**
- Purpose: All chat-related UI (input, output, trace, cards, sharing)
- Contains: Message rendering (MessageList, MessageBubble), input (ChatInput), trace visualization (StepTrace), answer display (AnswerCard), result cards (PlaceCard, VideoCard, ArticleCard, ProductCard with SaveButton)
- Key pattern: Cards are polymorphic; factory function dispatches on card.kind

**src/components/ui/**
- Purpose: shadcn/ui Radix primitives, auto-added via `npx shadcn@latest add <name>`
- Contains: 30+ button, input, dialog, dropdown, form, etc. components
- Never edit these directly; regenerate via shadcn CLI

**src/layout/dashboard/**
- Purpose: Authenticated dashboard shell (header, sidebar, main content area)
- Contains: Layout (orchestrator), Header (top nav), SideNav (sidebar with collapse), Main (content area wrapper)
- Used by: ProtectedRoute wraps all authenticated pages with Layout

**src/hooks/**
- Purpose: All data fetching and state management hooks
- Pattern: Fetch on mount via useEffect, cache in useState, return state + refetch/mutate functions
- Examples: useConversation (fetch messages + tool_calls), useAgentStream (SSE), useSavedResults (CRUD), useShareConversation (toggle share)

**supabase/migrations/**
- Purpose: Progressive schema changes, applied in order on fresh DB or selectively on existing
- Pattern: Numbered 001-011; each migration is idempotent (IF NOT EXISTS, DROP IF EXISTS)
- For fresh project: apply entire schema at once via `supabase db push` or SQL editor

**supabase/functions/agent-run/**
- Purpose: Main server-side agent orchestration
- Contains: Deno handler → JWT verify → budget check → conversation creation → SSE setup → ReAct loop (Gemini + tools) → response synthesis
- Tools: webSearch, placesSearch, youtubeSearch, knowledgeGraph, geocode, shoppingSearch
- Emits SSE events (conversation_id, step_start, token, tool_call_start/end, done, error)

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app bootstrap (root mount, providers)
- `src/App.tsx`: Root component (Router + Toaster + ErrorBoundary)
- `src/routers/Router.tsx`: Route definitions (public + protected)
- `supabase/functions/agent-run/index.ts`: Edge function entry (Deno handler)

**Configuration:**
- `tsconfig.app.json`: TypeScript paths (@ → src/)
- `vite.config.ts`: Build config, manual chunks, alias
- `.env.example`: Required env vars template
- `tailwind.config.ts`: Tailwind theming
- `components.json`: shadcn/ui config (style new-york, base neutral)

**Core Logic:**
- `src/contexts/AuthContext.tsx`: Auth state (user, session, profile, isAnonymous)
- `src/hooks/useAgentStream.ts`: Fetch + SSE stream to edge function
- `src/hooks/useConversation.ts`: Load + reconstruct conversation trace
- `src/lib/supabase.ts`: Supabase client instance

**Types:**
- `src/types/database.ts`: Database schema (hand-written, not generated)
- `src/types/agent.ts`: Message, Card, TraceEvent, AgentSSEEvent types

**Database:**
- `supabase/migrations/006_agent_core_tables.sql`: conversations, messages, tool_calls + RLS
- `supabase/migrations/009_conversation_sharing.sql`: share_slug, shared flag
- `supabase/migrations/010_hardening.sql`: get_daily_usage RPC, daily caps

## Naming Conventions

**Files:**
- Pages: `PascalCase.tsx` (e.g., `Search.tsx`, `History.tsx`)
- Components: `PascalCase.tsx` (e.g., `MessageBubble.tsx`, `ChatInput.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAgentStream.ts`, `useConversation.ts`)
- Services: `camelCase.ts` (e.g., `geminiService.ts`)
- Types: `lowercase.ts` or `lowercase.d.ts` (e.g., `database.ts`, `agent.ts`)
- Utilities: `lowercase.ts` (e.g., `supabase.ts`, `utils.ts`, `validations.ts`)

**Directories:**
- Feature dirs (chat, auth, inputs, layout): `lowercase/` (e.g., `src/components/chat/`)
- UI dir: `ui/` for shadcn components
- Index files: Use `index.ts` for card exports (`src/components/chat/cards/index.ts`)

**Components & Functions:**
- React components: `PascalCase` (e.g., `export function MessageBubble()`)
- Hooks: `camelCase` with `use` prefix (e.g., `export function useConversation()`)
- Utilities: `camelCase` (e.g., `function parseSSE()`, `function summariseOutput()`)
- Types & Interfaces: `PascalCase` (e.g., `interface AuthContextType`, `type Card`, `interface MessageListProps`)

**Variables:**
- State: `camelCase` (e.g., `streaming`, `conversationId`, `messages`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_ITERATIONS`, `DAILY_COST_CAP_USD`, `TOOL_LABELS`)
- Private functions: `camelCase` with leading underscore if prefixing needed (e.g., `function tempId()`)

## Where to Add New Code

**New Search Feature (e.g., advanced filters):**
- Primary: `src/pages/Search.tsx` (logic) or new component in `src/components/chat/`
- Types: Update `src/types/agent.ts` if adding message/card fields
- Database: Add column to `conversations` or `messages` table via new migration in `supabase/migrations/`
- Hook (if data fetching): Add to `src/hooks/` (e.g., `useAdvancedFilters.ts`)

**New Result Card Type:**
- Implementation: New file in `src/components/chat/cards/` (e.g., `NewsCard.tsx`)
- Export: Add to `src/components/chat/cards/index.ts`
- Type: Update `type Card` union in `src/types/agent.ts`
- Rendering: Update factory function in `pages/Saved.tsx` and `src/components/chat/cards/CardGrid.tsx`
- Save button: Add SaveButton overlay if saveable

**New Tool (e.g., Reddit search):**
- Implementation: New file in `supabase/functions/agent-run/tools/` (e.g., `redditSearch.ts`)
- Declaration: Export `REDDIT_SEARCH_DECLARATION` and `REDDIT_SEARCH_COST_USD`
- Integration: Import in `supabase/functions/agent-run/index.ts`, add to tool declarations array
- System instruction: Update in `index.ts` to describe the new tool
- Output handling: Define type and add summarization logic in `traceFromToolCalls()` if needed

**New Page/Route:**
- Page file: Create in `src/pages/` (e.g., `src/pages/Analytics.tsx`)
- Routing: Add Route in `src/routers/Router.tsx` (protected if authenticated, else public)
- Navigation: Link in `src/layout/dashboard/SideNav.tsx` if authenticated
- Layout: Use `Layout` via ProtectedRoute if authenticated, else standalone

**New Authenticated Page (e.g., Preferences):**
- Page file: `src/pages/Preferences.tsx`
- Hook (if querying): `src/hooks/useUserPreferences.ts` (fetches + mutates user_preferences table)
- Route: Add to ProtectedRoute group in Router.tsx
- Navigation: Link in SideNav.tsx

**New Utility/Helper:**
- Location: `src/lib/` if general (e.g., `date-utils.ts`), or collocated if specific to one feature
- Export: Named exports (not default)
- Types: Fully typed; no `any`

**Unit Tests:**
- Note: No test runner configured. To add Jest/Vitest:
  - Install: `npm install --save-dev vitest @vitest/ui`
  - Config: Create `vitest.config.ts`
  - Files: Colocate or in `src/__tests__/` (e.g., `src/hooks/__tests__/useConversation.test.ts`)
  - Run: `npm run test`

## Special Directories

**src/assets/:**
- Purpose: Static images, icons, etc.
- Generated: No
- Committed: Yes
- Note: Imported directly in components (e.g., `import image from '@/assets/image.jpg'`)

**supabase/migrations/:**
- Purpose: Schema versioning; applied in order
- Generated: No (hand-written SQL)
- Committed: Yes
- Note: Idempotent (IF NOT EXISTS); safe to reapply

**supabase/functions/:**
- Purpose: Deno edge function deployments
- Generated: No (hand-written TypeScript)
- Committed: Yes
- Note: Deploy via `supabase functions deploy <name>` after `supabase functions serve` for local testing

**dist/ (build output):**
- Purpose: Production bundle
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)
- Contents: Chunked JS (react-vendor, ui-vendor, maps-vendor, supabase-vendor), CSS, HTML

**node_modules/:**
- Purpose: NPM dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-04-28*
