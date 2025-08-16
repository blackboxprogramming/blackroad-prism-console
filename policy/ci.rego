package ci

deny[msg] {
  input.kind == "workflow"
  not input.permissions.contents
  msg := "workflows must declare explicit permissions"
}

deny[msg] {
  input.kind == "workflow"
  some k
  input.permissions[k] == "write"
  not allowed_write[k]
  msg := sprintf("write permission %v not in allow-list", [k])
}

allowed_write := {"contents","pull-requests","pages","id-token","security-events"}

