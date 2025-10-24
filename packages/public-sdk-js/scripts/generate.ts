import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

const ROOT = path.resolve(process.cwd(), '../../docs/api/public/openapi.yaml');

async function main() {
  const source = await fs.readFile(ROOT, 'utf-8');
  const doc = yaml.parse(source);
  const version = doc?.info?.version ?? '0.0.0';
  const output = `// Generated from docs/api/public/openapi.yaml\nexport const SPEC_VERSION = '${version}';\n`;
  const target = path.resolve(process.cwd(), 'src/generated.ts');
  await fs.writeFile(target, output);
  console.log(`Generated metadata for OpenAPI version ${version}`);
}

main().catch((error) => {
  console.error('SDK generation failed', error);
  process.exit(1);
});
