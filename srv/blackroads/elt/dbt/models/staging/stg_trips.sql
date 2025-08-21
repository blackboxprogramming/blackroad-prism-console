with source as (
    select * from {{ source('raw', 'trips_raw') }}
)

select
    cast(tpep_pickup_datetime as timestamp) as pickup_datetime,
    cast(tpep_dropoff_datetime as timestamp) as dropoff_datetime,
    cast(tpep_pickup_datetime as date) as pickup_date,
    passenger_count,
    trip_distance,
    pulocationid,
    dolocationid,
    fare_amount,
    total_amount
from source
