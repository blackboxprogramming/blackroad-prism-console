terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

resource "aws_s3_bucket" "cur" {
  bucket        = var.s3_bucket_name
  force_destroy = true
  tags          = var.tags
}

resource "aws_s3_bucket_encryption" "enc" {
  bucket = aws_s3_bucket.cur.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "pab" {
  bucket                  = aws_s3_bucket.cur.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cur_report_definition" "this" {
  report_name              = var.report_name
  time_unit                = "HOURLY"
  format                   = "Parquet"
  compression              = "Parquet"
  additional_schema_elements = ["RESOURCES"]
  s3_bucket                = aws_s3_bucket.cur.bucket
  s3_prefix                = "cur"
  s3_region                = var.region
  refresh_closed_reports   = true
  report_versioning        = "CREATE_NEW_REPORT"
}

resource "aws_glue_catalog_database" "cur" {
  name = "${var.name}_cur"
}

resource "aws_glue_catalog_table" "cur" {
  name          = "aws_cur"
  database_name = aws_glue_catalog_database.cur.name
  table_type    = "EXTERNAL_TABLE"
  parameters = {
    classification = "parquet"
  }

  storage_descriptor {
    location     = "s3://${aws_s3_bucket.cur.bucket}/cur/"
    input_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    serde_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns = [
      {
        name = "line_item_usage_start_date"
        type = "string"
      },
      {
        name = "line_item_usage_end_date"
        type = "string"
      },
      {
        name = "line_item_usage_account_id"
        type = "string"
      },
      {
        name = "product_product_name"
        type = "string"
      },
      {
        name = "line_item_unblended_cost"
        type = "double"
      },
      {
        name = "line_item_usage_amount"
        type = "double"
      },
      {
        name = "line_item_resource_id"
        type = "string"
      }
    ]
  }
}

output "cur_bucket" {
  value = aws_s3_bucket.cur.bucket
}

output "athena_db" {
  value = aws_glue_catalog_database.cur.name
}

output "athena_table" {
  value = aws_glue_catalog_table.cur.name
}
