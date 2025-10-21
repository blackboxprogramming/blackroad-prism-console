# KQL-lite

Simple query language over the knowledge graph.

Example:

```
MATCH (a:Artifact)-[:PRODUCED_BY]->(b:Bot[name="Treasury-BOT"])
WHERE a.type="response"
RETURN a.path, b.name
LIMIT 20
```
