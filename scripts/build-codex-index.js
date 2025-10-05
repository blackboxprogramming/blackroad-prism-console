/* eslint-env node */
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const sources = [
  {
    id: 'pricing',
    file: path.join('pricing', 'catalog.yaml'),
  },
  {
    id: 'plans',
    file: path.join('apps', 'api', 'src', 'routes', 'billing', 'plans.ts'),
  },
  {
    id: 'docs_pricing',
    file: path.join('docs', 'PRICING.md'),
  },
];

const docs = sources.map(({ id, file }) => ({
  id,
  text: fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '',
}));

const outputDir = path.join('data', 'search');
fs.mkdirSync(outputDir, { recursive: true });

const payload = docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n';
fs.writeFileSync(path.join(outputDir, 'index.jsonl'), payload);

console.log(`Indexed ${docs.length}`);
