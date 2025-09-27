variable "name" {
  type = string
}

variable "alb_arn" {
  type = string
}

variable "scope" {
  type    = string
  default = "REGIONAL"
}

variable "rate_limit" {
  type    = number
  default = 1000
}

variable "ip_allowlist_cidrs" {
  type    = list(string)
  default = []
}

variable "ip_blocklist_cidrs" {
  type    = list(string)
  default = []
}

variable "enable_common_rules" {
  type    = bool
  default = true
}

variable "enable_ip_reputation_rules" {
  type    = bool
  default = true
}

variable "enable_known_bad_inputs" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
