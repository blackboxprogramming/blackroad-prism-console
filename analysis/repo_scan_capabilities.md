# Repo Scan Capabilities

## Environment Access

- **File system**: Full read access to the repository, including hidden files, unless explicitly restricted by task instructions.
- **Remote network access**: Outbound HTTP/HTTPS requests to the public internet are enabled for repo scan tasks. Private networks and endpoints behind firewalls may still be unreachable, and long-lived connections are not guaranteed.
- **Process execution**: Standard shell commands and tooling available in the container can be executed, subject to resource and permission limits.

## Usage Notes

- Prefer lightweight search tools such as `rg` over recursive `ls`/`grep` when exploring large repositories.
- Obey any scoped instructions defined in `AGENTS.md` files before modifying content.
- Document any limitations encountered during a scan so that future operators understand the environment constraints.
