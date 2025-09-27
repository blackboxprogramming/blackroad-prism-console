-- state
create table if not exists public.sync_state (
  source text primary key,
  last_run_at timestamp with time zone not null default now()
);

-- target table
create schema if not exists ops;

create table if not exists ops.projects (
  project_id text primary key,
  project_name text,
  owner_email text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

create index if not exists idx_projects_owner on ops.projects(owner_email);
create index if not exists idx_projects_status on ops.projects(status);
