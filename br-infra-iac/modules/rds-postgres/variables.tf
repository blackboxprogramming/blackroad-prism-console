variable "name"        { type = string }
variable "vpc_id"      { type = string }
variable "subnet_ids"  { type = list(string) }
variable "app_sg_ids"  { type = list(string) default = [] }
variable "db_allowed_cidr_blocks" { type = list(string) default = [] }
variable "engine_version"     { type = string  default = "16.3" }
variable "instance_class"     { type = string  default = "db.t4g.micro" }
variable "allocated_storage"  { type = number  default = 20 }
variable "multi_az"           { type = bool    default = false }
variable "skip_final_snapshot"{ type = bool    default = true }
variable "deletion_protection"{ type = bool    default = false }
variable "master_username"    { type = string  default = "master" }
variable "backup_retention_days" { type = number default = 7 }
variable "tags"               { type = map(string) default = {} }
