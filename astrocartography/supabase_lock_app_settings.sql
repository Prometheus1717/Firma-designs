-- =============================================================
-- SECURITY FIX: Lock down app_settings table
--
-- Problem: app_settings has "FOR SELECT USING (true)" which lets
-- anyone with the anon key read all settings including internal
-- config, feature flags, and admin-only data.
--
-- Fix: Only allow authenticated users to read non-sensitive
-- public keys. All writes go through service_role (API routes).
-- =============================================================

-- Step 1: Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Service role can manage app_settings" ON app_settings;

-- Step 2: Ensure RLS is enabled
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Authenticated users can read only public-facing settings
-- (pricing display, paywall status, announcements — things the frontend needs)
CREATE POLICY "Authenticated users can read public settings" ON app_settings
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND key IN (
      'paywall_enabled',
      'display_price',
      'display_currency',
      'price_label',
      'announcement_text',
      'announcement_active',
      'announcement_color'
    )
  );

-- Step 4: Service role has full access (used by API routes)
CREATE POLICY "Service role full access" ON app_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Step 5: Also tighten profiles — prevent anon from reading anything
-- (This should already be the case from supabase_fix_rls.sql, but let's verify)
-- No changes needed if existing policies only allow auth.uid() = id and is_admin()

-- Step 6: Prevent non-admin users from updating is_premium on profiles
-- (The trigger already prevents is_admin changes, add one for is_premium too)
CREATE OR REPLACE FUNCTION public.prevent_premium_self_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow is_premium changes if the current user is an admin
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    IF NOT public.is_admin() THEN
      NEW.is_premium := OLD.is_premium; -- silently revert
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_premium_self_promotion ON public.profiles;
CREATE TRIGGER prevent_premium_self_promotion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_premium_self_promotion();
