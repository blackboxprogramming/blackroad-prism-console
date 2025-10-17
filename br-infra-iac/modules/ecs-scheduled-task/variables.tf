variable "name"               { type = string }
variable "cluster_arn"        { type = string }
variable "subnet_ids"         { type = list(string) }
variable "security_group_ids" { type = list(string) }
variable "image"              { type = string }
variable "cpu"                { type = number default = 256 }
variable "memory"             { type = number default = 512 }
variable "schedule_expression"{ type = string }
variable "region"             { type = string }
variable "env"                { type = map(string) default = {} }
variable "secrets"            { type = map(string) default = {} }
variable "tags"               { type = map(string) default = {} }
