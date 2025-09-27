variable "name" {
  type = string
}

variable "alb_arn_suffix" {
  type = string
  # Example: app/my-alb/1234567890abcdef
}

variable "web_acl_arn" {
  type = string
}

variable "region" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
