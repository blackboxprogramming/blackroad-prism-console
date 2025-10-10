import { Octokit } from "octokit";

type LabelDefinition = {
  name: string;
  color: string;
  description: string;
};

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;

if (!token) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

if (!repository) {
  console.error("GITHUB_REPOSITORY must be set to <owner>/<repo>");
  process.exit(1);
}

const [owner, repo] = repository.split("/");
if (!owner || !repo) {
  console.error(`Unable to parse GITHUB_REPOSITORY value: ${repository}`);
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

const labels: LabelDefinition[] = [
  { name: "playwright", color: "5319e7", description: "End-to-end UI automation" },
  { name: "mcp", color: "0e8a16", description: "Model context protocol integration" },
  { name: "hf", color: "ff7f50", description: "HuggingFace sync or deployment" },
  { name: "agents", color: "0366d6", description: "Agent platform updates" },
  { name: "ci", color: "b60205", description: "Continuous integration and pipelines" },
  { name: "security", color: "d73a4a", description: "Security issues or improvements" },
  { name: "dependencies", color: "5319e7", description: "Dependency updates" },
  { name: "auto-merge", color: "6f42c1", description: "Safe to auto-merge" },
  { name: "ops", color: "0052cc", description: "Operational follow-up" },
  { name: "docs", color: "4078c0", description: "Documentation changes" },
  { name: "tests", color: "0b7285", description: "Test coverage and stability" },
  { name: "needs-triage", color: "fbca04", description: "Awaiting triage" },
  { name: "type/bug", color: "d73a4a", description: "Bug report" },
  { name: "type/feature", color: "0e8a16", description: "Feature request" }
];

async function seedLabel(definition: LabelDefinition): Promise<void> {
  try {
    const { data } = await octokit.rest.issues.getLabel({
      owner,
      repo,
      name: definition.name
    });

    const needsUpdate =
      data.color.toLowerCase() !== definition.color.toLowerCase() ||
      (definition.description && (data.description ?? "") !== definition.description);

    if (needsUpdate) {
      await octokit.rest.issues.updateLabel({
        owner,
        repo,
        name: definition.name,
        color: definition.color,
        description: definition.description
      });
      console.log(`Updated label: ${definition.name}`);
    } else {
      console.log(`Label exists: ${definition.name}`);
    }
  } catch (error: any) {
    if (error.status === 404) {
      await octokit.rest.issues.createLabel({
        owner,
        repo,
        name: definition.name,
        color: definition.color,
        description: definition.description
      });
      console.log(`Created label: ${definition.name}`);
      return;
    }

    console.error(`Failed to process label ${definition.name}:`, error);
    throw error;
  }
}

(async function main() {
  for (const label of labels) {
    await seedLabel(label);
  }
  console.log("Label seeding complete.");
})();
