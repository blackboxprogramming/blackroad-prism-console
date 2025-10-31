# Contributing

## Development Workflow

- Make sure code and documentation are formatted using `pre-commit`:
  ```bash
  pre-commit run --files <files>
  ```
- Run the automated test suites:
  ```bash
  npm test
  npm run test:smoke
  npm run test:jest
  ```
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## Submitting Changes

1. Commit your work with clear messages.
2. Push your branch and open a Pull Request.
3. Ensure CI checks pass and respond to review feedback.

## PR Automation Bundle

To streamline large review waves we ship a GitHub automation bundle in this repository:

- Run `scripts/seed-labels.ts` (via `pnpm tsx`) to bootstrap labels referenced by the workflows and CSV helpers.
- Use `scripts/bulk-create-prs.sh prs.csv --dry-run` to preview draft PR creation before sending them live.
- Keep the `prs.csv` catalog up to date so the automation can map branches to the correct reviewers and labels.

We appreciate your contributions!
Thank you for your interest in contributing to this project!

## Development setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run tests and linters:
   ```sh
   pre-commit run --files CODE_OF_CONDUCT.md CONTRIBUTING.md SECURITY.md
   npm test
   npm run test:smoke
2. Run checks:
   ```bash
   make lint
   make typecheck
   pytest
   ```
3. Use conventional commits (`feat:`, `fix:`).
  ```sh
  pre-commit run --files CODE_OF_CONDUCT.md CONTRIBUTING.md SECURITY.md
  npm test
  npm run test:jest
  ```

## Submitting Changes

- Open a pull request with a clear description.
- Ensure all tests pass.
