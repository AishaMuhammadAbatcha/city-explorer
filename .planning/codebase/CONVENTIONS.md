# Coding Conventions

**Analysis Date:** 2026-04-28

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `MessageList.tsx`, `ChatInput.tsx`, `ShareButton.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAgentStream.ts`, `useConversation.ts`, `useGeolocation.ts`)
- Utility functions: camelCase (e.g., `utils.ts`)
- Types: PascalCase interfaces and types (e.g., `Message`, `Citation`, `Card`)
- Edge functions: kebab-case directories (e.g., `agent-run/`, `trending-places/`)

**Functions:**
- Functional components: PascalCase (e.g., `export function MessageList(...)`)
- Hooks: camelCase with `use` prefix (e.g., `export function useConversation(...)`)
- Utility/helper functions: camelCase (e.g., `tempId()`, `hostOf()`, `traceFromToolCalls()`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleSend`, `handleShare`, `onKeyDown`)
- Internal factory/generator functions: camelCase (e.g., `parseSSE()`, `firstStringArg()`, `summariseOutput()`)

**Variables:**
- State: camelCase (e.g., `streamingId`, `conversationId`, `loading`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_ITERATIONS`, `TOOL_LABELS`, `POSITION_OPTIONS`)
- Boolean flags: camelCase without redundant prefixes (e.g., `streaming`, `pending`, `readOnly`)

**Types:**
- Interfaces describing props: `<ComponentName>Props` (e.g., `MessageListProps`, `ChatInputProps`)
- Interfaces for hook return values: descriptive names (e.g., `AuthContextType`, `AgentStreamHandle`)
- Type aliases for domain objects: PascalCase (e.g., `Citation`, `Card`, `Message`, `TraceEvent`)
- Union types: PascalCase (e.g., `AgentSSEEvent`, `AgentErrorCode`)

## Code Style

**Formatting:**
- No explicit formatter configured (ESLint only)
- Indentation: 2 spaces (inferred from existing code)
- Line length: No hard limit enforced
- Arrow functions preferred over function declarations in modern code

**Linting:**
- Tool: ESLint (flat config at `eslint.config.js`)
- Extends: `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh` configs
- Targets: `**/*.{ts,tsx}` files (ignores `dist/`)
- Key enforced rules:
  - React Hooks rules-of-hooks (ESLint plugin)
  - TypeScript strict type checking (no unused locals/parameters disabled)
  - No unchecked side effect imports
  - No fallthrough cases in switch statements

## Import Organization

**Order:**
1. React and external libraries (e.g., `import { useState } from 'react'`, `import { toast } from 'sonner'`)
2. UI and component libraries (e.g., `import { Button } from '@/components/ui/button'`)
3. Internal components (e.g., `import { MessageList } from '@/components/chat/MessageList'`)
4. Internal hooks (e.g., `import { useConversation } from '@/hooks/useConversation'`)
5. Types (e.g., `import type { Message } from '@/types/agent'`)
6. Utilities and services (e.g., `import { supabase } from '@/lib/supabase'`)

**Path Aliases:**
- `@/*` maps to `src/*` (defined in `vite.config.ts` and `tsconfig.app.json`)
- Always use alias imports instead of relative paths
- Example: `@/components/ui/button`, `@/hooks/useAuth`, `@/lib/utils`

**Import Style:**
- Named imports preferred for multiple exports
- Type imports use `import type` syntax (e.g., `import type { Message } from '@/types/agent'`)
- Default exports used rarely (components are named exports)

## Error Handling

**Patterns:**
- Try/catch blocks with specific error handling (e.g., `ShareButton.tsx` catches and extracts error messages)
- Error boundaries via class component wrapper (`src/components/ErrorBoundary.tsx`) for React render errors
- Graceful fallbacks on parse failures (e.g., `useAgentStream.ts` ignores malformed JSON frames in SSE)
- Type narrowing for error messages: `err instanceof Error ? err.message : 'default message'`

**Null/Empty Handling:**
- Optional chaining (`?.`) used throughout (e.g., `m.citations?.length`)
- Nullish coalescing (`??`) for defaults (e.g., `conversations.shared ?? false`)
- Array fallbacks: `data ?? []` when query results may be null
- Defensive checks before access (e.g., `if (trace.length === 0) return null`)

**Supabase-specific:**
- Errors from `.select()` checked via `if (error)` before using data
- RLS (Row Level Security) policy violations return error objects, not thrown exceptions
- Profile fetch errors with code `PGRST116` (no rows) are caught and treated as missing profile
- Type casting for DB JSON columns: `Array.isArray(m.citations) ? (m.citations as unknown as Citation[]) : []`

## Logging

**Framework:** Console (no external logging library configured)

**Patterns:**
- `console.error()` for auth/initialization failures (see `AuthContext.tsx`)
- `console.log()` for dev-only debug info (wrapped in `import.meta.env.DEV` checks)
- Sensitive data never logged (auth tokens only logged as length: `keyLength: supabaseAnonKey?.length`)
- Error boundary catches errors and logs to console with context
- Production error reporting has a TODO placeholder (see `ErrorBoundary.tsx` line 33-35)

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic (e.g., SSE frame parsing in `useAgentStream.ts`)
- Important gotchas and workarounds (e.g., "Ignore SIGNED_IN during init to avoid double profile fetch" in `AuthContext.tsx`)
- Purpose of per-turn circuit breakers and cost calculations
- Module-level flow descriptions (see `agent-run/index.ts` header comments)

