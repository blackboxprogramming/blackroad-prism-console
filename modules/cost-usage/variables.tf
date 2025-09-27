variable "name" {
  type = string
}

variable "s3_bucket_name" {
  type = string
}

variable "region" {
  type = string
}

variable "report_name" {
  type    = string
  default = "blackroad-cur"
}

variable "tags" {
  type    = map(string)
  default = {}
}
