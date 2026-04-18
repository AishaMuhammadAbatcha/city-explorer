-- =====================================================================
-- TR-ACE Phase 6 — migration 009: conversation sharing layer.
--
-- Adds an additive public-sharing mechanism for conversations:
--
--   conversations.shared      boolean flag; defaults false.
--   conversations.share_slug  unique uuid; lazily assigned when the
--                             owner first shares a conversation. Kept
--                             across unshare/re-share so a stable link
--                             can survive toggling.
--
-- Two additional RLS policies grant anonymous SELECT access to shared
-- conversations and their messages. Existing owner-only policies are
-- NOT dropped — they remain authoritative for writes and for owner
-- reads of private conversations.
--
-- tool_calls are intentionally not exposed publicly; the share page
-- renders messages + cards only. A future migration can extend the
-- public read surface if the step trace becomes a share-time feature.
--
-- Apply once via `supabase db push` or the SQL editor.
-- =====================================================================

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT false;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS share_slug uuid UNIQUE;

CREATE INDEX IF NOT EXISTS conversations_share_slug_idx
  ON public.conversations (share_slug)
  WHERE share_slug IS NOT NULL;

-- Public read: anyone (including anon role) can SELECT a conversation
-- row whenever shared = true.
DROP POLICY IF EXISTS "Anyone can read shared conversations" ON public.conversations;
CREATE POLICY "Anyone can read shared conversations" ON public.conversations
  FOR SELECT USING (shared = true);

-- Public read: anyone can SELECT messages whose parent conversation is
-- currently flagged shared. Toggling shared=false immediately hides the
-- thread from anonymous readers again.
DROP POLICY IF EXISTS "Anyone can read messages in shared conversations" ON public.messages;
CREATE POLICY "Anyone can read messages in shared conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE shared = true
    )
  );

COMMENT ON COLUMN public.conversations.shared     IS 'Phase 6: when true, conversation + messages are publicly readable via /share/:slug.';
COMMENT ON COLUMN public.conversations.share_slug IS 'Phase 6: stable uuid slug for the public share URL; assigned on first share.';
