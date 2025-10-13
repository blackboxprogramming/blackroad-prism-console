const JIRA_API_VERSION = "3";

type JiraPriority = "Highest" | "High" | "Medium" | "Low";

type JiraDocumentNode = {
  type: string;
  [key: string]: unknown;
};

export interface JiraCreateIssueParams {
  summary: string;
  description: string;
  labels?: string[];
  priority?: JiraPriority;
  sandbox?: boolean;
}

interface JiraCreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

function resolveEnv(base: string, sandbox: boolean): string | undefined {
  if (sandbox) {
    const key = `${base}_SANDBOX`;
    if (process.env[key]) return process.env[key];
  }
  return process.env[base];
}

function buildAuthHeader(sandbox: boolean) {
  const user = resolveEnv("JIRA_USER", sandbox);
  const token = resolveEnv("JIRA_API_TOKEN", sandbox);
  if (!user || !token) {
    throw new Error("Jira credentials are not configured");
  }
  const auth = Buffer.from(`${user}:${token}`).toString("base64");
  return `Basic ${auth}`;
}

function jiraBaseUrl(sandbox: boolean) {
  const base = resolveEnv("JIRA_BASE", sandbox);
  if (!base) {
    throw new Error("JIRA_BASE is not configured");
  }
  return base.replace(/\/$/, "");
}

function toAtlassianDoc(text: string): JiraDocumentNode {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
          },
        ],
      },
    ],
  };
}

export async function jiraCreateIssue({
  summary,
  description,
  labels = [],
  priority = "High",
  sandbox,
}: JiraCreateIssueParams): Promise<JiraCreateIssueResponse> {
  const sandboxMode = Boolean(sandbox);
  const authHeader = buildAuthHeader(sandboxMode);
  const base = jiraBaseUrl(sandboxMode);
  const projectKey = resolveEnv("JIRA_PROJECT_KEY", sandboxMode);
  const issueType = resolveEnv("JIRA_INCIDENT_TYPE", sandboxMode) || "Incident";
  if (!projectKey) {
    throw new Error("JIRA_PROJECT_KEY is not configured");
  }

  const response = await fetch(`${base}/rest/api/${JIRA_API_VERSION}/issue`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        issuetype: { name: issueType },
        summary,
        labels,
        priority: { name: priority },
        description: toAtlassianDoc(description),
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to create Jira issue: ${message}`);
  }

  return (await response.json()) as JiraCreateIssueResponse;
}

export async function jiraComment(issueKey: string, body: string, sandbox?: boolean): Promise<void> {
  const sandboxMode = Boolean(sandbox);
  const authHeader = buildAuthHeader(sandboxMode);
  const base = jiraBaseUrl(sandboxMode);

  const response = await fetch(`${base}/rest/api/${JIRA_API_VERSION}/issue/${issueKey}/comment`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: toAtlassianDoc(body),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to add Jira comment: ${message}`);
  }
}

export async function jiraResolve(
  issueKey: string,
  resolutionName = "Fixed",
  comment?: string,
  sandbox?: boolean,
): Promise<void> {
  const sandboxMode = Boolean(sandbox);
  const authHeader = buildAuthHeader(sandboxMode);
  const base = jiraBaseUrl(sandboxMode);
  const transitionId = resolveEnv("JIRA_TRANSITION_RESOLVE", sandboxMode);

  if (!transitionId) {
    throw new Error("JIRA_TRANSITION_RESOLVE is not configured");
  }

  if (comment) {
    await jiraComment(issueKey, comment, sandboxMode);
  }

  const response = await fetch(`${base}/rest/api/${JIRA_API_VERSION}/issue/${issueKey}/transitions`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transition: { id: transitionId },
      fields: {
        resolution: { name: resolutionName },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to resolve Jira issue: ${message}`);
  }
}

export function jiraBrowseUrl(issueKey: string, sandbox?: boolean): string {
  const sandboxMode = Boolean(sandbox);
  return `${jiraBaseUrl(sandboxMode)}/browse/${issueKey}`;
}
