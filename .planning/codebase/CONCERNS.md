# Codebase Concerns

**Analysis Date:** 2026-04-28

## Zero Test Coverage

**Critical Gap — Unit, Integration, E2E Testing:**
- What's not tested: ALL application code; no test runner configured (no Jest, Vitest, Cypress)
- Files: Entire `src/` directory untested
- Risk: **CRITICAL** — Any refactor or bug fix carries invisible regression risk; edge cases in auth flow, streaming parser, tool execution, and RLS policies cannot be verified
- Priority: **HIGH**
- Improvement path: Add test runner (Vitest recommended for Vite projects); start with critical paths:
  - `src/contexts/AuthContext.tsx` — anonymous sign-in flow, profile fetch, session handling
  - `src/hooks/useAgentStream.ts` — SSE parsing (`parseSSE` generator), error handling, abort control
  - `src/lib/supabase.ts` — env var validation at module load
  - RLS policies in migrations — integration tests against real Supabase

---

## Hand-Written Database Type Can Drift from Schema

**Data Integrity — Type Safety Loss:**
- What's wrong: `src/types/database.ts` is manually maintained; when migrations add/rename/remove columns, the type file is not auto-updated
- Files: `src/types/database.ts` (288 lines), all `supabase/migrations/*.sql` schemas
- Current mitigation: Migrations include column comments (e.g., `COMMENT ON FUNCTION...`) but tooling does not regenerate types
- Example: If migration `011_trending_cache.sql` adds a column `is_active` to `trending_cache`, but `database.ts` is not updated, Supabase client queries will silently allow the type to drift
- Risk: **MEDIUM** — Queries don't fail at runtime, but type assumptions break; "expected null" becomes "got string", silent data loss
- Recommendation: 
  - Adopt `supabase gen types` CLI (with `--project-id` flag) to regenerate types from live schema periodically
  - OR document in CLAUDE.md: "After every migration, regenerate `src/types/database.ts` via `supabase gen types > src/types/database.ts`"
  - Consider moving to code generation in CI/CD if adding migrations frequently

---

## No Error Reporting in Production

**Observability — Silent Failures:**
- Problem: Error boundary at `src/components/ErrorBoundary.tsx:33` has a TODO comment
  ```
  // TODO: Add error reporting service (e.g., Sentry)
  ```
- Files: `src/components/ErrorBoundary.tsx` (lines 31–35), `src/main.tsx` (error handling stub)
- Impact: Production crashes logged only to browser console; no alerting, no error aggregation, no pattern detection
- Current state: `process.env.NODE_ENV === 'production'` check exists but no integration configured
- Recommendation: 
  - Add Sentry or similar (lightweight client-side error tracking)
  - Install SDK: `npm install @sentry/react`
  - Initialize in `src/main.tsx` before app mount
  - Uncomment/implement the `logErrorToService` call in `ErrorBoundary.componentDidCatch()`
  - Set `SENTRY_DSN` in Vercel environment variables

---

## Agent-Run Edge Function Secrets & Deployment Coupling

**DevOps/Security — Manual Secret Sync:**
- Problem: `supabase/functions/agent-run/` requires `GEMINI_API_KEY` secret set via `supabase secrets set GEMINI_API_KEY <key>` against the Supabase project
- Files: `supabase/functions/agent-run/index.ts` (imports and uses secrets)
- Current process: Requires manual deployment step outside CI/CD: `supabase functions deploy agent-run` + separate secret commands
- Risk: **MEDIUM** — Secrets can be out of sync between dev/prod; accidental commits of plaintext keys; no audit trail
- Impact: Edge function silently fails or uses stale secrets if deployment skipped
- Recommendation:
  - Document in CLAUDE.md the **exact** manual steps and order (already partially done, but could be stricter)
  - Consider GitHub Actions workflow: detect changes to `supabase/functions/agent-run/`, run `supabase functions deploy agent-run` automatically
  - Store `GEMINI_API_KEY` in GitHub Secrets, export to workflow, use `supabase secrets set` in CI

---

## Anonymous Auth Dependency — Single Point of Failure

**Architecture — Routing Risk:**
- Problem: `src/contexts/AuthContext.tsx` calls `supabase.auth.signInAnonymously()` (line 53) if no session exists; if this fails, `loading` remains true and user is stuck
- Files: `src/contexts/AuthContext.tsx` (lines 46–64)
- Scenario: 
  - Supabase auth is down or rate-limited
  - Anonymous sign-in fails with `anonError`
  - App sets `user=null, session=null, loading=false` (lines 55–59)
  - Router.tsx sees `!user && !loading` → redirects to `/login`
  - User cannot access `/search` (protected route) without a login form that requires email/password
