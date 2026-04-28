# Testing Patterns

**Analysis Date:** 2026-04-28

## Test Framework

**Status:** Not Configured

**No test runner is installed or configured in this project.**

The project has:
- No Jest, Vitest, or similar test framework in dependencies
- No test files in `src/` (only in `node_modules` from dependencies)
- No test configuration file (no `jest.config.js`, `vitest.config.ts`, etc.)
- No test scripts in `package.json` (only `dev`, `build`, `lint`, `preview`)

**Implication:** All quality assurance currently relies on:
1. ESLint static type checking (TypeScript strict mode)
2. Manual testing during development (`npm run dev`)
3. Production monitoring (Error Boundary logs to console)

## Quality Assurance Approach

**TypeScript Strict Mode:**
- `src/tsconfig.app.json` enables `"strict": true`
- Catches many errors at compile time (type mismatches, null/undefined access)
- `noUnusedLocals` and `noUnusedParameters` disabled (allows incremental development)

**ESLint:**
- Configured via flat config (`eslint.config.js`)
- Runs with `npm run lint`
- Enforces React Hooks rules, no side effect imports, no fallthrough switch cases
- Does NOT enforce Prettier (no formatter configured)

**Error Boundary:**
- Class component at `src/components/ErrorBoundary.tsx`
- Catches render-time exceptions and displays fallback UI
- Logs errors to console and has placeholder for production error service (Sentry)

## Logging for Debugging

**Console Logging:**
- `console.error()` for initialization failures (auth, config validation)
- `console.log()` for dev-only info wrapped in `import.meta.env.DEV` checks
- ErrorBoundary logs caught errors with React ErrorInfo
- No structured logging framework (console only)

**Example from `src/lib/supabase.ts`:**
```typescript
if (import.meta.env.DEV) {
  console.log('Supabase configuration:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length || 0
  });
}
```

**Example from `src/components/ErrorBoundary.tsx`:**
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('ErrorBoundary caught an error:', error, errorInfo)
  this.setState({ errorInfo })

  // TODO: Add error reporting service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   logErrorToService(error, errorInfo)
  // }
}
```

## Manual Testing Patterns

**Development Workflow:**
1. `npm run dev` starts Vite dev server on http://localhost:5173
2. Hot Module Replacement (HMR) reflects changes immediately
3. Browser DevTools + React DevTools extension for component inspection
4. Console shows TypeScript errors and runtime logs

**Key Areas Requiring Manual Testing:**

**Authentication Flow:**
- Verify anonymous sign-in works (browser logs auth errors)
- Test login/signup (error handling in `AuthContext.tsx`)
- Check profile fetch after authentication
- Confirm session persistence across page reloads

**Streaming & Real-time Data:**
- SSE stream parsing in `useAgentStream.ts` must handle partial frames
- Tool call events must render correctly in `StepTrace.tsx`
- Message list auto-scroll on new messages
- Abort signal properly cancels in-flight requests

**Error Scenarios:**
- Missing Supabase env vars → app fails to boot (`supabase.ts` throws)
- RLS policy violations → error objects captured and logged
- Network failures → graceful error handling with toast notifications
- Rate limit errors → daily cost/request caps render reset countdown

**Integration Points:**
- Conversation sharing: URL generation and public access
- Trending places modal: fetch and render
- Tool calls: web search, places search, YouTube, knowledge graph, geocoding
- Card rendering: places, articles, videos, products

## Untested Areas

**High-Risk, No Coverage:**
- SSE frame parsing edge cases (malformed JSON, partial frames) — only ignored errors handled
- Complex state transitions in `useConversation.ts` (message assembly from DB rows + tool calls)
- Tool call cost calculations and budget tracking across turns
- RLS policy enforcement (relies on Supabase server-side checks)
- Google Maps integration (Maps vendor chunk loaded but rendering not tested)

**Moderate Risk:**
- Responsive layout at edge screen sizes
- Keyboard navigation (chat input submit on Enter vs Shift+Enter)
- Clipboard API failures (share button gracefully falls back)
- Browser API availability (geolocation, permissions query)

## Testing Philosophy

**What Would Help Most:**

1. **Component snapshots** — Verify StepTrace, AnswerCard, MessageBubble render correctly across tool types
2. **Hook integration tests** — useConversation state assembly, useAgentStream parsing
3. **Error boundary tests** — Ensure fallback UI renders on errors
4. **Auth flow tests** — Anonymous sign-in, token refresh, SIGNED_IN event guard
5. **Edge function tests** — agent-run cost calculations, iteration loop, budget enforcement

**Current Gaps:**
- No test data factories or mocks
- No fixture files for agent responses
- No CI/CD test step
- No coverage reporting
- No end-to-end tests (Playwright/Cypress not configured)

## Type Safety as Quality Gate

**How TypeScript Prevents Bugs:**
- `type Message` forces all message fields to be provided at construct time
- `type TraceEvent` is discriminated union; switch statements must handle all kinds
- `Database` type ensures queries match schema; typos caught at compile time
- `Tables<'messages'>` enforces shape of DB rows

**Example — Type-Safe Message Construction:**
```typescript
const assistantMsg: Message = {
  id: assistantId,
  role: 'assistant',
  content: '',
  citations: [],
  cards: [],
  trace: [],
  created_at: new Date().toISOString(),
}
// If any field is missing, TypeScript error at line
```

**Example — Discriminated Union Prevents Invalid States:**
```typescript
type TraceEvent =
  | { kind: 'step_start'; iteration: number; label: string }
  | { kind: 'tool_call_start'; tool: string; input: unknown; startedAt: number }
  | { kind: 'tool_call_end'; tool: string; summary: string; ... }
  | { kind: 'done'; totalMs: number }

// In component, must check e.kind before accessing e.summary
if (e.kind === 'tool_call_end') {
  <span>{e.summary}</span>
}
```

## Recommendations for Adding Testing

**Phase 1 — Setup (if testing becomes priority):**
1. Install Vitest + React Testing Library
2. Add to `package.json` scripts:
   ```json
   "test": "vitest",
   "test:ui": "vitest --ui",
   "test:coverage": "vitest --coverage"
   ```
3. Create `vitest.config.ts` with React preset

**Phase 2 — Core Hooks:**
- `useConversation` state assembly and refetch logic
- `useAgentStream` SSE parsing and abort handling
- `useGeolocation` status transitions and caching
- `useShareConversation` URL generation

**Phase 3 — Components:**
- `StepTrace` rendering all event kinds correctly
- `AnswerCard` markdown rendering and citation links
- `MessageList` scroll behavior on new messages
- Error boundary fallback rendering

**Phase 4 — Integration:**
- Auth context subscription and cleanup
- Chat flow: send message → stream events → update state → render
- Error scenarios: RLS errors, network failures, malformed responses

---

*Testing analysis: 2026-04-28*
