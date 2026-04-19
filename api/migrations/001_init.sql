-- SnapScan API — initial schema.
-- Run this in the Supabase SQL editor, or via the migrate script.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Retailers / customers
create table if not exists customers (
  id               uuid primary key default uuid_generate_v4(),
  email            text not null unique,
  business_name    text,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  plan             text not null default 'starter' check (plan in ('starter','pro','enterprise')),
  status           text not null default 'trialing' check (status in ('trialing','active','past_due','canceled')),
  trial_ends_at    timestamptz default (now() + interval '14 days'),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- API keys. We store a SHA-256 hash of the raw key and never the key itself.
create table if not exists api_keys (
  id               uuid primary key default uuid_generate_v4(),
  customer_id      uuid not null references customers(id) on delete cascade,
  key_prefix       text not null,     -- first 8 chars for display: "ss_live_xxxxxxxx"
  key_hash         text not null unique,
  name             text,
  last_used_at     timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz default now()
);

create index if not exists api_keys_customer_idx on api_keys(customer_id);

-- Per-key usage for billing + quota enforcement. One row per day per key.
create table if not exists usage (
  id               bigserial primary key,
  customer_id      uuid not null references customers(id) on delete cascade,
  api_key_id       uuid references api_keys(id) on delete set null,
  day              date not null default current_date,
  count            integer not null default 0,
  unique (customer_id, api_key_id, day)
);

create index if not exists usage_customer_day_idx on usage(customer_id, day);

-- Product cache. Reduces OFF API calls and lets us serve products that OFF doesn't have.
create table if not exists upc_cache (
  upc              text primary key,
  product          jsonb not null,
  source           text not null default 'off' check (source in ('off','manual','community')),
  fetched_at       timestamptz default now(),
  expires_at       timestamptz default (now() + interval '30 days')
);

-- Optional: eligibility audit log for retailers that want to prove compliance.
create table if not exists eligibility_log (
  id               bigserial primary key,
  customer_id      uuid not null references customers(id) on delete cascade,
  upc              text not null,
  state            text not null,
  eligible         boolean not null,
  reasons          jsonb,
  created_at       timestamptz default now()
);

create index if not exists eligibility_log_customer_idx on eligibility_log(customer_id, created_at desc);

-- Plan limits (authoritative server-side).
create table if not exists plans (
  code             text primary key,
  name             text not null,
  monthly_calls    integer not null,
  price_usd        integer not null,
  features         jsonb not null default '[]'::jsonb
);

insert into plans (code, name, monthly_calls, price_usd, features) values
  ('starter',    'Starter',    10000,    29, '["Single state", "1 API key", "30-day cache", "Email support"]'::jsonb),
  ('pro',        'Pro',        100000,   99, '["All 22 states", "5 API keys", "Audit log", "Priority email support", "CSV export"]'::jsonb),
  ('enterprise', 'Enterprise', 1000000, 299, '["All 22 states", "Unlimited keys", "Audit log", "Webhook events", "99.9% SLA", "Dedicated Slack"]'::jsonb)
on conflict (code) do update set
  monthly_calls = excluded.monthly_calls,
  price_usd = excluded.price_usd,
  features = excluded.features;
