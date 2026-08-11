-- Durable daily health-report coordination for natalnavigator.com.
--
-- Before these jobs run, provision this required value in Supabase Vault
-- (values are intentionally not part of this migration):
--   natal_monitor_fallback_secret
--
-- These optional values enable a direct Telegram dead-man alert that does not
-- depend on Vercel. Without them, the dead-man still re-triggers the report:
--   natal_monitor_telegram_bot_token
--   natal_monitor_telegram_chat_ids
--
-- natal_monitor_telegram_chat_ids may be either a JSON string array or a
-- comma-separated list. pg_cron schedules below are UTC.

begin;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

create table if not exists public.health_report_runs (
  report_date date primary key
    default ((now() at time zone 'Europe/Berlin')::date),
  attempt_id uuid,
  attempt_count integer not null default 0
    check (attempt_count >= 0),
  trigger text,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'ok', 'failing', 'error')),
  started_at timestamptz,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  checks jsonb not null default '[]'::jsonb
    check (jsonb_typeof(checks) = 'array'),
  telegram jsonb not null default '{}'::jsonb
    check (jsonb_typeof(telegram) = 'object'),
  last_error text,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'delivered', 'failed', 'skipped')),
  delivery_attempted_at timestamptz,
  delivered_at timestamptz,
  fallback_requested_at timestamptz,
  fallback_request_id bigint,
  deadman_claimed_at timestamptz,
  deadman_alert_requested_at timestamptz,
  deadman_telegram_request_ids bigint[] not null default '{}'::bigint[],
  deadman_vercel_request_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_report_runs_lease_has_attempt
    check (lease_expires_at is null or attempt_id is not null),
  constraint health_report_runs_delivered_state
    check ((delivery_status = 'delivered') = (delivered_at is not null))
);

comment on table public.health_report_runs is
  'One durable, idempotent health-report coordination row per Europe/Berlin calendar day.';

alter table public.health_report_runs enable row level security;
revoke all on table public.health_report_runs
  from public, anon, authenticated, service_role;
grant select, insert, update on table public.health_report_runs to service_role;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'health_report_runs'
      and policyname = 'health_report_runs_service_role_all'
  ) then
    create policy health_report_runs_service_role_all
      on public.health_report_runs
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end;
$policy$;

