-- watermark (shared with other ingestors if you like)
create table if not exists public.sync_state (
  source text primary key,
  last_run_at timestamp with time zone not null default '1970-01-01'
);
