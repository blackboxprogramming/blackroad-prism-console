variable "region"            { type = string }
variable "state_bucket_name" { type = string }
variable "lock_table_name"   { type = string }
variable "github_org"        { type = string }
variable "github_repo"       { type = string }
variable "github_role_name"  { type = string  default = "github-terraform" }
variable "tags" { type = map(string) default = { app = "blackroad", env = "global" } }
