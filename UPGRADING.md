# Upgrading

## From 0.0.x to 0.1.0

- Paths moved under `cli/`.
- New CLI flag `--as-user` for commands that act on behalf of another user.
- Approval rules now live at `config/approvals.yml`.
- Modules renamed:
  - `old_module` → `new_module`:
    ```sh
    sed -i 's/old_module/new_module/g' $(git ls-files '*.py')
    ```
- Encrypted-at-rest data is unchanged. Keep your existing `config/ear_key.json` safe.
