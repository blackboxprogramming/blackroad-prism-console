# DNS Updates

- status.blackroad.io → CNAME to status provider
- api.blackroad.io → CNAME to API gateway/load balancer
- id.blackroadinc.us → CNAME to Okta custom domain (after verification)
- Lower TTL to 300s during cutover; bump to 3600s when stable.
