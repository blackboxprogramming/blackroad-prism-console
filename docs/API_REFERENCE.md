# API Reference

_Generated 2025-10-25T03:13:37.058780+00:00Z_

## `/auth/refresh`
### POST
- **Summary:** Refresh Tokens
- **Request Body:** application/json
- **Responses:**
  - `200` Successful Response
  - `422` Validation Error

## `/config/rate-limit`
### GET
- **Summary:** Rate Limit Config
- **Responses:**
  - `200` Successful Response

### PUT
- **Summary:** Update Rate Limit
- **Request Body:** application/json
- **Responses:**
  - `200` Successful Response
  - `422` Validation Error

## `/controls/cache-flush`
### POST
- **Summary:** Control Cache Flush
- **Request Body:** application/json
- **Responses:**
  - `200` Successful Response
  - `422` Validation Error

## `/controls/restart`
### POST
- **Summary:** Control Restart
- **Request Body:** application/json
- **Responses:**
  - `200` Successful Response
  - `422` Validation Error

## `/health`
### GET
- **Summary:** Health
- **Responses:**
  - `200` Successful Response

## `/health/live`
### GET
- **Summary:** Live
- **Responses:**
  - `200` Successful Response

## `/health/ready`
### GET
- **Summary:** Ready
- **Responses:**
  - `200` Successful Response

## `/maintenance/activate`
### POST
- **Summary:** Maintenance Activate
- **Request Body:** application/json
- **Responses:**
  - `200` Successful Response
  - `422` Validation Error

## `/maintenance/deactivate`
### POST
- **Summary:** Maintenance Deactivate
- **Request Body:** application/json
- **Responses:**
  - `200` Successful Response
  - `422` Validation Error

## `/maintenance/status`
### GET
- **Summary:** Maintenance Status
- **Responses:**
  - `200` Successful Response

## `/metrics`
### GET
- **Summary:** Metrics
- **Responses:**
  - `200` Successful Response

## `/system/status`
### GET
- **Summary:** System Status
- **Responses:**
  - `200` Successful Response