- Root cause: Anonymous sign-in **must** be enabled in Supabase Auth settings; if disabled, all unauthenticated users bounce to login
- Risk: **MEDIUM** — Silent UX failure; users hit login page without understanding why
- Guard: SIGNED_IN event check (line 83) prevents double-fetch but does not recover from anonError
- Recommendation:
  - Add explicit anonError handling in Router redirect logic — show error toast explaining "Auth service unavailable"
  - Validate that Supabase Anonymous Sign-Ins are enabled before deploy (add to pre-flight checks)
  - Consider fallback mode: if anonError, cache last-known session in localStorage and restore on next load

---

## Type Coercion Unsafe Patterns

**Code Quality — Silent Type Errors:**
- Patterns: `as unknown as Card[]` and `as unknown as Citation[]` used instead of proper runtime validation
- Files:
  - `src/hooks/useConversation.ts` (lines 119–120)
  - `src/pages/ShareView.tsx` (lines 71–72)
  - `src/hooks/useSavedResults.ts` (line 75)
- Problem: JSON from Supabase arrives as `Json` type (a union); the code checks `Array.isArray()` but then **asserts** without validation
  ```typescript
  citations: Array.isArray(m.citations) ? (m.citations as unknown as Citation[]) : []
  ```
  If the array elements don't match `Citation` shape, casting hides the mismatch; typos in field names silently pass
- Risk: **MEDIUM** — Rendering fails if shape changes; error appears downstream in components, not at data fetch
- Recommendation:
  - Use Zod schemas for runtime validation:
    ```typescript
    const CitationSchema = z.object({ url: z.string(), title: z.string() })
    const citations = CitationSchema.array().parse(m.citations ?? [])
    ```
  - Apply in `useConversation.ts`, `ShareView.tsx`, `useSavedResults.ts`

---

## Explicit Any Types in Form Components

**Maintainability — Type Gaps:**
- Pattern: `@typescript-eslint/no-explicit-any` disabled at three form input components
- Files:
  - `src/components/inputs/CustomSelect.tsx` (lines 5–6)
  - `src/components/inputs/CustomTextField.tsx` (lines 13–14)
  - `src/components/inputs/CustomTextArea.tsx` (lines 9–10)
- Problem: `register: any` is used to accept React Hook Form's register function without typing; any changes to RHF API are invisible
- Risk: **LOW** — Localized to form inputs; unlikely to break at runtime
- Recommendation:
  - Import `FieldValues, UseFormRegister` from `react-hook-form`:
    ```typescript
    import { type FieldValues, type UseFormRegister } from 'react-hook-form'
    register: UseFormRegister<FieldValues>
    ```

---

## Chunk Size Warning Limit Raised to 1000 kB

**Performance — Build Fragility:**
- What's wrong: `vite.config.ts` (line 15) raises `chunkSizeWarningLimit` to 1000 kB; default is 500 kB
- Files: `vite.config.ts`
- Reason given (comment): Accommodate vendor chunks
- Risk: **MEDIUM** — Bundle bloat hidden; if dependencies grow, the warning disappears but page load slows
- Impact: Mobile users, slow networks suffer; no alert when library is added that swells chunk size
- Current mitigations: Manual chunk splits (`react-vendor`, `ui-vendor`, `maps-vendor`, `supabase-vendor`) help but are not enforced
- Recommendation:
  - Document threshold in CLAUDE.md: "If bundle approaches 1000 kB, audit dependencies and split further before raising limit"
  - Add CI check: `npm run build` fails if **any** chunk exceeds 600 kB (stricter warning)
  - Periodically review chunk size in CI logs

---

## Streaming Parser Silently Ignores Malformed Frames

**Resilience — Silent Data Loss:**
- Code: `src/hooks/useAgentStream.ts` (lines 37–39)
  ```typescript
  try {
    const event = JSON.parse(payload) as AgentSSEEvent
    yield event
  } catch {
    // Ignore malformed frames; the stream recovers on the next one.
  }
  ```
- Problem: Invalid SSE frames (malformed JSON, truncated data) are **silently dropped**; client never knows a frame was lost
- Risk: **MEDIUM** — If Gemini returns a chunk with syntax error (quotes not escaped, newline in string), the assistant message is incomplete and user sees truncated response
- Impact: User thinks response is finished when it's actually incomplete
- Recommendation:
  - Log malformed frames (at least in development): `console.warn('SSE parse failed:', error, payload)`
  - Count dropped frames; if > 5 in a single response, emit a warning to the UI
  - Consider emitting a `frame_error` event so the client can notify the user: "Response may be incomplete"

---

## Daily Usage RPC Only Called by Edge Function

