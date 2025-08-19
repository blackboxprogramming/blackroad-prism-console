<!-- FILE: /srv/blackroads/elt/docs/architecture.md -->
# Architecture

```
CSV -> raw.trips_raw -> dbt core.* -> GE -> Metabase
```

## Notes
- For production, enable regular backups of Postgres volumes.
- Consider adding OpenLineage for lineage tracking and alerting.
