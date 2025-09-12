resource "asana_project" "platform" {
  name      = "Platform ${var.env}"
  workspace = var.workspace
}

output "project_ids" {
  value = [asana_project.platform.id]
}
