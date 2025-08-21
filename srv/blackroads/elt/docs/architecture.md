# Architecture

```
CSV -> raw.trips_raw -> dbt core.* -> Great Expectations -> Metabase
```

The flow ingests NYC Taxi CSV files into Postgres, transforms them with dbt into
`core` schemas, validates with Great Expectations, and exposes results in Metabase.
Future improvements include productionizing orchestration, backups, and adding OpenLineage.
<!-- FILE: /srv/blackroads/elt/docs/architecture.md -->
# Architecture

```
CSV -> raw.trips_raw -> dbt core.* -> GE -> Metabase
```

## Notes
- For production, enable regular backups of Postgres volumes.
- Consider adding OpenLineage for lineage tracking and alerting.
