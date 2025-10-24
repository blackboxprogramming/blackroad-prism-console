# BlackRoad Python SDK

Official Python SDK for the BlackRoad Public API. Generated from `/docs/api/public/openapi.yaml`.

## Usage

```python
from blackroad import BlackRoadClient

client = BlackRoadClient(base_url="https://sandbox.api.blackroad.io", token="token")
release = client.deploys.create({
    "serviceId": "svc-demo",
    "environment": "staging",
    "gitRef": "1a2b3c4"
})
print(release["releaseId"])
```
