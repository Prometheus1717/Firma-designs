-- =============================================================
-- SECURITY HARDENING: move privileged RLS helpers out of public
--
-- Why:
-- Supabase exposes the public schema through the Data API. SECURITY DEFINER
-- helpers should live in an unexposed schema so they cannot be called as
-- ordinary public RPC endpoints.
--
-- Run in Supabase SQL Editor after reviewing the policy names below.
-- =============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION private.prevent_profile_privilege_self_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT private.is_admin() THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;

  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    IF NOT private.is_admin() THEN
      NEW.is_premium := OLD.is_premium;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prevent_profile_privilege_self_promotion() FROM PUBLIC;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

REVOKE ALL ON TABLE public.app_settings FROM anon;
REVOKE ALL ON TABLE public.app_settings FROM authenticated;
GRANT SELECT ON TABLE public.app_settings TO authenticated;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (private.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS prevent_admin_self_promotion ON public.profiles;
DROP TRIGGER IF EXISTS prevent_premium_self_promotion ON public.profiles;
DROP TRIGGER IF EXISTS prevent_profile_privilege_self_promotion ON public.profiles;

CREATE TRIGGER prevent_profile_privilege_self_promotion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_profile_privilege_self_promotion();

DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can read public settings" ON public.app_settings;
DROP POLICY IF EXISTS "Service role can manage app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.app_settings;

CREATE POLICY "Authenticated users can read public settings"
  ON public.app_settings FOR SELECT
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

CREATE POLICY "Service role full access"
  ON public.app_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP FUNCTION IF EXISTS public.prevent_admin_self_promotion();
DROP FUNCTION IF EXISTS public.prevent_premium_self_promotion();
DROP FUNCTION IF EXISTS public.is_admin();

COMMIT;
