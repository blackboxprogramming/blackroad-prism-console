import * as jira from '../connectors/jira.js';
import * as linear from '../connectors/linear.js';

export async function openTicket(input: { summary: string; description: string }, env: any) {
  const outJira = await jira.createIssue(env.JIRA_BASE, env.JIRA_USER, env.JIRA_TOKEN, input.summary, env.JIRA_PROJECT);
  const outLinear = await linear.createIssue(env.LINEAR_TOKEN, env.LINEAR_TEAM, input.summary, input.description);
  return { ok: true, outJira, outLinear };
}
