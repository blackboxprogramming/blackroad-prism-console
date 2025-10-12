# JSON Schema Design for Agent/Tool Definitions

Designing JSON Schemas for agent tools often requires a balance between strict validation and future extensibility. This note outlines how to choose between `additionalProperties` and `unevaluatedProperties` so you can keep schemas locked down without blocking later extensions.

## Core Idea

- `additionalProperties: false` blocks any fields not explicitly listed in the current schema. It is safe but prevents downstream extensions from introducing new fields through composition (`allOf`, `anyOf`, etc.).
- `unevaluatedProperties: false` blocks only properties that have not been validated by *any* subschema in a composition. Extensions can add fields in their own subschema, while still preventing unknown properties elsewhere.

## When to Use Each Constraint

| Situation | Recommendation | Rationale |
| --- | --- | --- |
| Standalone object with no composition | Use `additionalProperties: false` | Keeps the object tightly scoped when you are confident no one will extend it. |
| Schema that will be composed with `allOf`/`anyOf` | Use `unevaluatedProperties: false` | Lets extensions add new validated properties without editing the base schema. |
| Nested objects that may be extended later | Prefer `unevaluatedProperties: false` | Maintains strictness while allowing future subschemas to contribute new fields. |
| Leaf objects that should never change | Use `additionalProperties: false` | Provides the strictest boundary for terminal structures. |

## Minimal Examples

### Anti-pattern: Blocks Future Extensions

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" },
    "limit": { "type": "integer", "minimum": 1 }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

Using `additionalProperties: false` here prevents other schemas from adding new fields via composition without editing the base definition.

### Composable Base Schema

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" },
    "limit": { "type": "integer", "minimum": 1 }
  },
  "required": ["query"],
  "unevaluatedProperties": false
}
```

This version still blocks unknown properties, but any subschema in an `allOf` can safely add validated fields.

### Extension That Adds Filters

```json
{
  "allOf": [
    { "$ref": "./base.json" },
    {
      "type": "object",
      "properties": {
        "filters": {
          "type": "object",
          "properties": {
            "since": { "type": "string", "format": "date-time" }
          },
          "unevaluatedProperties": false
        }
      }
    }
  ]
}
```

- The extension's `filters` property is allowed because it is validated by the second subschema.
- Any property not covered by either subschema is still blocked by the base schema's `unevaluatedProperties: false`.

## Quick Checklist

- [ ] Composing with `allOf` or `anyOf`? Prefer `unevaluatedProperties: false` at the top level.
- [ ] Extensible nested objects? Use `unevaluatedProperties: false` so future subschemas can add fields.
- [ ] Final leaf objects? Lock them down with `additionalProperties: false`.
- [ ] Adding new subschemas? Validate new fields within the extension so the base `unevaluatedProperties: false` will permit them.

Adopting this pattern keeps schemas strict today while preserving a safe path for incremental tool growth.
