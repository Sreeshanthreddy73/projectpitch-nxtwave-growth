-- ProjectPitch database schema
-- Run this whole file once in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is safe to re-run: every statement is idempotent.
--
-- Every table carries is_demo. Real and simulated rows are never aggregated
-- together: each query and function below filters on exactly one value of it.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists registrations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  email         text not null unique check (email = lower(email) and email like '%_@_%._%'),
  college       text not null check (char_length(college) between 2 and 120),
  branch        text not null,
  year          text not null,
  ref_code      text not null unique check (ref_code ~ '^[A-Z0-9]{6,12}$'),
  referred_by   text references registrations (ref_code),
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  variant       text check (variant in ('a', 'b')),
  consent_at    timestamptz not null,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  check (referred_by is null or referred_by <> ref_code)
);

create index if not exists registrations_referred_by_idx on registrations (referred_by);
create index if not exists registrations_demo_created_idx on registrations (is_demo, created_at);

create table if not exists blueprints (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null,
  registration_id uuid unique references registrations (id) on delete cascade,
  branch          text not null,
  year            text not null,
  skill_level     text not null check (skill_level in ('beginner', 'intermediate', 'advanced')),
  interest        text not null,
  title           text not null,
  problem         text not null,
  stack           text[] not null,
  difficulty      text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  build_plan      jsonb not null,          -- [{ "minutes": 10, "step": "..." }, ...]
  resume_bullet   text not null,
  generated_by    text not null check (generated_by in ('ai', 'fallback')),
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists blueprints_session_idx on blueprints (session_id);

create table if not exists events (
  id            bigint generated always as identity primary key,
  session_id    uuid not null,
  type          text not null check (type in ('visit', 'generate', 'register', 'share_click', 'card_view')),
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  ref_code      text,
  variant       text check (variant in ('a', 'b')),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists events_demo_type_created_idx on events (is_demo, type, created_at);
create index if not exists events_session_idx on events (session_id);

create table if not exists insights (
  id               uuid primary key default gen_random_uuid(),
  metrics_snapshot jsonb not null,         -- aggregates only, never row-level data
  working          jsonb not null,         -- { "headline", "detail" }
  leaking          jsonb not null,         -- { "headline", "detail" }
  next_actions     jsonb not null,         -- [{ "action", "why", "metric", "decision", "note" }]
  generated_by     text not null check (generated_by in ('ai', 'fallback')),
  is_demo          boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists insights_demo_created_idx on insights (is_demo, created_at desc);

create table if not exists spend_entries (
  id            uuid primary key default gen_random_uuid(),
  label         text not null check (char_length(label) between 2 and 80),
  utm_campaign  text,
  amount_inr    integer not null check (amount_inr > 0 and amount_inr <= 100000),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- RLS is on with no policies, so the public (anon) key can read and write
-- nothing. The app only talks to the database from the server with the
-- service-role key, which bypasses RLS.

alter table registrations enable row level security;
alter table blueprints    enable row level security;
alter table events        enable row level security;
alter table insights      enable row level security;
alter table spend_entries enable row level security;

-- ---------------------------------------------------------------------------
-- dashboard_metrics: every number on the admin dashboard, for ONE dataset
-- ---------------------------------------------------------------------------

create or replace function dashboard_metrics(p_demo boolean)
returns jsonb
language sql
stable
as $$
  with ev as (
    select session_id, type, created_at, variant, utm_campaign,
           coalesce(utm_source, 'direct') as source
    from events
    where is_demo = p_demo
  ),
  reg as (
    select name, college, branch, ref_code, referred_by, created_at, variant, utm_campaign,
           coalesce(utm_source, 'direct') as source
    from registrations
    where is_demo = p_demo
  ),
  daily as (
    select day, sum(v)::int as visitors, sum(r)::int as registrations
    from (
      select (created_at at time zone 'Asia/Kolkata')::date as day,
             count(distinct session_id) as v, 0 as r
      from ev where type = 'visit' group by 1
      union all
      select (created_at at time zone 'Asia/Kolkata')::date, 0, count(*)
      from reg group by 1
    ) x
    group by day
  ),
  by_source as (
    select source, sum(v)::int as visitors, sum(g)::int as generators, sum(r)::int as registrations
    from (
      select source,
             count(distinct session_id) filter (where type = 'visit') as v,
             count(distinct session_id) filter (where type = 'generate') as g,
             0 as r
      from ev group by 1
      union all
      select source, 0, 0, count(*) from reg group by 1
    ) x
    group by source
  ),
  by_campaign as (
    select source, campaign, sum(v)::int as visitors, sum(g)::int as generators,
           sum(r)::int as registrations,
           (select coalesce(sum(amount_inr), 0)::int from spend_entries s
             where s.is_demo = p_demo and s.utm_campaign = x.campaign) as spend_inr
    from (
      select source, utm_campaign as campaign,
             count(distinct session_id) filter (where type = 'visit') as v,
             count(distinct session_id) filter (where type = 'generate') as g,
             0 as r
      from ev where utm_campaign is not null group by 1, 2
      union all
      select source, utm_campaign, 0, 0, count(*)
      from reg where utm_campaign is not null group by 1, 2
    ) x
    group by source, campaign
  ),
  by_variant as (
    select variant, sum(v)::int as visitors, sum(g)::int as generators, sum(r)::int as registrations
    from (
      select variant,
             count(distinct session_id) filter (where type = 'visit') as v,
             count(distinct session_id) filter (where type = 'generate') as g,
             0 as r
      from ev where variant is not null group by 1
      union all
      select variant, 0, 0, count(*) from reg where variant is not null group by 1
    ) x
    group by variant
  ),
  top_referrers as (
    select r.name, r.college, r.ref_code, c.referrals
    from reg r
    join (
      select referred_by, count(*)::int as referrals
      from reg where referred_by is not null group by 1
    ) c on c.referred_by = r.ref_code
    order by c.referrals desc, r.created_at
    limit 10
  ),
  colleges as (
    select min(college) as college, count(*)::int as registrations
    from reg group by lower(trim(college))
    order by 2 desc, 1 limit 10
  ),
  branches as (
    select branch, count(*)::int as registrations
    from reg group by 1 order by 2 desc, 1
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'visitors',               (select count(distinct session_id) from ev where type = 'visit'),
      'generators',             (select count(distinct session_id) from ev where type = 'generate'),
      'registrations',          (select count(*) from reg),
      'shares',                 (select count(*) from ev where type = 'share_click'),
      'sharers',                (select count(distinct session_id) from ev where type = 'share_click'),
      'card_views',             (select count(*) from ev where type = 'card_view'),
      'referral_registrations', (select count(*) from reg where referred_by is not null),
      'spend_inr',              (select coalesce(sum(amount_inr), 0) from spend_entries where is_demo = p_demo),
      'blueprints_ai',          (select count(*) from blueprints where is_demo = p_demo and generated_by = 'ai'),
      'blueprints_fallback',    (select count(*) from blueprints where is_demo = p_demo and generated_by = 'fallback'),
      'first_event_at',         (select min(created_at) from ev),
      'last_event_at',          (select max(created_at) from ev)
    ),
    'daily',         (select coalesce(jsonb_agg(to_jsonb(d) order by d.day), '[]'::jsonb) from daily d),
    'by_source',     (select coalesce(jsonb_agg(to_jsonb(s) order by s.registrations desc, s.visitors desc), '[]'::jsonb) from by_source s),
    'by_campaign',   (select coalesce(jsonb_agg(to_jsonb(c) order by c.registrations desc, c.visitors desc), '[]'::jsonb) from by_campaign c),
    'by_variant',    (select coalesce(jsonb_agg(to_jsonb(v) order by v.variant), '[]'::jsonb) from by_variant v),
    'top_referrers', (select coalesce(jsonb_agg(to_jsonb(t) order by t.referrals desc), '[]'::jsonb) from top_referrers t),
    'colleges',      (select coalesce(jsonb_agg(to_jsonb(c) order by c.registrations desc), '[]'::jsonb) from colleges c),
    'branches',      (select coalesce(jsonb_agg(to_jsonb(b) order by b.registrations desc), '[]'::jsonb) from branches b),
    'spend',         (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb)
                        from (select id, label, utm_campaign, amount_inr, created_at
                                from spend_entries where is_demo = p_demo) s)
  );
$$;

-- ---------------------------------------------------------------------------
-- leaderboard: public page, REAL data only, first names only
-- ---------------------------------------------------------------------------

create or replace function leaderboard()
returns jsonb
language sql
stable
as $$
  with reg as (
    select * from registrations where is_demo = false
  ),
  referrers as (
    select split_part(trim(r.name), ' ', 1) as first_name, r.college, c.referrals
    from reg r
    join (
      select referred_by, count(*)::int as referrals
      from reg where referred_by is not null group by 1
    ) c on c.referred_by = r.ref_code
    order by c.referrals desc, r.created_at
    limit 10
  ),
  colleges as (
    select min(college) as college, count(*)::int as registrations
    from reg group by lower(trim(college))
    order by 2 desc, 1 limit 10
  )
  select jsonb_build_object(
    'referrers', (select coalesce(jsonb_agg(to_jsonb(r) order by r.referrals desc), '[]'::jsonb) from referrers r),
    'colleges',  (select coalesce(jsonb_agg(to_jsonb(c) order by c.registrations desc), '[]'::jsonb) from colleges c)
  );
$$;

-- Only the server (service role) may call these functions.
do $$
begin
  revoke all on function dashboard_metrics(boolean) from public;
  revoke all on function leaderboard() from public;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function dashboard_metrics(boolean) from anon, authenticated;
    revoke all on function leaderboard() from anon, authenticated;
    grant execute on function dashboard_metrics(boolean) to service_role;
    grant execute on function leaderboard() to service_role;
  end if;
end $$;
