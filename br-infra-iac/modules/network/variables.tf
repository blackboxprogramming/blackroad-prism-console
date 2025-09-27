variable "name"     { type = string }
variable "vpc_cidr" { type = string }
variable "azs"      { type = list(string) } # e.g., ["us-west-2a","us-west-2b"]
variable "tags"     { type = map(string) default = {} }
