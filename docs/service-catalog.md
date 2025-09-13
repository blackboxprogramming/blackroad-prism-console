# Service Catalog

Service definitions live in `configs/services/*.yaml` with fields:
`id`, `name`, `tier`, `owners`, `sli`, and `dependencies`.
Load them via `svc:load` and query blast radius with `svc:deps --service <id>`.
