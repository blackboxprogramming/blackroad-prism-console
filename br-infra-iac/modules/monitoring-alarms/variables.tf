variable "name" {
  type = string
}

variable "alb_arn_suffix" {
  type = string
}

variable "web_acl_arn" {
  type = string
}

variable "region" {
  type = string
}

variable "sns_topic_arn" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
