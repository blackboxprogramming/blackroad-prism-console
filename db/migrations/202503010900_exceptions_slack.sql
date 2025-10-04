-- Add Slack threading metadata to exceptions for reminder replies.
ALTER TABLE exceptions
  ADD COLUMN IF NOT EXISTS slack_channel TEXT;

ALTER TABLE exceptions
  ADD COLUMN IF NOT EXISTS slack_ts TEXT;
