-- =====================================================================
-- TR-ACE Phase 2 — migration 006: agent persistence layer.
--
-- Adds three tables that back the agentic search experience:
--
--   conversations — one row per chat thread; owned by auth.users.
--   messages      — append-only log of turns within a conversation
--                   (role=user|assistant|system). Assistant rows may
--                   carry a `citations` JSON array extracted from tool
--                   outputs.
--   tool_calls    — structured record of every Gemini function-call
--                   invocation. Populated by the agent-run edge
--                   function (service role); readable by the owning
--                   user via RLS.
--
-- RLS is on for all three. Conversations are full CRUD by owner.
-- Messages are append-only from the client (no UPDATE/DELETE policy
-- for end users; service role bypasses). Tool calls are service-role
-- INSERT only; the owning user can SELECT them through the parent
-- conversation.
--
-- Apply once via `supabase db push` or the SQL editor.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_user_updated_idx
  ON public.conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS public.tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  cost_usd numeric(10, 6) NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_calls_message_idx
  ON public.tool_calls (message_id);

-- -------------------------------------------------------------------
-- updated_at trigger on conversations
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_set_updated_at ON public.conversations;
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_calls    ENABLE ROW LEVEL SECURITY;

-- conversations: owner has full CRUD.
DROP POLICY IF EXISTS conversations_select_own ON public.conversations;
CREATE POLICY conversations_select_own ON public.conversations
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
CREATE POLICY conversations_insert_own ON public.conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
CREATE POLICY conversations_update_own ON public.conversations
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS conversations_delete_own ON public.conversations;
CREATE POLICY conversations_delete_own ON public.conversations
  FOR DELETE USING (user_id = auth.uid());

-- messages: append-only for the owner; SELECT/INSERT only.
DROP POLICY IF EXISTS messages_select_own ON public.messages;
CREATE POLICY messages_select_own ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_insert_own ON public.messages;
CREATE POLICY messages_insert_own ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- tool_calls: SELECT by parent-conversation ownership; INSERT via
-- service role only (no client-side INSERT policy).
DROP POLICY IF EXISTS tool_calls_select_own ON public.tool_calls;
CREATE POLICY tool_calls_select_own ON public.tool_calls
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE c.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.conversations IS 'TR-ACE chat threads, one row per conversation.';
COMMENT ON TABLE public.messages      IS 'Append-only log of conversation turns.';
COMMENT ON TABLE public.tool_calls    IS 'Structured record of agent tool invocations.';
