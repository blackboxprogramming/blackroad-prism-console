package reproduction

default allow = false

allow {
  input.license_ok == true
  not input.requested_capabilities[_] == "network_access"
}
