# Contributing

Thanks for taking the time to contribute to BlackRoad Prism Console!

## Getting Started

1. Fork the repository and create your branch from `main`.
2. Install dependencies:
   ```bash
   npm ci
   (cd sites/blackroad && npm i --package-lock-only)
   ```

## Development Workflow

- Make sure code and documentation are formatted using `pre-commit`:
  ```bash
  pre-commit run --files <files>
  ```
- Run the automated test suites:
  ```bash
  npm test
  npm run test:smoke
  ```
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## Submitting Changes

1. Commit your work with clear messages.
2. Push your branch and open a Pull Request.
3. Ensure CI checks pass and respond to review feedback.

We appreciate your contributions!
Thank you for your interest in contributing to this project!

## Development setup

1. Install dependencies:
   ```sh
   npm install
   pip install -r requirements-dev.txt
   ```
2. Run tests and linters:
   ```sh
   pre-commit run --files CODE_OF_CONDUCT.md CONTRIBUTING.md SECURITY.md
   npm test
   npm run test:smoke
   ```

## Pull requests

- Create focused branches for each contribution.
- Ensure tests and linters pass before submitting.
- Provide clear descriptions of the changes in your pull request.

We appreciate your time and look forward to your contributions.
- Open an issue first for large changes.
- Bots and agents may open issues they discover and submit pull requests resolving them.
- Use conventional commits (feat:, fix:, chore:).
- For docs-only PRs, add label `docs` to allow auto-merge.
- To ask bots to remediate:
  `/codex apply .github/prompts/codex-fix-anything.md`
