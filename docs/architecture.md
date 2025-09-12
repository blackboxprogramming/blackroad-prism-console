# Architecture

```
[Client]
   |
   v
[Express API] --> [Postgres]
   |
   v
[S3 Bucket for assets]
```

The client communicates with a Node/Express API which persists data in Postgres and stores static assets in S3.
Docker and docker-compose orchestrate local services while Terraform provisions cloud resources.

