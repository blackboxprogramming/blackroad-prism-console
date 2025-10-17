with s as (
  select * from {{ ref('stg_github__issues') }}
)
select
  repo_full,
  count(*) as open_bugs
from s
where state = 'open'
  and array_contains(
    array_construct('bug'),
    (
      select array_agg(value:name::string)
      from lateral flatten(input => s.labels)
    )
  )
group by 1;