create or replace function public.claim_health_report_run(
  p_report_date date,
  p_attempt_id uuid,
  p_trigger text,
  p_lease_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_claimed boolean := false;
begin
  if p_report_date is null then
    raise exception using
      errcode = '22004',
      message = 'p_report_date must not be null';
  end if;

  if p_attempt_id is null then
    raise exception using
      errcode = '22004',
      message = 'p_attempt_id must not be null';
  end if;

  if nullif(btrim(p_trigger), '') is null then
    raise exception using
      errcode = '22023',
      message = 'p_trigger must not be empty';
  end if;

  if p_lease_seconds is null or p_lease_seconds < 15 or p_lease_seconds > 1800 then
    raise exception using
      errcode = '22023',
      message = 'p_lease_seconds must be between 15 and 1800';
  end if;

  insert into public.health_report_runs as current_run (
    report_date,
    attempt_id,
    attempt_count,
    trigger,
    status,
    started_at,
    lease_expires_at,
    completed_at,
    checks,
    telegram,
    last_error,
    delivery_status,
    delivery_attempted_at,
    delivered_at,
    created_at,
    updated_at
  )
  values (
    p_report_date,
    p_attempt_id,
    1,
    btrim(p_trigger),
    'running',
    clock_timestamp(),
    clock_timestamp() + make_interval(secs => p_lease_seconds),
    null,
    '[]'::jsonb,
    '{}'::jsonb,
    null,
    'pending',
    null,
    null,
    clock_timestamp(),
    clock_timestamp()
  )
  on conflict (report_date) do update
  set attempt_id = excluded.attempt_id,
      attempt_count = current_run.attempt_count + 1,
      trigger = excluded.trigger,
      status = 'running',
      started_at = excluded.started_at,
      lease_expires_at = excluded.lease_expires_at,
      completed_at = null,
      checks = '[]'::jsonb,
      telegram = '{}'::jsonb,
      last_error = null,
      delivery_status = 'pending',
      delivery_attempted_at = null,
      delivered_at = null,
      updated_at = excluded.updated_at
  where current_run.delivered_at is null
    and (
      current_run.status <> 'running'
      or current_run.lease_expires_at is null
      or current_run.lease_expires_at <= clock_timestamp()
    )
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$function$;

create or replace function public.complete_health_report_run(
  p_report_date date,
  p_attempt_id uuid,
  p_status text,
  p_checks jsonb,
  p_telegram jsonb,
  p_error text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_checks jsonb := coalesce(p_checks, '[]'::jsonb);
  v_telegram jsonb := coalesce(p_telegram, '{}'::jsonb);
  v_delivered_count integer := 0;
  v_failed_count integer := 0;
  v_delivery_ok boolean := false;
  v_delivery_skipped boolean := false;
  v_updated integer := 0;
begin
  if p_report_date is null or p_attempt_id is null then
    raise exception using
      errcode = '22004',
      message = 'p_report_date and p_attempt_id must not be null';
  end if;

  if p_status is null or p_status not in ('ok', 'failing', 'error') then
    raise exception using
      errcode = '22023',
      message = 'p_status must be ok, failing, or error';
  end if;

  if jsonb_typeof(v_checks) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'p_checks must be a JSON array';
  end if;

  if jsonb_typeof(v_telegram) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'p_telegram must be a JSON object';
  end if;

  if coalesce(v_telegram ->> 'delivered', '') ~ '^[0-9]+$' then
    v_delivered_count := (v_telegram ->> 'delivered')::integer;
  end if;

  if coalesce(v_telegram ->> 'failed', '') ~ '^[0-9]+$' then
    v_failed_count := (v_telegram ->> 'failed')::integer;
  end if;

  v_delivery_skipped := coalesce(v_telegram ->> 'skipped', '') <> '';
  v_delivery_ok := v_delivered_count > 0
    and v_failed_count = 0
    and nullif(btrim(coalesce(v_telegram ->> 'error', '')), '') is null;

  update public.health_report_runs as current_run
  set status = p_status,
      completed_at = clock_timestamp(),
      lease_expires_at = null,
      checks = v_checks,
      telegram = v_telegram,
      last_error = nullif(p_error, ''),
      delivery_status = case
        when v_delivery_ok then 'delivered'
        when v_delivery_skipped then 'skipped'
        else 'failed'
      end,
      delivery_attempted_at = case
        when v_delivery_skipped then null
        else clock_timestamp()
      end,
      delivered_at = case
        when v_delivery_ok then clock_timestamp()
        else null
      end,
      updated_at = clock_timestamp()
  where current_run.report_date = p_report_date
    and current_run.attempt_id = p_attempt_id
    and current_run.status = 'running';

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$function$;

create or replace function public.get_health_report_status(
  p_report_date date
)
returns setof public.health_report_runs
language sql
stable
security invoker
set search_path = ''
as $function$
  select current_run.*
  from public.health_report_runs as current_run
  where current_run.report_date = p_report_date;
$function$;

revoke all on function public.claim_health_report_run(date, uuid, text, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_health_report_run(date, uuid, text, jsonb, jsonb, text)
  from public, anon, authenticated, service_role;
revoke all on function public.get_health_report_status(date)
  from public, anon, authenticated, service_role;

grant execute on function public.claim_health_report_run(date, uuid, text, integer)
  to service_role;
grant execute on function public.complete_health_report_run(date, uuid, text, jsonb, jsonb, text)
  to service_role;
grant execute on function public.get_health_report_status(date)
  to service_role;

create or replace function private.request_health_report_fallback(
  p_trigger text default 'supabase-fallback'
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_report_date date := (clock_timestamp() at time zone 'Europe/Berlin')::date;
  v_fallback_secret text;
  v_request_id bigint;
  v_claimed boolean := false;
begin
  insert into public.health_report_runs (
    report_date,
    trigger,
    status,
    created_at,
    updated_at
  )
  values (
    v_report_date,
    coalesce(nullif(btrim(p_trigger), ''), 'supabase-fallback'),
    'pending',
    clock_timestamp(),
    clock_timestamp()
  )
  on conflict (report_date) do nothing;

  update public.health_report_runs as current_run
  set fallback_requested_at = clock_timestamp(),
      trigger = coalesce(nullif(current_run.trigger, ''), 'supabase-fallback'),
      updated_at = clock_timestamp()
  where current_run.report_date = v_report_date
    and current_run.delivered_at is null
    and current_run.fallback_requested_at is null
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    return null;
  end if;

  select nullif(btrim(secret.decrypted_secret), '')
  into v_fallback_secret
  from vault.decrypted_secrets as secret
  where secret.name = 'natal_monitor_fallback_secret'
  limit 1;

  if v_fallback_secret is null then
    raise exception using
      errcode = '22023',
      message = 'Vault secret natal_monitor_fallback_secret is missing or empty';
  end if;

  select net.http_get(
    url := 'https://natalnavigator.com/api/health-report',
    params := jsonb_build_object(
      'trigger', coalesce(nullif(btrim(p_trigger), ''), 'supabase-fallback')
    ),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_fallback_secret,
      'Accept', 'application/json',
      'User-Agent', 'supabase-health-monitor/1.0'
    ),
    timeout_milliseconds := 10000
  )
  into v_request_id;

  update public.health_report_runs as current_run
  set fallback_request_id = v_request_id,
      updated_at = clock_timestamp()
  where current_run.report_date = v_report_date;

  return v_request_id;
end;
$function$;

create or replace function private.run_health_report_deadman()
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_report_date date := (clock_timestamp() at time zone 'Europe/Berlin')::date;
  v_claimed boolean := false;
  v_fallback_secret text;
  v_bot_token text;
  v_chat_ids_raw text;
  v_chat_ids_json jsonb;
  v_chat_id text;
  v_seen_chat_ids text[] := '{}'::text[];
  v_telegram_request_ids bigint[] := '{}'::bigint[];
  v_request_id bigint;
  v_vercel_request_id bigint;
  v_message text;
begin
  insert into public.health_report_runs (
    report_date,
    trigger,
    status,
    created_at,
    updated_at
  )
  values (
    v_report_date,
    'supabase-deadman',
    'pending',
    clock_timestamp(),
    clock_timestamp()
  )
  on conflict (report_date) do nothing;

  update public.health_report_runs as current_run
  set deadman_claimed_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where current_run.report_date = v_report_date
    and current_run.delivered_at is null
    and current_run.deadman_claimed_at is null
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    return false;
  end if;

  select nullif(btrim(secret.decrypted_secret), '')
  into v_fallback_secret
  from vault.decrypted_secrets as secret
  where secret.name = 'natal_monitor_fallback_secret'
  limit 1;

  select nullif(btrim(secret.decrypted_secret), '')
  into v_bot_token
  from vault.decrypted_secrets as secret
  where secret.name = 'natal_monitor_telegram_bot_token'
  limit 1;

  select nullif(btrim(secret.decrypted_secret), '')
  into v_chat_ids_raw
  from vault.decrypted_secrets as secret
  where secret.name = 'natal_monitor_telegram_chat_ids'
  limit 1;

  if v_fallback_secret is null then
    raise exception using
      errcode = '22023',
      message = 'Vault secret natal_monitor_fallback_secret is missing or empty';
  end if;

  if v_bot_token is not null and v_chat_ids_raw is not null then
    v_message := format(
      E'⚠️ Natal Navigator Monitor\nKein täglicher Telegram-Bericht für %s eingegangen. Supabase startet den Vercel-Report erneut.',
      to_char(v_report_date, 'DD.MM.YYYY')
    );

    if left(ltrim(v_chat_ids_raw), 1) = '[' then
      begin
        v_chat_ids_json := v_chat_ids_raw::jsonb;
      exception
        when others then
          raise exception using
            errcode = '22023',
            message = 'Vault secret natal_monitor_telegram_chat_ids is not valid JSON';
      end;

      if jsonb_typeof(v_chat_ids_json) <> 'array' then
        raise exception using
          errcode = '22023',
          message = 'Vault secret natal_monitor_telegram_chat_ids must be a JSON array or comma-separated list';
      end if;

      for v_chat_id in
        select btrim(chat_id.value)
        from jsonb_array_elements_text(v_chat_ids_json) as chat_id(value)
      loop
        if v_chat_id = '' or v_chat_id = any(v_seen_chat_ids) then
          continue;
        end if;

        v_seen_chat_ids := array_append(v_seen_chat_ids, v_chat_id);

        select net.http_post(
          url := format('https://api.telegram.org/bot%s/sendMessage', v_bot_token),
          body := jsonb_build_object(
            'chat_id', v_chat_id,
            'text', v_message,
            'disable_web_page_preview', true
          ),
          headers := jsonb_build_object('Content-Type', 'application/json'),
          timeout_milliseconds := 10000
        )
        into v_request_id;

        v_telegram_request_ids := array_append(v_telegram_request_ids, v_request_id);
      end loop;
    else
      foreach v_chat_id in array string_to_array(v_chat_ids_raw, ',')
      loop
        v_chat_id := btrim(v_chat_id);

        if v_chat_id = '' or v_chat_id = any(v_seen_chat_ids) then
          continue;
        end if;

        v_seen_chat_ids := array_append(v_seen_chat_ids, v_chat_id);

        select net.http_post(
          url := format('https://api.telegram.org/bot%s/sendMessage', v_bot_token),
          body := jsonb_build_object(
            'chat_id', v_chat_id,
            'text', v_message,
            'disable_web_page_preview', true
          ),
          headers := jsonb_build_object('Content-Type', 'application/json'),
          timeout_milliseconds := 10000
        )
        into v_request_id;

        v_telegram_request_ids := array_append(v_telegram_request_ids, v_request_id);
      end loop;
    end if;

    if cardinality(v_telegram_request_ids) = 0 then
      raise exception using
        errcode = '22023',
        message = 'Vault secret natal_monitor_telegram_chat_ids contains no usable chat IDs';
    end if;
  end if;

  select net.http_get(
    url := 'https://natalnavigator.com/api/health-report',
    params := jsonb_build_object('trigger', 'supabase-deadman'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_fallback_secret,
      'Accept', 'application/json',
      'User-Agent', 'supabase-health-monitor/1.0'
    ),
    timeout_milliseconds := 10000
  )
  into v_vercel_request_id;

  update public.health_report_runs as current_run
  set deadman_alert_requested_at = case
        when cardinality(v_telegram_request_ids) > 0 then clock_timestamp()
        else null
      end,
      deadman_telegram_request_ids = v_telegram_request_ids,
      deadman_vercel_request_id = v_vercel_request_id,
      updated_at = clock_timestamp()
  where current_run.report_date = v_report_date;

  return true;
end;
$function$;

create or replace function private.cleanup_health_report_monitor(
  p_run_retention_days integer default 90,
  p_cron_log_retention_days integer default 30
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_deleted_runs integer := 0;
  v_deleted_cron_rows integer := 0;
begin
  if p_run_retention_days is null
     or p_run_retention_days < 30
     or p_run_retention_days > 730 then
    raise exception using
      errcode = '22023',
      message = 'p_run_retention_days must be between 30 and 730';
  end if;

  if p_cron_log_retention_days is null
     or p_cron_log_retention_days < 7
     or p_cron_log_retention_days > 365 then
    raise exception using
      errcode = '22023',
      message = 'p_cron_log_retention_days must be between 7 and 365';
  end if;

  delete from public.health_report_runs as current_run
  where current_run.report_date
    < ((clock_timestamp() at time zone 'Europe/Berlin')::date - p_run_retention_days);

  get diagnostics v_deleted_runs = row_count;

  delete from cron.job_run_details as job_run
  using cron.job as monitor_job
  where monitor_job.jobid = job_run.jobid
    and monitor_job.jobname in (
      'natal-health-report-fallback',
      'natal-health-report-deadman',
      'natal-health-report-retention'
    )
    and coalesce(job_run.end_time, job_run.start_time)
    < clock_timestamp() - make_interval(days => p_cron_log_retention_days);

  get diagnostics v_deleted_cron_rows = row_count;

  return jsonb_build_object(
    'health_report_runs', v_deleted_runs,
    'cron_job_run_details', v_deleted_cron_rows
  );
end;
$function$;

revoke all on function private.request_health_report_fallback(text)
  from public, anon, authenticated, service_role;
revoke all on function private.run_health_report_deadman()
  from public, anon, authenticated, service_role;
revoke all on function private.cleanup_health_report_monitor(integer, integer)
  from public, anon, authenticated, service_role;

-- Reusing the same case-sensitive job name makes cron.schedule update the
-- existing job, so rerunning this migration does not create duplicates.
-- Vercel Hobby may run the 06:15 UTC job anywhere in the 06:00-06:59 UTC
-- window; 07:10 is therefore safely after that window, with dead-man at 07:40.
select cron.schedule(
  'natal-health-report-fallback',
  '10 7 * * *',
  $cron$select private.request_health_report_fallback('supabase-fallback');$cron$
);

select cron.schedule(
  'natal-health-report-deadman',
  '40 7 * * *',
  $cron$select private.run_health_report_deadman();$cron$
);

select cron.schedule(
  'natal-health-report-retention',
  '17 3 * * *',
  $cron$select private.cleanup_health_report_monitor(90, 30);$cron$
);

commit;
