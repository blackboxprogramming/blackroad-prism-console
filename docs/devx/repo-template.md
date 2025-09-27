# `br-repo-template`

The `br-repo-template` repository bootstraps new BlackRoad services with batteries included developer experience. It ships two application skeletons (Next.js frontend and Fastify backend) and shared operational scaffolding so that new teams can focus on product code instead of wiring.

## Contents

- `apps/web`: Next.js 14 baseline with Tailwind, ESLint/Prettier, Cypress smoke test, and Vercel-ready configuration.
- `apps/api`: Fastify service with TypeScript, Prisma example, Jest unit tests, and OpenAPI contract stub.
- Shared GitHub Actions workflows:
  - Continuous Integration matrix that runs linting, unit tests, type checking, and secret scanning in under ten minutes.
  - Docker image build and publishing job for API artefacts.
  - Deploy hooks for main branch.
- Security defaults:
  - Dependabot configuration for npm, Docker, and GitHub Actions.
  - Snyk workflow triggered daily and on pull requests.
  - CODEOWNERS, PR template, and Definition-of-Done checklist.
- Repository hygiene: Conventional Commit linting, Husky-managed pre-commit hooks, issue templates, LICENSE, CONTRIBUTING, README.

## Creating the template repository

1. Authenticate with GitHub CLI using an account that has access to the `blackboxprogramming` organisation.
2. Create the repository from this codebase:
   ```bash
   gh repo create blackboxprogramming/br-repo-template --private --description "BlackRoad full-stack service template"
   git push git@github.com:blackboxprogramming/br-repo-template.git main
   ```
3. Enable required settings:
   - Default branch protections for `main` (require PR, passing status checks, and linear history).
   - Snyk app installed with automated testing enabled.
   - Dependabot alerts and security updates activated.
4. Share the repository URL with the platform team so they can subscribe `br-platform` CODEOWNERS.

## Spinning up a new service

Once the template repository exists, new services can be generated via GitHub's template flow or CLI:

```bash
gh repo create blackboxprogramming/new-service --template blackboxprogramming/br-repo-template --private --description "New BlackRoad service"
```

After creation:

1. Update `package.json` metadata (`name`, `description`, `repository`).
2. Configure environment secrets (Vercel, AWS, databases) in the new repository settings.
3. Wire the preview environment GitHub Action to the correct cluster and DNS using repository-level secrets.
4. Announce the new service in `#eng` with the preview URL once the first PR lands.

## Definition of Done checklist

Each repository created from the template should keep the included `.github/pull_request_template.md` checklist. Items cover testing, security review, documentation, and observability hooks to ensure consistent quality across teams.
