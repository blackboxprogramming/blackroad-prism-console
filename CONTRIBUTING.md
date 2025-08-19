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
- Run the test suite:
  ```bash
  npm test
  ```
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## Submitting Changes

1. Commit your work with clear messages.
2. Push your branch and open a Pull Request.
3. Ensure CI checks pass and respond to review feedback.

We appreciate your contributions!
