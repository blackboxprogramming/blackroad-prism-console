-- GitHub connector raw landing + sync watermark
create table if not exists raw_github_issues (
  id           bigint primary key,
  repo_full    text not null,
  number       int  not null,
  title        text not null,
  state        text not null,
  is_pull      boolean not null default false,
  labels       jsonb not null default '[]',
  author       text,
  created_at   timestamptz not null,
  closed_at    timestamptz,
  updated_at   timestamptz not null,
  payload      jsonb not null,
  source_id    uuid not null
);

create index if not exists idx_rgi_repo on raw_github_issues(repo_full);
create index if not exists idx_rgi_state on raw_github_issues(state);

create table if not exists github_repo_sync (
  source_id uuid not null,
  repo_full text not null,
  last_updated_at timestamptz not null default '1970-01-01',
  primary key (source_id, repo_full)
);
