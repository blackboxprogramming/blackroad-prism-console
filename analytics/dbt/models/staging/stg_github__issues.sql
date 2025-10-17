with src as (
  select
    id::number        as issue_id,
    repo_full::string as repo_full,
    number::number    as issue_number,
    title::string     as title,
    state::string     as state,
    is_pull::boolean  as is_pull,
    try_parse_json(labels) as labels,
    author::string    as author,
    to_timestamp_ntz(created_at) as created_at,
    to_timestamp_ntz(closed_at)  as closed_at,
    to_timestamp_ntz(updated_at) as updated_at
  from BR_RAW.APP.RAW_GITHUB_ISSUES
  where is_pull = false
)
select * from src;
