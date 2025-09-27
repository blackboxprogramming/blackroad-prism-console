// Probot GitHub App scaffold
// Permissions: Issues (RW), Pull Requests (RW), Commit statuses (W), Checks (R)
export default (app) => {
  // Greet issues
  app.on("issues.opened", async (context) => {
    await context.octokit.issues.createComment(context.issue({
      body: "Thanks! A maintainer will review shortly. 🤖"
    }));
  });

  // Manual approval label gate
  app.on(["pull_request.labeled","pull_request.opened","pull_request.synchronize"], async (context) => {
    const pr = context.payload.pull_request;
    const labels = (pr.labels || []).map((l) => l.name);
    const required = "manual-approval";
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const sha = pr.head.sha;

    const hasApproval = labels.includes(required);
    const state = hasApproval ? "success" : "failure";
    const description = hasApproval
      ? "Manual approval present"
      : `Label '${required}' required by authorized reviewer`;

    await context.octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      context: "probot/manual-approval",
      description
    });
  });

  // Escalate critical issues (example log hook for Slack relay)
  app.on("issues.labeled", async (context) => {
    const label = context.payload.label.name;
    if (label === "severity:critical") {
      context.log.info({
        msg: "Critical issue escalation",
        title: context.payload.issue.title,
        url: context.payload.issue.html_url
      });
    }
  });
};
