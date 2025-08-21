# Architecture

```
CSV -> raw.trips_raw -> dbt core.* -> Great Expectations -> Metabase
```

The flow ingests NYC Taxi CSV files into Postgres, transforms them with dbt into
`core` schemas, validates with Great Expectations, and exposes results in Metabase.
Future improvements include productionizing orchestration, backups, and adding OpenLineage.
