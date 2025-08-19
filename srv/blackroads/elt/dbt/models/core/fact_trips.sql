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
