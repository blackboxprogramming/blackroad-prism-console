package repo

deny[msg] {
  not input.default_branch_protected
  msg := "Default branch must be protected"
}

deny[msg] {
  not input.allow_squash_merge
  msg := "Squash merge must be enabled (clean history)"
}

deny[msg] {
  input.allow_merge_commit
  msg := "Merge commits are disabled to keep history linear"
}

deny[msg] {
  not input.delete_branch_on_merge
  msg := "Branches must delete on merge"
}
