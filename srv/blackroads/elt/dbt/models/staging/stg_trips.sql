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
-- <!-- FILE: /srv/blackroads/elt/dbt/models/staging/stg_trips.sql -->
select
    cast("VendorID" as integer) as vendorid,
    cast("tpep_pickup_datetime" as timestamp) as pickup_datetime,
    cast("tpep_dropoff_datetime" as timestamp) as dropoff_datetime,
    cast("passenger_count" as integer) as passenger_count,
    cast("trip_distance" as double precision) as trip_distance,
    cast("PULocationID" as integer) as pu_location_id,
    cast("DOLocationID" as integer) as do_location_id,
    cast("fare_amount" as numeric(10,2)) as fare_amount,
    cast("tip_amount" as numeric(10,2)) as tip_amount,
    cast("total_amount" as numeric(10,2)) as total_amount
from raw.trips_raw
