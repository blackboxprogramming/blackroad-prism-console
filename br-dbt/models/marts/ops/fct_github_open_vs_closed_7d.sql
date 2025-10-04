with s as ( select * from {{ ref('stg_github__issues') }} ),
opened as (
  select date_trunc('day', created_at) as day, count(*) as opened
  from s where is_pull = false and created_at >= dateadd(day,-7,current_timestamp())
  group by 1
),
closed as (
  select date_trunc('day', closed_at) as day, count(*) as closed
  from s where is_pull = false and closed_at >= dateadd(day,-7,current_timestamp())
  group by 1
)
select coalesce(o.day,c.day) as day, o.opened, c.closed
from opened o
full outer join closed c on o.day = c.day
order by 1;
