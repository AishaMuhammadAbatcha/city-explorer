-- =====================================================================
-- TR-ACE Phase 3 — migration 007: multi-step agent additions.
--
-- Extends the Phase 2 agent persistence layer so a single assistant
-- turn can capture multiple tool calls and carry typed result cards.
--
--   messages.cards        — ordered JSONB array of Card objects
--                           (kind: place|video|article|product) built
--                           server-side from tool outputs. Rendered by
--                           the client as a responsive grid below the
--                           markdown answer.
--   tool_calls.step_number — which iteration of the ReAct loop produced
--                           this tool call (1-indexed, capped at 5 by
--                           the edge function).
--
-- The composite index on (message_id, step_number) keeps the step
-- trace query fast when hydrating historical conversations.
--
-- Apply once via `supabase db push` or the SQL editor.
-- =====================================================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS cards jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.tool_calls
  ADD COLUMN IF NOT EXISTS step_number integer;

CREATE INDEX IF NOT EXISTS tool_calls_message_step_idx
  ON public.tool_calls (message_id, step_number);
