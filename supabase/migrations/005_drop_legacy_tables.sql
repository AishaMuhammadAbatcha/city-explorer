-- =====================================================================
-- TR-ACE pivot — migration 005: drop legacy city-explorer tables and
-- remove role-based branching.
--
-- DESTRUCTIVE: this migration permanently deletes all data in the
-- businesses, events, deals, bookings, reviews, favorites, and
-- notifications tables, and drops the `role` column from `profiles`
-- along with the `user_role` enum.
--
-- Context: the product is pivoting from a city-discovery app with
-- role-gated dashboards into TR-ACE, an agentic AI search assistant.
-- The old feature set is no longer reachable from the client and is
-- being removed from the database as well. Migration 004 is preserved
-- (migration history is append-only); its trigger function is
-- superseded here.
--
-- Run this once against the Supabase project via the SQL editor or
-- `supabase db push`. Take a backup first if any of this data matters.
-- =====================================================================

-- Drop tables in dependency order (children first).
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.business_booking_settings CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;

-- Supersede the role-aware trigger from migration 004 with a
-- role-free version that only copies id, email, full_name.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Creates a profile row when a new auth user signs up (TR-ACE: no role).';

-- Recreate the on-signup trigger (was dropped with CASCADE above).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Remove role from profiles and drop the enum type.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
DROP TYPE IF EXISTS public.user_role;
