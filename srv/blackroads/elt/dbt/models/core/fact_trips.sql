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
-- <!-- FILE: /srv/blackroads/elt/dbt/models/core/fact_trips.sql -->
with trips as (
    select * from {{ ref('stg_trips') }}
)
select
    date(pickup_datetime) as trip_date,
    pu_location_id as zone_id,
    count(*) as trip_count,
    sum(total_amount) as total_amount,
    avg(fare_amount) as avg_fare
from trips
group by 1,2
