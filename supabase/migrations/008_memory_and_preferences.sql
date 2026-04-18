-- =====================================================================
-- TR-ACE Phase 5 — migration 008: memory & personalization layer.
--
-- Adds two tables that back the Phase 5 experience:
--
--   user_preferences — one row per user. Holds lightweight, user-set
--                      defaults (location, currency, radius, price
--                      range) that the agent-run edge function
--                      injects into the system prompt when the user's
--                      query is ambiguous.
--   saved_results    — user-bookmarked result cards. One row per
--                      bookmark. The card payload is stored as JSONB
--                      so any PlaceCard/VideoCard/ArticleCard/
--                      ProductCard kind can be saved without a
--                      per-kind schema. A unique expression index on
--                      (user_id, card->>kind, card->>id) prevents
--                      double-bookmarking the same item.
--
-- RLS is on for both tables. Both policies scope to auth.uid() on
-- user_id (no service-role-only rows here).
--
-- The set_updated_at() function is created IF NOT EXISTS in migration
-- 006; this migration re-declares it with CREATE OR REPLACE to keep
-- the file applicable in isolation (e.g., fresh DBs).
--
-- Apply once via `supabase db push` or the SQL editor.
-- =====================================================================

-- -------------------------------------------------------------------
-- Shared updated_at trigger function (idempotent redeclaration).
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------
-- user_preferences
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_location text,
  currency text,
  search_radius_m integer DEFAULT 5000,
  price_range_min numeric(12, 2),
  price_range_max numeric(12, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_preferences_set_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.user_preferences IS 'TR-ACE Phase 5 — per-user agent defaults (location, currency, radius, price range).';

-- -------------------------------------------------------------------
-- saved_results
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.saved_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card jsonb NOT NULL,
  note text,
  source_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saved results" ON public.saved_results;
CREATE POLICY "Users can manage own saved results" ON public.saved_results
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_results_user_created_idx
  ON public.saved_results (user_id, created_at DESC);

-- Expression index prevents saving the same card twice per user.
-- No generated columns — the unique key is expressed directly on the
-- jsonb accessors.
CREATE UNIQUE INDEX IF NOT EXISTS saved_results_dedupe_idx
  ON public.saved_results (user_id, (card->>'kind'), (card->>'id'));

COMMENT ON TABLE public.saved_results IS 'TR-ACE Phase 5 — user-bookmarked result cards (any kind).';
