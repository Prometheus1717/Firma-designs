-- Require payment before users can save birth data while the paywall is enabled.
-- Applied to production on 2026-06-22 as migration: require_premium_for_birth_data.

create or replace function private.prevent_profile_privilege_self_promotion()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  is_service boolean := coalesce(claims ->> 'role', '') = 'service_role';
  is_admin_user boolean := private.is_admin();
begin
  if tg_op = 'INSERT' then
    if new.is_admin is true and not (is_admin_user or is_service) then
      new.is_admin := false;
    end if;

    if new.is_premium is true and not (is_admin_user or is_service) then
      new.is_premium := false;
    end if;
  else
    if new.is_admin is distinct from old.is_admin then
      if not (is_admin_user or is_service) then
        new.is_admin := old.is_admin;
      end if;
    end if;

    if new.is_premium is distinct from old.is_premium then
      if not (is_admin_user or is_service) then
        new.is_premium := old.is_premium;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_privilege_self_promotion on public.profiles;
create trigger prevent_profile_privilege_self_promotion
  before insert or update on public.profiles
  for each row
  execute function private.prevent_profile_privilege_self_promotion();

create or replace function private.prevent_unpaid_birth_data_write()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  is_service boolean := coalesce(claims ->> 'role', '') = 'service_role';
  paywall_on boolean := true;
  is_paid boolean := false;
  writes_birth_data boolean := false;
begin
  select coalesce(
    (select value = 'true' from public.app_settings where key = 'paywall_enabled'),
    true
  ) into paywall_on;

  if not paywall_on or is_service or private.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    writes_birth_data :=
      new.birth_date is not null
      or new.birth_time is not null
      or new.birth_lat is not null
      or new.birth_lng is not null
      or nullif(trim(coalesce(new.birth_city, '')), '') is not null;
    is_paid := coalesce(new.is_premium, false);
  else
    writes_birth_data :=
      new.birth_date is distinct from old.birth_date
      or new.birth_time is distinct from old.birth_time
      or new.birth_lat is distinct from old.birth_lat
      or new.birth_lng is distinct from old.birth_lng
      or new.birth_city is distinct from old.birth_city;
    is_paid := coalesce(old.is_premium, new.is_premium, false);
  end if;

  if writes_birth_data and not is_paid then
    raise exception 'Payment required before saving birth data.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unpaid_birth_data_write on public.profiles;
create trigger prevent_unpaid_birth_data_write
  before insert or update on public.profiles
  for each row
  execute function private.prevent_unpaid_birth_data_write();
