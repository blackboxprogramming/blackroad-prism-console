with trips as (
  select * from {{ ref('stg_trips') }}
),
zones as (
  select zone_id, zone from {{ ref('dim_zone') }}
)
select
  t.pickup_date,
  z.zone,
  count(*) as trip_count,
  sum(t.total_amount) as total_amount,
  avg(t.fare_amount) as avg_fare
from trips t
left join zones z on t.pulocationid = z.zone_id
group by 1,2
