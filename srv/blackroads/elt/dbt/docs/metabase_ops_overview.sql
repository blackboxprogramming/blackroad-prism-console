-- Metabase dashboard: Ops Overview
-- Card 1 — Events (7/28/90 days)
select
  date_trunc('day', occurred_at) as day,
  count(*) as events
from BR_ANALYTICS.STG.STG_APP__EVENTS
where occurred_at >= dateadd(day, -90, current_timestamp())
group by 1
order by 1 asc;

-- Card 2 — DAU (last 30 days)
select
  date_trunc('day', occurred_at) as day,
  approx_count_distinct(user_id) as dau
from BR_ANALYTICS.STG.STG_APP__EVENTS
where occurred_at >= dateadd(day, -30, current_timestamp())
group by 1
order by 1 asc;

-- Card 3 — Events by name (last 7 days)
select
  upper(event_name) as event_name,
  count(*) as events
from BR_ANALYTICS.STG.STG_APP__EVENTS
where occurred_at >= dateadd(day, -7, current_timestamp())
group by 1
order by events desc
limit 20;

-- Card 4 — Purchases by day (trend)
select
  date_trunc('day', occurred_at) as day,
  count(*) as purchases
from BR_ANALYTICS.STG.STG_APP__EVENTS
where upper(event_name) = 'PURCHASE'
  and occurred_at >= dateadd(day, -60, current_timestamp())
group by 1
order by 1 asc;

-- Card 5 — Funnel snapshot (Signup → Purchase, last 14 days)
with base as (
  select user_id, min(occurred_at) as first_seen
  from BR_ANALYTICS.STG.STG_APP__EVENTS
  where occurred_at >= dateadd(day,-14,current_timestamp())
  group by 1
),
signup as (
  select distinct user_id from BR_ANALYTICS.STG.STG_APP__EVENTS
  where upper(event_name)='SIGNUP'
    and occurred_at >= dateadd(day,-14,current_timestamp())
),
purchase as (
  select distinct user_id from BR_ANALYTICS.STG.STG_APP__EVENTS
  where upper(event_name)='PURCHASE'
    and occurred_at >= dateadd(day,-14,current_timestamp())
)
select
  (select count(*) from signup)   as signups,
  (select count(*) from purchase) as purchases,
  (select 100.0 * count(*) / nullif((select count(*) from signup),0)
     from purchase)               as signup_to_purchase_pct;
