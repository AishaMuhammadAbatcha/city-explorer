-- =====================================================================
-- TR-ACE Phase 7 — migration 010: hardening layer.
--
-- Adds two pieces that, together with the edge-function changes in the
-- same phase, enforce per-user daily caps and give the app a usable
-- self-service analytics surface.
--
--   llm_calls           — a sibling of tool_calls recording every
--                         Gemini invocation (planning, step reasoning,
--                         final synthesis). Same basic shape as
--                         tool_calls but tracks input/output tokens
--                         and the resulting Gemini cost instead of a
--                         tool cost.
--   get_daily_usage(u)  — SECURITY DEFINER aggregation that sums the
--                         last 24h of tool_calls + llm_calls cost and
--                         counts the last 24h of user messages for a
--                         single user. Called by the edge function at
--                         the top of every request to enforce
--                         $0.10/day and 50-request/day caps.
--
-- RLS on llm_calls mirrors the tool_calls policy shape: SELECT for
-- owners of the parent conversation, INSERT is service-role only (no
-- client-side INSERT policy). The rpc is SECURITY DEFINER so it can
-- aggregate across the caller's conversations under RLS; EXECUTE is
-- revoked from PUBLIC and granted only to service_role because it
-- accepts an arbitrary p_user_id and must not be reachable by the
-- anon or authenticated roles (prevents users peeking at each other's
-- spend).
--
-- Apply once via `supabase db push` or the SQL editor.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.llm_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  duration_ms integer,
  cost_usd numeric(10, 6) NOT NULL DEFAULT 0,
  iteration integer,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS llm_calls_message_iteration_idx
  ON public.llm_calls (message_id, iteration);

ALTER TABLE public.llm_calls ENABLE ROW LEVEL SECURITY;

-- Owner-only SELECT via parent conversation (mirrors tool_calls).
DROP POLICY IF EXISTS llm_calls_select_own ON public.llm_calls;
CREATE POLICY llm_calls_select_own ON public.llm_calls
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE c.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies — service role bypasses RLS and is
-- the only writer.

COMMENT ON TABLE public.llm_calls IS 'Phase 7: per-invocation log of Gemini (LLM) calls with token usage and cost.';

-- -------------------------------------------------------------------
-- get_daily_usage(p_user_id) — single-RPC daily aggregation.
-- -------------------------------------------------------------------
-- Returns rolling-24h totals for a given user:
--   total_cost_usd = sum(tool_calls.cost_usd + llm_calls.cost_usd)
--   message_count  = count of role='user' messages
-- Both joined through messages -> conversations to scope by user_id.
--
-- SECURITY DEFINER because it must read rows across the caller's
-- conversations under the owner's RLS context. It is intentionally
-- NOT granted to anon/authenticated; the edge function calls it with
-- the service_role key.
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_daily_usage(p_user_id uuid)
RETURNS TABLE(total_cost_usd numeric, message_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH tool_cost AS (
    SELECT COALESCE(SUM(tc.cost_usd), 0)::numeric AS s
    FROM public.tool_calls tc
    JOIN public.messages m ON m.id = tc.message_id
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE c.user_id = p_user_id
      AND tc.created_at > now() - interval '24 hours'
  ),
  llm_cost AS (
    SELECT COALESCE(SUM(lc.cost_usd), 0)::numeric AS s
    FROM public.llm_calls lc
    JOIN public.messages m ON m.id = lc.message_id
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE c.user_id = p_user_id
      AND lc.created_at > now() - interval '24 hours'
  ),
  msg_count AS (
    SELECT COUNT(*)::bigint AS n
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE c.user_id = p_user_id
      AND m.role = 'user'
      AND m.created_at > now() - interval '24 hours'
  )
  SELECT (tool_cost.s + llm_cost.s) AS total_cost_usd,
         msg_count.n                AS message_count
  FROM tool_cost, llm_cost, msg_count;
$$;

REVOKE ALL ON FUNCTION public.get_daily_usage(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_daily_usage(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_daily_usage(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_usage(uuid) TO service_role;

COMMENT ON FUNCTION public.get_daily_usage(uuid)
  IS 'Phase 7: rolling-24h cost + user-message count for one user. SECURITY DEFINER; service_role only.';