**Observability — Client-Side Bypass Risk:**
- Setup: `src/pages/Usage.tsx` shows daily cost/usage stats; it calls `get_daily_usage` RPC (migration 010)
- Files: `src/pages/Usage.tsx`, `src/hooks/useUsageStats.ts` (line 97: `call('get_daily_usage', {...})`)
- Problem: RPC is `SECURITY DEFINER` (runs as service role) but **expects the edge function to enforce caps**; if called directly from client, RLS policy blocks it (good) but there's no explicit error handling
- Code in `useUsageStats.ts`:
  ```typescript
  if (convosErr) throw new Error(convosErr.message)
  ```
  This throws raw error to component; user sees "Permission denied" instead of "You've hit your daily limit"
- Risk: **LOW** (RLS policy enforces safety) but **UX issue** (confusing error message)
- Recommendation:
  - Catch RLS permission errors in `useUsageStats.ts` and render user-friendly message: "Usage stats unavailable; contact support"
  - Optionally: expose a client-side read-only usage estimate (last-cached value from localStorage)

---

## Validations Schema Mismatch

**Data Validation — Dead Code:**
- Problem: `src/lib/validations.ts` (lines 36, 83) defines role enums and business schemas that are **not used in client**
  ```typescript
  role: z.enum(['individual', 'business'], ...)  // Line 36
  export const businessSchema = z.object(...)     // Line 83
  ```
- Files: `src/lib/validations.ts` (entire file), `src/pages/auth/Signup.tsx`, `src/pages/Settings.tsx`
- Reason: Product pivoted from city-explorer (with roles + business profiles) to TR-ACE (no roles, no business model)
- Impact: Unused schemas waste bundle size; developer confusion about whether roles still exist
- Recommendation:
  - Remove `role` from `signupSchema` (line 36)
  - Delete `businessSchema`, related types, and unused validation rules
  - Clean up `Signup.tsx` to only ask for `email`, `password`, `confirmPassword`, `fullName`, `acceptTerms`

---

## Environment Variable Debug Component in Production

**Security/DevOps — Information Disclosure Risk:**
- What: `src/components/EnvDebug.tsx` (114 lines) displays env var values in a UI tooltip if `?debug=env` URL param is set
- Files: `src/components/EnvDebug.tsx`, `src/App.tsx` (imported and rendered on every page)
- Code shows:
  - `VITE_SUPABASE_URL` (safe; public)
  - `VITE_SUPABASE_ANON_KEY` (safe; anon key, not secret)
  - `VITE_GOOGLE_MAPS_API_KEY` (sensitive; can be scraped and rate-limited by attacker)
  - `VITE_MAP_ID` (safe; Maps ID is public)
  - `VITE_GEMINI_API_KEY` (CRITICAL RISK if present; should never be client-side)
- Risk: **MEDIUM** — Attacker can use `?debug=env` to extract `VITE_GOOGLE_MAPS_API_KEY` and issue unauthorized requests; if `VITE_GEMINI_API_KEY` is accidentally committed, private key is exposed
- Safeguards: Keys are `VITE_` prefixed (public), and `VITE_GEMINI_API_KEY` is marked "optional" (fallback to mock responses if missing), but component is still a **liability**
- Recommendation:
  - Remove `EnvDebug` component entirely from App.tsx (line 19)
  - If needed in development only, gate it behind `import.meta.env.DEV` AND a hardcoded localhost check:
    ```typescript
    if (import.meta.env.DEV && window.location.hostname === 'localhost') { render EnvDebug }
    ```
  - Add CSP header in `vercel.json` or HTTP headers to block exfiltration of sensitive values

---

## Migration 005 Destructive on Fresh Databases

**DevOps — Inefficient Setup:**
- What: Migrations 001–004 build the old city-explorer schema (businesses, events, deals, bookings, reviews, etc.); migration 005 then **drops all of it**
- Files: `supabase/migrations/001_create_notifications_table.sql` → `004_fix_signup_trigger.sql` → `005_drop_legacy_tables.sql`
- Context: Product was pivoted; old tables are gone but migration history is append-only
- Impact: Fresh Supabase project running all migrations: 1→4 creates 8 tables and functions, 5 deletes them immediately — **wasteful, confusing**
- Current workaround (from CLAUDE.md): "For a fresh Supabase project, apply the end-state schema directly"
- Problem: Instruction is buried in documentation; new developer may run all migrations and waste time
- Recommendation:
  - Create a `000_fresh_database.sql` snapshot containing only the end-state schema (conversations, messages, tool_calls, user_preferences, saved_results, llm_calls, trending_cache) + RLS policies + functions
  - Document: "Use `000_fresh_database.sql` for new projects; use migrations 001–011 if replaying an old project"
  - Keep migrations 001–011 for audit trail but mark 001–004 as deprecated in comments

