# Workflow Specification

RoadGlitch workflows describe a directed acyclic graph of nodes. Each node references a connector, optional conditional execution, and input parameters that support template expressions using `${...}` syntax.

```yaml
name: notify_slow_api
version: 1.0.0
trigger:
  type: manual
inputSchema:
  required: ["apiUrl"]
  properties:
    apiUrl:
      type: string
graph:
  nodes:
    ping_api:
      uses: connector.http.get
      with:
        url: "${input['apiUrl']}"
    notify:
      uses: connector.slack.postMessage
      with:
        channel: "#ops"
        text: "API slow"
  edges:
    - from: ping_api
      to: notify
policies:
  retries:
    default:
      max: 2
      backoffMs: 200
```

