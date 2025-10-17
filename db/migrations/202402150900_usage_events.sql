-- Usage events stream for compliance-focused telemetry
CREATE TABLE IF NOT EXISTS usage_events (
  ts           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  org_id       BIGINT      NOT NULL,
  user_id      BIGINT      NOT NULL,
  feature      VARCHAR(64) NOT NULL,
  tool         VARCHAR(64) NOT NULL,
  count        INT         NOT NULL DEFAULT 1,
  latency_ms   INT,
  outcome      TEXT        NOT NULL CHECK (outcome IN ('ok', 'warn', 'error')),
  sampling_rate REAL       NOT NULL DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS ix_usage_rollup ON usage_events (org_id, feature, ts);
