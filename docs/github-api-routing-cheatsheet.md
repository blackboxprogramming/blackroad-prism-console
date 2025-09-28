# GitHub API Routing Cheat Sheet

## Core REST v3 Calls
- **List changed files in a PR**
  - `GET /repos/{owner}/{repo}/pulls/{number}/files`
- **Leave a comment (supports @mentions and team pings)**
  - `POST /repos/{owner}/{repo}/issues/{number}/comments`
  - Body: `{ "body": "Routing to: @org/team-name @username" }`
- **Single bot comment (create or update)**
  - List existing comments: `GET /repos/{owner}/{repo}/issues/{number}/comments?per_page=100`
  - Update: `PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}`
- **Request reviewers (works with CODEOWNERS)**
  - `POST /repos/{owner}/{repo}/pulls/{number}/requested_reviewers`
  - Body: `{ "reviewers": ["user1"], "team_reviewers": ["team-slug"] }`
- **Add labels (if routing is label driven)**
  - `POST /repos/{owner}/{repo}/issues/{number}/labels`
  - Body: `{ "labels": ["frontend"] }`
- **Verify a team can be mentioned**
  - `GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}` → `200 OK` confirms repo access.

## Octokit (Node) Snippets
```ts
import { Octokit } from "octokit";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function changedFiles({ owner, repo, number }) {
  const files = await octokit.paginate(
    "GET /repos/{owner}/{repo}/pulls/{number}/files",
    { owner, repo, number, per_page: 100 }
  );
  return files.map((f) => f.filename);
}

export async function upsertRoutingComment({ owner, repo, number, body, marker }) {
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: number,
    per_page: 100,
  });
  const mine = comments.find(
    (c) => c.user?.type === "Bot" && c.body?.includes(marker)
  );
  if (mine) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: mine.id,
      body,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body,
    });
  }
}
```

## GraphQL One-Round Trip
- Fetch files: `pullRequest(number: N) { files(first: 100) { nodes { path } } }`
- Add comment: `addComment(input: { subjectId, body }) { commentEdge { node { id } } }`
- Update comment: `updateIssueComment(input: { id, body }) { issueComment { id } }`

## Minimal `curl` Examples
- **Comment with mentions**
  ```bash
  curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -X POST \
    https://api.github.com/repos/OWNER/REPO/issues/123/comments \
    -d '{"body":"Routing to: @org/team-name @user\\n\\n(Automated based on changed paths.)"}'
  ```
- **Request team reviewers**
  ```bash
  curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -X POST \
    https://api.github.com/repos/OWNER/REPO/pulls/123/requested_reviewers \
    -d '{"team_reviewers":["team-slug"]}'
  ```

## Webhook Triggers to Watch
- `pull_request`: `opened`, `synchronize`, `ready_for_review`, `reopened`
- `pull_request`: `labeled` (useful when labels drive routing)
- `pull_request_review`: drive escalations (e.g., no review in 24h)

## Gotchas
- Team mentions only notify when the team can see the repo **and** org settings allow team mentions.
- Private repos cannot notify external collaborators even if mentioned.
- Respect rate limits: paginate file lists (100 per page) and prefer file paths over raw diff scans for large PRs.

## Automation Sketch
1. Fetch changed files.
2. Map file paths to people/teams.
3. Request reviewers and upsert a single routing comment.
