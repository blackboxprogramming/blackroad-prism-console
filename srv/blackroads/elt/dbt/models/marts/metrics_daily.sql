-- <!-- FILE: /srv/blackroads/elt/dbt/models/marts/metrics_daily.sql -->
select
    ft.trip_date,
    dz.zone_name,
    ft.trip_count,
    ft.avg_fare
from {{ ref('fact_trips') }} ft
join {{ ref('dim_zone') }} dz on ft.zone_id = dz.zone_id
