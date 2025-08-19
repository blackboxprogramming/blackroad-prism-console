select
  pickup_date,
  zone,
  trip_count,
  avg_fare
from {{ ref('fact_trips') }}
