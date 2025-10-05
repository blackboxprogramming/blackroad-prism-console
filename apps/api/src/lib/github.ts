export interface GithubValidationResult {
  ok: boolean;
  login?: string;
  error?: string;
}

const DEFAULT_USER_AGENT = 'BlackRoad-GitHub-Connector/1.0';

export async function validateGithubPAT(token: string): Promise<GithubValidationResult> {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'missing_token' };
  }

  if (process.env.GITHUB_PAT_SKIP_VALIDATE === '1') {
    return { ok: true, login: 'mock-user' };
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': process.env.GITHUB_USER_AGENT ?? DEFAULT_USER_AGENT,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!response.ok) {
      return { ok: false, error: `github_${response.status}` };
    }
    const json = (await response.json()) as { login?: string };
    return { ok: true, login: json.login };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
