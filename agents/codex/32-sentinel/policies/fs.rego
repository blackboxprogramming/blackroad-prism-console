package sentinel.fs

# sentinel-allow: /var/lib/sentinel/
# sentinel-allow: /tmp/sentinel-
# sentinel-deny: /etc/shadow
# sentinel-deny: /root/

default allow = false

allow {
  startswith(input.path, "/var/lib/sentinel/")
  input.operation == "read"
}

allow {
  startswith(input.path, "/tmp/sentinel-")
  input.operation == "write"
}

hint["Write into the staged Sentinel directories or request a maintenance window."]
