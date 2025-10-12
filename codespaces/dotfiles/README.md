# BlackRoad Codespaces Dotfiles

These dotfiles provide a lightweight setup for GitHub Codespaces and other devcontainers.
They install a handful of Git helpers and aliases so the shell "just works" with the
BlackRoad pull request automation flow.

## Installation

```bash
unzip blackroad-codespaces-dotfiles.zip -d ~/dot-tmp
cd ~/dot-tmp
bash install.sh
```

After the script finishes, open a new shell (or run `exec "$SHELL"`) so the aliases load.

## What the installer configures

* Creates `~/.blackroad/codespaces` and copies the managed scripts there.
* Ensures `~/.bashrc` and `~/.zshrc` source the managed scripts (without duplicating entries).
* Provides the following helpers:
  * `fe` – formats a PR title using the emoji inferred from the current branch.
  * `gpl` – shortcut for `gh pr list`.
  * `prmy` – lists the current user's open pull requests via `gh`.

You can safely re-run `install.sh`; it is idempotent and will refresh the helper scripts.
