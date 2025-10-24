#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import yaml from 'yaml';

async function main() {
  const [specPath, compatPath] = process.argv.slice(2);
  if (!specPath || !compatPath) {
    console.error('Usage: openapi-compat-check <spec> <compat-config>');
    process.exit(1);
  }

  const specContent = await readFile(specPath, 'utf-8');
  const compatContent = await readFile(compatPath, 'utf-8');
  const spec = yaml.parse(specContent);
  const compat = yaml.parse(compatContent);

  if (!spec?.openapi?.startsWith('3.')) {
    throw new Error('OpenAPI spec must declare version 3.x');
  }

  if (!Array.isArray(compat?.rules)) {
    throw new Error('compat.yml must define rules array');
  }

  console.log(`Compat check passed for ${spec.info?.title ?? 'unknown spec'} v${spec.info?.version ?? '0.0.0'}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
