# Graph Binding

Graph nodes reference global identifiers from the MDM registry. Each node
stores its canonical ID under `props.global_id` and should not duplicate
source-specific identifiers. The MDM registry is the source of truth for
account, service, repository and environment IDs.
