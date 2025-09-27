terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# S3 bucket for logs
locals {
  merged_tags = merge(var.tags, { region = var.region })
}

resource "aws_s3_bucket" "logs" {
  bucket        = var.s3_bucket_name
  force_destroy = false
  tags          = local.merged_tags
}

resource "aws_s3_bucket_versioning" "v" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "enc" {
  bucket = aws_s3_bucket.logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "pab" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "lc" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire"
    status = "Enabled"

    expiration {
      days = var.retention_days
    }

    filter {}
  }
}

# Firehose role + policy
data "aws_iam_policy_document" "assume_firehose" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["firehose.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "firehose" {
  name               = "${var.name}-waf-firehose"
  assume_role_policy = data.aws_iam_policy_document.assume_firehose.json
  tags               = local.merged_tags
}

data "aws_iam_policy_document" "firehose_s3" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:AbortMultipartUpload",
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "s3:ListBucketMultipartUploads"
    ]
    resources = [aws_s3_bucket.logs.arn, "${aws_s3_bucket.logs.arn}/*"]
  }

  statement {
    actions = [
      "logs:PutLogEvents",
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
      "logs:DescribeLogStreams"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "firehose_s3" {
  name   = "${var.name}-waf-firehose-s3"
  policy = data.aws_iam_policy_document.firehose_s3.json
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.firehose.name
  policy_arn = aws_iam_policy.firehose_s3.arn
}

# Firehose delivery stream (direct put)
resource "aws_kinesis_firehose_delivery_stream" "waf" {
  name        = "${var.name}-waf-logs"
  destination = "s3"

  s3_configuration {
    role_arn           = aws_iam_role.firehose.arn
    bucket_arn         = aws_s3_bucket.logs.arn
    prefix             = "${var.s3_prefix}!{timestamp:yyyy/MM/dd}/"
    buffering_size     = 5
    buffering_interval = 60
    compression_format = "GZIP"
  }

  tags = local.merged_tags
}

# Wire WAF logging to Firehose
resource "aws_wafv2_web_acl_logging_configuration" "this" {
  resource_arn            = var.web_acl_arn
  log_destination_configs = [aws_kinesis_firehose_delivery_stream.waf.arn]

  redacted_fields {
    method {}
    uri_path {}
  }
}

resource "aws_glue_catalog_database" "waf_db" {
  name = replace("${var.name}-waf", "-", "_")
}

resource "aws_glue_catalog_table" "waf_table" {
  name          = "logs"
  database_name = aws_glue_catalog_database.waf_db.name
  table_type    = "EXTERNAL_TABLE"
  parameters    = {
    classification = "json"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.logs.bucket}/${var.s3_prefix}"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    serde_info {
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"
    }

    columns = [
      {
        name = "timestamp"
        type = "string"
      },
      {
        name = "formatversion"
        type = "int"
      },
      {
        name = "webaclid"
        type = "string"
      },
      {
        name = "terminatingruleid"
        type = "string"
      },
      {
        name = "action"
        type = "string"
      },
      {
        name = "httpsourcename"
        type = "string"
      },
      {
        name = "httpsourceid"
        type = "string"
      },
      {
        name = "httprequest"
        type = "string"
      }
    ]
  }
}

resource "aws_athena_named_query" "top_actions" {
  name     = "waf_top_actions"
  database = aws_glue_catalog_database.waf_db.name
  query    = <<SQL
SELECT action, count(*) AS n
FROM ${aws_glue_catalog_database.waf_db.name}.logs
WHERE from_iso8601_timestamp(json_extract_scalar($path, '$.timestamp')) > now() - interval '1' day
GROUP BY action
ORDER BY n DESC
LIMIT 20;
SQL
}

output "logs_bucket" {
  value = aws_s3_bucket.logs.bucket
}

output "logs_prefix" {
  value = var.s3_prefix
}

output "firehose_name" {
  value = aws_kinesis_firehose_delivery_stream.waf.name
}

output "s3_log_path_hint" {
  value = "s3://${aws_s3_bucket.logs.bucket}/${var.s3_prefix}"
}
