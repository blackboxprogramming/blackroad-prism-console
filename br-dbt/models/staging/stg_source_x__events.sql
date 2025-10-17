with src as (
  select
    id::string as event_id,
    source_id::string,
    occurred_at::timestamp_ntz,
    kind::string as event_kind,
    payload
  from BR_RAW.APP.RAW_SOURCE_X_EVENTS
)
select * from src;
