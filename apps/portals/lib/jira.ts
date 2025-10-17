const JIRA_API_VERSION = '3';

type JiraPriority = 'Highest' | 'High' | 'Medium' | 'Low';

type JiraDocumentNode = {
  type: string;
  [key: string]: unknown;
};

export interface JiraCreateIssueParams {
  summary: string;
  description: string;
  labels?: string[];
  priority?: JiraPriority;
}

interface JiraCreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

function buildAuthHeader() {
  const user = process.env.JIRA_USER;
  const token = process.env.JIRA_API_TOKEN;
  if (!user || !token) {
    throw new Error('Jira credentials are not configured');
  }
  const auth = Buffer.from(`${user}:${token}`).toString('base64');
  return `Basic ${auth}`;
}

function jiraBaseUrl() {
  const base = process.env.JIRA_BASE;
  if (!base) {
    throw new Error('JIRA_BASE is not configured');
  }
  return base.replace(/\/$/, '');
}

function toAtlassianDoc(text: string): JiraDocumentNode {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
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
  priority = 'High',
}: JiraCreateIssueParams): Promise<JiraCreateIssueResponse> {
  const authHeader = buildAuthHeader();
  const base = jiraBaseUrl();
  const projectKey = process.env.JIRA_PROJECT_KEY;
  const issueType = process.env.JIRA_INCIDENT_TYPE || 'Incident';
  if (!projectKey) {
    throw new Error('JIRA_PROJECT_KEY is not configured');
  }

  const response = await fetch(`${base}/rest/api/${JIRA_API_VERSION}/issue`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
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

export async function jiraComment(issueKey: string, body: string): Promise<void> {
  const authHeader = buildAuthHeader();
  const base = jiraBaseUrl();

  const response = await fetch(`${base}/rest/api/${JIRA_API_VERSION}/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
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
  resolutionName = 'Fixed',
  comment?: string,
): Promise<void> {
  const authHeader = buildAuthHeader();
  const base = jiraBaseUrl();
  const transitionId = process.env.JIRA_TRANSITION_RESOLVE;

  if (!transitionId) {
    throw new Error('JIRA_TRANSITION_RESOLVE is not configured');
  }

  if (comment) {
    await jiraComment(issueKey, comment);
  }

  const response = await fetch(`${base}/rest/api/${JIRA_API_VERSION}/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
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

export function jiraBrowseUrl(issueKey: string): string {
  return `${jiraBaseUrl()}/browse/${issueKey}`;
}
