with s as (
  select * from {{ ref('stg_linear__issues') }}
)
select
  date_trunc('day', created_at) as day,
  team_key,
  count(*) as issues_created,
  count_if(completed_at is not null and date_trunc('day', completed_at) = date_trunc('day', created_at)) as completed_same_day
from s
group by 1, 2
order by 1 desc;
