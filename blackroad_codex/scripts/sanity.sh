#!/usr/bin/env bash
set -euo pipefail

: "${OKTA_ORG:?Set OKTA_ORG}"
: "${ASANA_WORKSPACE:?Set ASANA_WORKSPACE}"
: "${SALESFORCE_INSTANCE:?Set SALESFORCE_INSTANCE}"
: "${STRIPE_ACCT:?Set STRIPE_ACCT}"
: "${SNOWFLAKE_ACCT:?Set SNOWFLAKE_ACCT}"
: "${DATADOG_API:?Set DATADOG_API}"
: "${DATADOG_APP:?Set DATADOG_APP}"
: "${SPLUNK_HEC_STG:?Set SPLUNK_HEC_STG}"
: "${SPLUNK_HEC_PROD:?Set SPLUNK_HEC_PROD}"
: "${NOTION_DB:?Set NOTION_DB}"

echo "All required environment variables are set."
