# Chaining

Compose multiple bots deterministically using KQL selectors.

Example plan YAML:

```
steps:
  - bot: "SRE-BOT"
    intent: "error_budget"
    input_selector: |
      MATCH (s:Service) WHERE s.name="CoreAPI" RETURN s.name
  - bot: "Change/Release-BOT"
    intent: "release_checklist"
    input_selector: |
      MATCH (a:Artifact)-[:PRODUCED_BY]->(b:Bot[name="SRE-BOT"]) RETURN a.path
```
