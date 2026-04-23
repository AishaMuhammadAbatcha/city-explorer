-- =====================================================================
-- TR-ACE — migration 011: trending_cache layer.
--
-- Backs the "trending places" modal shown on /search and /map. Google
-- Places Nearby Search costs ~$0.025–0.032 per call; this table caches
-- responses for 24h keyed by (geocell_lat, geocell_lng, category) so
-- every page load does NOT hit the Places API directly.
--
-- geocell_* are the user's coords rounded to 3 decimal places (~110m
-- grid) — users within the same block share a cache entry, which is
-- more than enough resolution for "what's popular near me."
--
-- No RLS policy → service_role only (the edge function is the only
-- writer/reader). The table never exposes user-identifying data, so
-- client-side reads aren't needed.
--
-- Apply once via `supabase db push` or the SQL editor.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.trending_cache (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geocell_lat  numeric(6, 3) NOT NULL,
  geocell_lng  numeric(7, 3) NOT NULL,
  category     text NOT NULL,
  places       jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (geocell_lat, geocell_lng, category)
);

-- Fast lookup path: (cell, category) + expiry check.
CREATE INDEX IF NOT EXISTS trending_cache_lookup_idx
  ON public.trending_cache (geocell_lat, geocell_lng, category, expires_at);

-- Secondary index so a scheduled cleanup job can sweep expired rows
-- without a full table scan.
CREATE INDEX IF NOT EXISTS trending_cache_expires_idx
  ON public.trending_cache (expires_at);

ALTER TABLE public.trending_cache ENABLE ROW LEVEL SECURITY;
-- No policies → only service_role (which bypasses RLS) can read/write.

COMMENT ON TABLE public.trending_cache IS
  '24h cache of Google Places Nearby Search results, keyed by ~110m geocell + category. Service-role only.';
