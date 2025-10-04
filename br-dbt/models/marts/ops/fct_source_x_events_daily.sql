select
  date_trunc('day', occurred_at) as day,
  event_kind,
  count(*) as events
from {{ ref('stg_source_x__events') }}
group by 1, 2
order by 1 desc;
