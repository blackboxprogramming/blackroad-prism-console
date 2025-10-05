resource "aws_synthetics_canary" "ui_health" {
  name                 = "br-ui-health"
  artifact_s3_location = "s3://br-synthetics-artifacts/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  handler              = "apiCanaryBlueprint.handler"
  runtime_version      = "syn-nodejs-puppeteer-3.8"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds = 60
    environment_variables = {
      TARGET_URL = "https://app.blackroad.io/healthz/ui"
    }
  }

  s3_bucket = "br-synthetics-artifacts"
  zip_file  = filebase64("${path.module}/canary.zip")
}
