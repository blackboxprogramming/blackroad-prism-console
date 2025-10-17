variable "region"       { type = string }
variable "vpc_cidr"     { type = string }
variable "azs"          { type = list(string) }
variable "ecr_repositories" { type = list(string) }
variable "db_allowed_cidr_blocks" { type = list(string) default = [] }
variable "rds_instance_class" { type = string default = "db.t4g.micro" }
variable "tags" { type = map(string) default = { app = "blackroad" } }
variable "api_image_tag" { type = string default = "latest" }
