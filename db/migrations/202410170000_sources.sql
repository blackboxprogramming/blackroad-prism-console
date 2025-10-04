-- Source connectors core tables

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  kind text not null,
  status text not null default 'disconnected',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sources_org_id_created_at on sources (org_id, created_at desc);

create table if not exists source_secrets (
  source_id uuid primary key references sources(id) on delete cascade,
  secret_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists source_syncs (
  id bigserial primary key,
  source_id uuid not null references sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  items_ingested int default 0,
  error text
);

create index if not exists idx_source_syncs_source_id_started_at on source_syncs (source_id, started_at desc);

create table if not exists raw_source_x_events (
  id text primary key,
  source_id uuid not null references sources(id) on delete cascade,
  occurred_at timestamptz not null,
  kind text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_raw_source_x_events_source_id_occurred_at on raw_source_x_events (source_id, occurred_at desc);
