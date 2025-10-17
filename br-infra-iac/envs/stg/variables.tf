variable "region"       { type = string }
variable "vpc_cidr"     { type = string }
variable "azs"          { type = list(string) }
variable "ecr_repositories" { type = list(string) }
variable "db_allowed_cidr_blocks" { type = list(string) default = [] }
variable "rds_instance_class" { type = string default = "db.t4g.small" }
variable "rds_multi_az" { type = bool default = false }
variable "rds_backup_retention_days" { type = number default = 14 }
variable "tags" { type = map(string) default = { app = "blackroad" } }
