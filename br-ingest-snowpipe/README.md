# br-ingest-snowpipe

Postgres → S3 → Snowflake extraction+load worker with optional Snowpipe auto-ingest.

## What it does

- Reads new or changed rows from Postgres using a configurable query and watermark.
- Streams the results to CSV, compresses to gzip, and uploads to S3 using a time-partitioned key.
- Executes a Snowflake `COPY INTO` command to load the staged files into `BR_RAW.APP.EVENTS`.
- Advances the watermark once the load completes so the worker can run on cron or on-demand.

## Quickstart

1. Copy `.env.example` to `.env` and update the Postgres, S3, and Snowflake credentials.
2. Install dependencies and build the worker:

   ```bash
   npm ci
   npm run build
   ```

3. Run the worker:

   ```bash
   node dist/index.js
   ```

4. (Optional) Apply the schema for storing watermarks:

   ```bash
   npm run migrate
   ```

## Snowflake setup (Path A)

Run the following SQL in Snowflake to provision the target table, file format, and external stage:

```sql
create or replace table BR_RAW.APP.EVENTS (
  id           string,
  occurred_at  timestamp_ntz,
  user_id      string,
  event_name   string,
  payload      variant
);

create or replace file format BR_CSV_GZ
  type = csv
  field_delimiter = ','
  field_optionally_enclosed_by = '"'
  skip_header = 1
  compression = gzip
  null_if = ('', 'NULL');

create or replace storage integration BR_S3_INT
  type = external_stage
  storage_provider = s3
  enabled = true
  storage_aws_role_arn = 'arn:aws:iam::<YOUR_AWS_ACCOUNT>:role/<ROLE_FOR_SNOWFLAKE>'
  storage_allowed_locations = ('s3://br-data-landing/');

create or replace stage BR_LANDING_STAGE
  storage_integration = BR_S3_INT
  url = 's3://br-data-landing/'
  file_format = BR_CSV_GZ;
```

## Snowpipe auto-ingest (Path B)

To let Snowpipe ingest automatically after the worker uploads to S3, create a pipe and wire S3 notifications:

```sql
create or replace pipe BR_APP_EVENTS_PIPE
  auto_ingest = true
  as copy into BR_RAW.APP.EVENTS
     from @BR_LANDING_STAGE/dev/app/events
     pattern = '.*\\.csv\\.gz'
     file_format = (format_name=BR_CSV_GZ)
     on_error = 'ABORT_STATEMENT';
```

1. Run `desc pipe BR_APP_EVENTS_PIPE` in Snowflake to obtain the notification channel ARN.
2. Configure an S3 Event Notification for `s3:ObjectCreated:*` with prefix `dev/app/events/` and suffix `.csv.gz`.
3. Point the notification at the Snowflake-provided SNS/SQS destination and allow the bucket to publish to it.
4. Update IAM as needed so Snowflake can read from `br-data-landing` using the storage integration role.
5. Remove the manual `COPY INTO` call from the worker if Snowpipe will handle ingestion.

## AWS IAM snippets

Trust policy for the Snowflake storage integration role:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::<SNOWFLAKE_AWS_ACCOUNT_ID>:root" },
    "Action": "sts:AssumeRole",
    "Condition": { "StringEquals": { "sts:ExternalId": "<EXTERNAL_ID_FROM_SNOWFLAKE_INT>" } }
  }]
}
```

S3 access policy attached to the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject","s3:ListBucket","s3:GetBucketLocation"],
    "Resource": [
      "arn:aws:s3:::br-data-landing",
      "arn:aws:s3:::br-data-landing/*"
    ]
  }]
}
```

## Operational notes

- The worker uses cursors and configurable batch sizes to stream large result sets efficiently.
- Output keys follow `s3://<landing-bucket>/<env>/app/events/YYYY/MM/DD/HHmm-<commit>.csv.gz`.
- Watermark state is stored in `public.sync_state` but can be shared across ingestors.
- Run the job nightly or on-demand after upstream pipelines.

## Optional follow-up tasks

| Task | Description | Assignee | Section | Due |
| --- | --- | --- | --- | --- |
| Create Snowflake stage & format | Create `BR_CSV_GZ` and `BR_LANDING_STAGE` with storage integration. | amundsonalexa@gmail.com | Today | 2025-10-12 |
| Bootstrap IAM role for Snowflake | Create AWS role trusted by Snowflake; attach S3 read policy. | amundsonalexa@gmail.com | Today | 2025-10-12 |
| Seed EVENTS copy | Run worker once; verify rows in `BR_RAW.APP.EVENTS`. | amundsonalexa@gmail.com | This Week | 2025-10-13 |
| (Option) Enable Snowpipe | Create `BR_APP_EVENTS_PIPE`; wire S3 notifications; disable manual COPY. | amundsonalexa@gmail.com | This Week | 2025-10-14 |
| Add dbt sources & tests | Point dbt source to `BR_RAW.APP.EVENTS`; add freshness + tests. | amundsonalexa@gmail.com | This Week | 2025-10-14 |

## Slack drop draft

```
Postgres→Snowflake EL is live:
- Worker streams CSV.gz to S3 then COPY INTO BR_RAW.APP.EVENTS
- Optional Snowpipe auto-ingest wiring included
- Watermark-controlled; idempotent upserts on the Snowflake side

Next: wire the first mart + dashboard tile “Events This Week”.
```

