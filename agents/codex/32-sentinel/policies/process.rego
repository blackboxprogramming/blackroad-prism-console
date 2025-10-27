package sentinel.process

# sentinel-allow: /usr/bin/python3
# sentinel-allow: /usr/bin/ebpf-loader
# sentinel-allow: /usr/bin/sbomctl
# sentinel-deny: /bin/bash


default allow = false

allow {
  input.executable == "/usr/bin/python3"
}

allow {
  input.executable == "/usr/bin/ebpf-loader"
}

allow {
  input.executable == "/usr/bin/sbomctl"
}

hint["Launch only registered Sentinel utilities."]
