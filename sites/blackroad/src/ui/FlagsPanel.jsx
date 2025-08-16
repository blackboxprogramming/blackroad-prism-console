import { useState } from 'react';

/**
 * Feature Flags Panel (opens a PR to flip flags using a GitHub URL template)
 * Skip-safe: this only constructs a link; no direct writes.
 */
export default function FlagsPanel() {
  const [flags, setFlags] = useState({
    ai_tools: true,
    security_scans: true,
    web_performance: true,
    heavy_linters: false,
  });
  const body = `ai_tools: ${flags.ai_tools}\nsecurity_scans: ${flags.security_scans}\nweb_performance: ${flags.web_performance}\nheavy_linters: ${flags.heavy_linters}\n`;
  const branch = `flags-${Date.now()}`;
  const url = `https://github.com/${location.pathname.split('/')[1] || ''}?`; // placeholder; edited in docs
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Feature Flags</h2>
      <ul className="list-disc ml-5">
        {Object.keys(flags).map((k) => (
          <li key={k}>
            <label>
              <input
                type="checkbox"
                checked={flags[k]}
                onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })}
              />{' '}
              {k}
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 opacity-70 text-sm">
        This builds a commit suggestion to update <code>.github/feature-flags.yml</code>.
      </p>
      <textarea readOnly value={body} style={{ width: '100%', height: 110 }} className="mt-3" />
    </div>
  );
}