---

## Anonymous Signup Form Accepts Role Field

**UX/Data — Dead UI:**
- What: `src/pages/auth/Signup.tsx` form includes a role selector dropdown, but the product no longer has roles
- Files: `src/pages/auth/Signup.tsx`, `src/lib/validations.ts` (line 36)
- Problem: Form collects `role` data but it is **never saved** to `profiles` table (role column dropped in migration 005)
- Impact: Form shows "Individual / Business" selector that does nothing; user confusion
- Recommendation:
  - Remove role selector from signup form
  - Update `signupSchema` in `validations.ts` to remove the `role` field
  - Remove dead-code branches in Signup that reference role

---

## Geolocation Used in Multiple Hooks Without Centralized Caching

**Performance — Redundant Requests:**
- Problem: Geolocation is fetched in multiple places: `useGeolocation.ts`, `useTrendingPlaces.ts`, `Map.tsx`, `Search.tsx`
- Files: `src/hooks/useGeolocation.ts`, `src/components/TrendingPlacesModal.tsx` (calls `useGeolocation` locally), `src/pages/Map.tsx`, `src/pages/Search.tsx`
- Risk: **LOW** — Geolocation is cached by browser, but multiple calls to `navigator.geolocation.getCurrentPosition` can cause permission dialogs to re-appear or slow startup
- Recommendation:
  - Move geolocation to a React Context (similar to `AuthContext`)
  - Call once at app boot in `Router.tsx` or `Layout.tsx`
  - Subscribe components via `useGeolocation()` hook that reads cached coords

---

## No Runtime Assertion for Feature Flags

**Maintainability — Silent Behavior Changes:**
- Problem: Code checks `import.meta.env.DEV` and feature flags (like debug mode) scattered throughout
- Files: `src/components/EnvDebug.tsx` (line 14), `src/services/geminiService.ts` (conditional mock fallback), `src/components/ErrorBoundary.tsx` (line 32)
- Issue: No centralized feature flag system; turning off Gemini API via missing env var causes silent fallback instead of error
- Risk: **LOW** — Fallback is intentional (mock responses work), but no visibility into "API is unavailable"
- Recommendation:
  - Document in CLAUDE.md which env vars are optional vs. required
  - Consider feature flag library (e.g., `posthog` or custom context) if more toggles are needed

---

## Manual Data Type Maintenance for Shared Conversations

**Type Sync — Card & Citation Types Manual:**
- Problem: `src/types/agent.ts` defines `Card` and `Citation` types; when LLM response shape changes, types are **manually updated**
- Files: `src/types/agent.ts`, `src/pages/ShareView.tsx`, `src/hooks/useConversation.ts`
- Impact: If agent-run function starts emitting new citation fields, types don't auto-sync; unsafe cast `as unknown as Citation[]` masks the mismatch
- Recommendation:
  - Move Card and Citation shape definitions to a shared schema file (edge function + client both reference it)
  - Use generated types from the agent-run function's TypeScript definitions

---

## No Content Security Policy Headers

**Security — XSS Risk:**
- What: `vercel.json` rewrite config has no CSP headers
- Files: `vercel.json`
- Risk: **MEDIUM** — If `react-markdown` component or any dependency has XSS bug, injected scripts run without restriction
- Recommendation:
  - Add `vercel.json` security headers:
    ```json
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://maps.googleapis.com https://*.supabase.co"
          }
        ]
      }
    ]
    ```
  - Test with `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`

---

## Summary Table

| Area | Severity | Impact | Fix Effort |
|------|----------|--------|-----------|
| Zero test coverage | CRITICAL | Any change risks regressions | HIGH |
| Database type drift | MEDIUM | Silent data loss on schema changes | MEDIUM |
| No error reporting | MEDIUM | Production crashes invisible | LOW |
| Edge function secrets | MEDIUM | Manual sync, audit trail gap | MEDIUM |
| Anonymous auth SPoF | MEDIUM | UX failure if auth down | MEDIUM |
| Type coercions `as unknown` | MEDIUM | Downstream render errors | MEDIUM |
| Chunk size limit raised | MEDIUM | Hidden bundle bloat | LOW |
| SSE parser ignores frames | MEDIUM | Incomplete responses | LOW |
| EnvDebug in production | MEDIUM | API key exposure risk | LOW |
| Dead code (validations, roles) | LOW | Confusion, waste | LOW |
| Geolocation not cached | LOW | Redundant calls | LOW |

---

*Concerns audit: 2026-04-28*
