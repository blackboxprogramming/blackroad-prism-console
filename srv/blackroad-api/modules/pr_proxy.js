// PR Relay: create branches, commit files (Contents API), open PRs.
// Auth: secured by your global requestGuard (X-BlackRoad-Key) or add a local check if not mounted.
const fs = require('fs');

module.exports = function attachPrProxy({ app }) {
  if (!app) throw new Error('pr_proxy: need app');

  const OWNER = process.env.GH_OWNER || 'blackboxprogramming';
  const REPO  = process.env.GH_REPO  || 'blackroad-prism-console';
  const PAT_PATH = process.env.GH_PAT_PATH || '/srv/secrets/github_pat';
  const BASE_BRANCH = process.env.GH_BASE || 'main';

  function readPAT() {
    try { return fs.readFileSync(PAT_PATH, 'utf8').trim(); }
    catch { return ''; }
  }
  async function gh(path, {method='GET', body=null, headers={}} = {}) {
    const token = readPAT();
    if (!token) throw new Error('Missing PAT at GH_PAT_PATH');
    const h = Object.assign({
      'Accept': 'application/vnd.github+json',
      'Authorization': `token ${token}`
    }, headers);
    const r = await fetch(`https://api.github.com${path}`, {
      method, headers: h, body: body ? JSON.stringify(body) : null
    });
    if (!r.ok) {
      const t = await r.text().catch(()=>r.statusText);
      throw new Error(`${method} ${path} -> ${r.status} ${t}`);
    }
    return await r.json().catch(()=> ({}));
  }

  // Quick test
  app.get('/api/github/test', async (req, res) => {
    try {
      const repo = await gh(`/repos/${OWNER}/${REPO}`);
      res.ok({ owner: OWNER, repo: REPO, default_branch: repo.default_branch || BASE_BRANCH });
    } catch (e) { res.fail(String(e), 500); }
  });

  /**
   * POST /api/github/pr
   * Body:
   * {
   *   "title": "Guardian: Policy Baseline",
   *   "body": "What & why...",
   *   "branch": "guardian/baseline",
   *   "base": "main",
   *   "delete_branch_if_exists": false,
   *   "changes": [
   *      { "path": ".github/workflows/auto-fix.yml", "content": "<raw string or base64>", "is_base64": false },
   *      { "path": ".github/labels.yml", "content_b64": "<base64 string>" }
   *   ]
   * }
   */
  app.post('/api/github/pr', async (req, res) => {
    try {
      const b = req.body || {};
      const title = String(b.title || 'Update');
      const prBody = String(b.body || '');
      const branch = String(b.branch || `codex/${Date.now()}`);
      const base   = String(b.base   || BASE_BRANCH);
      const deleteIf = !!b.delete_branch_if_exists;
      const changes = Array.isArray(b.changes) ? b.changes : [];

      if (changes.length === 0) return res.fail('No changes[] provided', 400);

      // 1) Base ref SHA
      const baseRef = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${base}`);
      const baseSha = baseRef.object.sha;

      // 2) Create branch (or reuse)
      let created = false;
      try {
        await gh(`/repos/${OWNER}/${REPO}/git/refs`, {
          method:'POST',
          body: { ref: `refs/heads/${branch}`, sha: baseSha }
        });
        created = true;
      } catch (e) {
        if (String(e.message).includes('Reference already exists')) {
          if (deleteIf) {
            // Force-move the ref to baseSha (cheap reset)
            await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
              method:'PATCH', body: { sha: baseSha, force: true }
            });
          }
        } else { throw e; }
      }

      // 3) Create or update files via Contents API
      for (const ch of changes) {
        const path = String(ch.path || '');
        if (!path) continue;
        let contentB64 = ch.content_b64 || ch.contentB64;
        if (!contentB64) {
          const raw = ch.content || '';
          contentB64 = Buffer.from(String(raw), 'utf8').toString('base64');
        }
        // Need current file SHA if updating existing file
        let sha = undefined;
        try {
          const cur = await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
          sha = cur.sha;
        } catch (_) { /* new file */ }

        await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`, {
          method:'PUT',
          body: {
            message: `chore: update ${path} (${title})`,
            content: contentB64,
            branch, sha
          }
        });
      }

      // 4) Open PR (idempotent-ish: if branch already has an open PR, just return it)
      let pr;
      try {
        pr = await gh(`/repos/${OWNER}/${REPO}/pulls`, {
          method:'POST',
          body: { title, head: branch, base, body: prBody, maintainer_can_modify: true, draft: false }
        });
      } catch (e) {
        // Check for existing PR
        const prs = await gh(`/repos/${OWNER}/${REPO}/pulls?head=${OWNER}:${branch}&state=open`);
        if (Array.isArray(prs) && prs.length) pr = prs[0]; else throw e;
      }

      res.ok({ url: pr.html_url, number: pr.number, branch, created, base });
    } catch (e) {
      res.fail(String(e), 500);
    }
  });

  console.log('[pr_proxy] /api/github/pr ready for %s/%s', OWNER, REPO);
};
