resource "snowflake_database" "main" {
  name    = "BLACKROAD_${upper(var.env)}"
  comment = "Main database for ${var.env}"
}

output "database_name" {
  value = snowflake_database.main.name
}
