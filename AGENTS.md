# Repository Guidelines

## Code Review Heuristics

- **Context first**: read the description, commit history, and related files to grasp the problem being solved.
- **Run the checks**: execute available tests and linters; verify that new and existing tests pass.
- **Correctness & coverage**: ensure logic is sound, edge cases considered, and tests cover critical paths.
- **Readability**: prefer clear naming, modular structure, and comments where intent is non-obvious.
- **Security & performance**: watch for injection risks, data leaks, and unnecessary complexity or resource use.
- **Consistency**: adhere to project style guides and existing patterns; suggest alignment where drift occurs.
- **Constructive feedback**: celebrate strengths, note issues with empathy, and propose concrete improvements or questions.

## Active Agents

- **BuildBlackRoadSiteAgent**: builds the BlackRoad.io site.
- **WebsiteBot**: deploys the site.
- **CleanupBot**: removes branches merged into the base branch.
