with e as (
  select * from {{ ref('stg_app__events') }}
)
select
  date_trunc('day', occurred_at) as day,
  count(*)                        as events_total,
  count_if(event_name = 'LOGIN')  as events_login,
  count_if(event_name = 'SIGNUP') as events_signup,
  count_if(event_name = 'PURCHASE') as events_purchase,
  approx_count_distinct(user_id)  as dau
from e
group by 1
order by 1 desc;
