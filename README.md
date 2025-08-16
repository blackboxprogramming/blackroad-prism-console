# Blackroad Prism Console

This project currently does not track a package manager lock file. Lock files ensure reproducible installs for everyone working on the project.

## Adding a lock file

1. Run `npm install` once (or `npm install --package-lock-only` if dependencies are already present).
2. Commit the generated `package-lock.json` to git: `git add package-lock.json && git commit -m "chore: add lock file"`.

After the lock file is committed, other contributors can install dependencies with `npm ci` for consistent installs.
