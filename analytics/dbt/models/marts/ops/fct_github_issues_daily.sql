with s as (
  select * from {{ ref('stg_github__issues') }}
)
select
  date_trunc('day', created_at) as day,
  repo_full,
  count(*) as issues_opened,
  count_if(state = 'closed') as issues_closed_same_day
from s
group by 1, 2
order by 1 desc;
