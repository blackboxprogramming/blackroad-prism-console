output "group_ids" {
  value = { eng = okta_group.eng.id, revops = okta_group.revops.id }
}
