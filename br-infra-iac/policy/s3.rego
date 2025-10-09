package tf.s3

bucket_resources[rc] {
  rc := input.resource_changes[_]
  rc.type == "aws_s3_bucket"
}

public_block_resources[rc] {
  rc := input.resource_changes[_]
  rc.type == "aws_s3_bucket_public_access_block"
}

deny[msg] {
  rc := bucket_resources[_]
  after := rc.change.after
  not has_encryption(after)
  msg := sprintf("%s must enable default encryption", [rc.address])
}

deny[msg] {
  rc := bucket_resources[_]
  after := rc.change.after
  acl := lower(after.acl)
  acl == "public-read" or acl == "public-read-write"
  msg := sprintf("%s uses a public ACL", [rc.address])
}

deny[msg] {
  rc := bucket_resources[_]
  after := rc.change.after
  after.force_destroy == true
  msg := sprintf("%s has force_destroy enabled; review for data leak", [rc.address])
}

deny[msg] {
  rc := bucket_resources[_]
  not blocks_public_access(rc.address)
  msg := sprintf("%s missing aws_s3_bucket_public_access_block", [rc.address])
}

has_encryption(after) {
  not is_null(after.server_side_encryption_configuration)
}

blocks_public_access(address) {
  rc := public_block_resources[_]
  rc.address == sprintf("%s_public_access_block", [address])
  settings := rc.change.after
  settings.block_public_acls == true
  settings.block_public_policy == true
  settings.ignore_public_acls == true
  settings.restrict_public_buckets == true
}

is_null(x) {
  x == null
}
