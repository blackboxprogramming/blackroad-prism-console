select
  cast(locationid as integer) as zone_id,
  borough,
  zone,
  service_zone
from {{ ref('taxi_zone_lookup') }}
