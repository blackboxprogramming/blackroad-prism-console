with base as (
  select
    id::string                as event_id,
    occurred_at::timestamp_ntz as occurred_at,
    user_id::string           as user_id,
    event_name::string        as event_name,
    try_parse_json(payload)   as payload
  from {{ source('app','events') }}
),
clean as (
  select
    event_id,
    occurred_at,
    user_id,
    upper(trim(event_name)) as event_name,
    payload
  from base
  where event_id is not null
    and occurred_at is not null
)
select * from clean;