**JSDoc/TSDoc:**
- Not universally used; selective use for complex functions
- Interface definitions include inline documentation via comments when needed
- Edge function parameters documented in comment blocks at top of file

**Code Comments Style:**
- Block comments with `//` prefix
- Multi-line flows documented as numbered steps
- Inline explanations for state transitions and side effects

## Function Design

**Size:** Small, focused functions (most < 30 lines)
- Shared logic extracted (e.g., `hostOf()`, `summariseOutput()`, `firstStringArg()`)
- Component rendering logic kept in JSX, complex state logic extracted to hooks

**Parameters:**
- Props interfaces always defined (e.g., `MessageListProps`)
- Destructuring in function signature: `export function MessageList({ messages, streamingId, readOnly = false }: MessageListProps)`
- Optional parameters given defaults in interface (e.g., `readOnly?: boolean`)
- No prop spread (`{...props}`) used; props explicitly listed

**Return Values:**
- Components return JSX (no render prop pattern)
- Hooks return objects with named properties (e.g., `{ status, coords, request }`)
- Event handlers void (use `useCallback` for memoization)
- Errors returned as object properties (`{ error }`) rather than thrown (exception handling is rare)

## Module Design

**Exports:**
- Named exports for components and hooks (enables tree-shaking)
- One component per file (except for tiny local helper components)
- Type exports use `export type` syntax

**Barrel Files:**
- Used in `src/components/chat/cards/` for grouped exports
- Index files re-export groups of related components
- Example: `cards/index.ts` exports `CardGrid`, `PlaceCard`, `ArticleCard`, etc.

**Module Structure:**
- Components are pure (no side effects in render)
- Hooks encapsulate state and side effects
- Context providers handle cross-cutting concerns (auth)
- No singleton services except Supabase client (`src/lib/supabase.ts`)

## TypeScript Practices

**Strict Mode:** Enabled in `tsconfig.app.json`
- `"strict": true`
- `"noUnusedLocals": false` (relaxed to allow work-in-progress code)
- `"noUnusedParameters": false` (relaxed for callbacks)

**Database Types:**
- Hand-written `Database` type in `src/types/database.ts` (NOT generated)
- `Tables<'name'>` helper extracts row type: `type Profile = Tables<'profiles'>`
- `Enums<'name'>` helper for enum types
- Must update `database.ts` manually when schema changes

**Component Props:**
- Always typed via interface extending `React.ReactNode` for children
- Optional props use `?:` syntax
- Defaults specified in destructuring, not function body

**Type Imports:**
- Always use `import type` for types to enable erase-type-only imports
- Separates type-only imports from runtime imports

## Tailwind CSS + shadcn/ui

**Class Organization:**
- Utility classes follow Tailwind order: layout → sizing → spacing → typography → effects
- Custom Tailwind classes use CSS variables for theming (dark mode support)
- Prose styling for markdown content: `prose prose-sm dark:prose-invert`

**shadcn/ui Usage:**
- Add components via `npx shadcn@latest add <name>`
- Config in `components.json` (style: `new-york`, base: `neutral`, alias: `@/components`)
- Import from `@/components/ui/*`
- Components are unstyled Radix primitives + Tailwind utilities
- Overrides use className prop and `cn()` utility to merge classes

**Dynamic Classes:**
- Use `clsx` and `tailwind-merge` via `cn()` helper (`src/lib/utils.ts`)
- Conditional classes: `className={open ? 'rotate-180' : ''}`
- No inline style objects; use Tailwind utilities only

## Async/Concurrency Patterns

**Promises:**
- Async functions used for sequential operations
- `useCallback` wraps async handlers (prevents dependency array issues)
- Stream handling with `AsyncGenerator` and `for await...of`

**Abort Signals:**
- Used for canceling fetch requests (e.g., `AbortController` in `useAgentStream.ts`)
- Cleanup in `useEffect` returns: `abortRef.current?.()`

**State Mutations:**
- Immutable updates via functional setState (e.g., `setState((s) => ({ ...s, ... }))`)
- Never mutate arrays/objects in place
- Spread operator used for shallow updates

## React-Specific Conventions

**Hooks:**
- `useEffect` cleanup functions for subscriptions and timers
- Dependencies arrays explicit and correct
- Custom hooks return objects, not arrays
- Guards prevent effects during initialization (e.g., `isInitializing` flag in `AuthContext`)

**Context:**
- Context defined with default undefined, throw error in hook if missing
- Provider at app root level via component wrapper

**Refs:**
- Used for DOM access only (`useRef` for textarea, div, etc.)
- Typed with generic `HTMLDivElement | null`

**Keys:**
- Always provided in `.map()` loops
- Unique, stable identifiers (not index)
- Example: `key={m.id}` or `key={`${c.url}-${i}`}` for composite keys

## Build & Bundling

**Chunk Strategy:**
- Manual chunks in `vite.config.ts` for predictable code splitting:
  - `react-vendor`: React, ReactDOM, React Router
  - `ui-vendor`: All Radix UI components
  - `maps-vendor`: Google Maps integration
  - `supabase-vendor`: Supabase client
- Chunk size warning limit raised to 1000 kB

**Path Resolution:**
- Vite alias `@` → `src` (same as TypeScript)
- No relative imports (`../..`); always use `@` prefix

---

*Convention analysis: 2026-04-28*
