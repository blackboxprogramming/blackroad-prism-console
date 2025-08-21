select
  cast(locationid as integer) as zone_id,
  borough,
  zone,
  service_zone
-- <!-- FILE: /srv/blackroads/elt/dbt/models/core/dim_zone.sql -->
select
    cast(LocationID as integer) as zone_id,
    Zone as zone_name,
    Borough as borough,
    service_zone
from {{ ref('taxi_zone_lookup') }}
