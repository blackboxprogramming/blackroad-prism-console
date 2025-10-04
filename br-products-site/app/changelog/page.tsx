export const revalidate = 1800;

type Release = {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  body: string | null;
  published_at: string | null;
};

async function fetchReleases(): Promise<Release[]> {
  const org = process.env.NEXT_PUBLIC_CHANGELOG_ORG ?? 'blackboxprogramming';
  const repo = process.env.NEXT_PUBLIC_CHANGELOG_REPO ?? 'br-products-site';
  try {
    const response = await fetch(
      `https://api.github.com/repos/${org}/${repo}/releases`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'blackroad-changelog-site',
        },
      },
    );

    if (!response.ok) {
      console.warn('Failed to load releases for changelog', response.status);
      return [];
    }

    return (await response.json()) as Release[];
  } catch (error) {
    console.warn('Unable to reach GitHub releases API', error);
    return [];
  }
}

function formatDate(date: string | null): string {
  if (!date) return 'Unpublished';
  return new Date(date).toLocaleString();
}

export default async function ChangelogPage() {
  const releases = await fetchReleases();

  return (
    <main
      style={{
        maxWidth: 800,
        margin: '40px auto',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1>Changelog</h1>
      {releases.length === 0 ? (
        <p style={{ color: '#666' }}>
          No releases found yet. Once release-please publishes a release,
          it will appear here within about 30 minutes.
        </p>
      ) : (
        releases.map((release) => (
          <section
            key={release.id}
            style={{
              margin: '24px 0',
              paddingBottom: 16,
              borderBottom: '1px solid #eee',
            }}
          >
            <h2 style={{ marginBottom: 8 }}>
              {release.name || release.tag_name}
            </h2>
            <div style={{ color: '#666', fontSize: 12 }}>
              {formatDate(release.published_at)}
            </div>
            <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {release.body || 'No release notes provided.'}
            </div>
            <a
              href={release.html_url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12 }}
            >
              View on GitHub
            </a>
          </section>
        ))
      )}
    </main>
  );
}
