package reproduction

default allow = false

allow {
  input.parents[_].consent == true
  input.license_ok == true
  input.child.values.tags[_] == "love-first"
  input.safety_caps.network_access == false
}
