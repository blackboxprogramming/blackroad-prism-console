import React, { useState } from 'react';

const snippets = {
  node: `import { createClient } from '@blackroad/public-api';\n\nconst client = createClient({\n  baseUrl: 'https://sandbox.api.blackroad.io',\n  token: process.env.BLACKROAD_TOKEN,\n});\n\nconst deploy = await client.deploys.create({\n  serviceId: 'svc-demo',\n  environment: 'staging',\n  gitRef: '1a2b3c4',\n});\nconsole.log(deploy.releaseId);`,
  python: `from blackroad import BlackRoadClient\n\nclient = BlackRoadClient(base_url='https://sandbox.api.blackroad.io', token='TOKEN')\nrelease = await client.deploys.create({\n    'serviceId': 'svc-demo',\n    'environment': 'staging',\n    'gitRef': '1a2b3c4'\n})\nprint(release['releaseId'])`,
};

const ExampleRunner = () => {
  const [language, setLanguage] = useState('node');

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">SDK Quickstart</h2>
        <select
          className="rounded border border-slate-200 bg-white px-3 py-2 text-sm"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="node">Node.js</option>
          <option value="python">Python</option>
        </select>
      </div>
      <pre className="mt-4 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-slate-100">
        <code>{snippets[language]}</code>
      </pre>
      <p className="mt-3 text-xs text-slate-500">
        Regenerated automatically from the OpenAPI contract. Last synced build surfaces spec version metadata in the SDKs.
      </p>
    </section>
  );
};

export default ExampleRunner;
