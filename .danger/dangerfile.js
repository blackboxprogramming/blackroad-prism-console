/* Dangerfile: comment on PRs with quick quality checks */
/* global danger, message, warn */

// Removed unused fs import; Danger provides necessary context.
/* eslint-env node */
/* global danger, message, warn */
/* eslint-env node */
/* global danger, warn, message */

// Quick quality checks for pull requests

const files = danger.git.modified_files.concat(danger.git.created_files);
const big = files.filter((f) => f.endsWith('.html') || f.endsWith('.js'));

if (big.length > 0) {
  message(`🧪 Files to focus review on:\n- ${big.join('\n- ')}`);
}

const added = danger.github.pr.additions || 0;
if (added > 1500) {
  warn(`PR is quite large (${added} additions). Consider splitting if possible.`);
}

if (!danger.github.pr.body || danger.github.pr.body.length < 20) {
  warn('PR description is a bit sparse. Please add context and testing notes.');
}

const hasScreenshot = /!\[.*\]\(.*\)/.test(danger.github.pr.body || '');
if (!hasScreenshot && files.some((f) => f.endsWith('.html'))) {
  warn('UI change detected, but no screenshot in the PR body.');
}
