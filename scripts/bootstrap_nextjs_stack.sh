#!/usr/bin/env bash
set -euo pipefail

# Scaffolds a sample Next.js stack with contracts, metrics, governance,
# SPC tests, Vercel preview workflow, security middleware and reproducibility checks.
# Usage: ./bootstrap_nextjs_stack.sh [project-name]

APP_NAME="${1:-prism-next-stack}"

# Create project
npx create-next-app@latest "$APP_NAME" --ts --eslint --app --src-dir --tailwind --use-pnpm --yes

cd "$APP_NAME"

# Dependencies for contracts
pnpm add zod

# Directories
mkdir -p lib fixtures/plm tests .github/workflows

# Schema contract with ranges/patterns
cat <<'SCHEMA' > lib/contracts.ts
import { z } from 'zod';

export const PartContract = z.object({
  partNumber: z.string().regex(/^PN-\d{4}$/),
  supplierA: z.string().min(1),
  supplierB: z.string().min(1),
  tolerance: z.number().min(0).max(1),
});
export type Part = z.infer<typeof PartContract>;
SCHEMA

# Tiny metrics emitter
cat <<'METRICS' > lib/metrics.ts
class Metrics {
  counters: Record<string, number> = {};
  inc(name: string, value = 1) {
    this.counters[name] = (this.counters[name] || 0) + value;
  }
  get(name: string) {
    return this.counters[name] || 0;
  }
}
export const metrics = new Metrics();
METRICS

# SPC gate with metrics
cat <<'SPC' > lib/spc.ts
import { metrics } from './metrics';

export function spcGate(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const sigma = Math.sqrt(variance);
  const breach = values.some((v) => Math.abs(v - mean) > 3 * sigma);
  if (breach) metrics.inc('spc_breach');
  return { mean, sigma, breach };
}
SPC

# Governance dual-source enforcement
cat <<'GOV' > lib/governance.ts
import fs from 'node:fs';
import path from 'node:path';
import { PartContract } from './contracts';

const criticalPath = path.join(process.cwd(), 'fixtures/plm/critical_items.txt');
export function checkDualSource(part: unknown) {
  const parsed = PartContract.parse(part);
  const criticalItems = fs.readFileSync(criticalPath, 'utf8').trim().split(/\r?\n/);
  if (criticalItems.includes(parsed.partNumber)) {
    if (!parsed.supplierA || !parsed.supplierB || parsed.supplierA === parsed.supplierB) {
      throw new Error(`Critical part ${parsed.partNumber} must have distinct dual sourcing`);
    }
  }
  return true;
}
GOV

# Critical parts fixture
cat <<'CRIT' > fixtures/plm/critical_items.txt
PN-0001
PN-0002
CRIT

# Tests for SPC and dual-source governance
cat <<'TEST1' > tests/spc.test.ts
import { spcGate } from '../lib/spc';

describe('SPC 3σ breach', () => {
  it('flags out-of-control process', () => {
    const res = spcGate([10, 10, 10, 10, 20]);
    expect(res.breach).toBe(true);
  });
});
TEST1

cat <<'TEST2' > tests/governance.test.ts
import { checkDualSource } from '../lib/governance';

describe('Dual-source policy', () => {
  it('rejects single-source critical parts', () => {
    expect(() =>
      checkDualSource({ partNumber: 'PN-0001', supplierA: 'A', supplierB: 'A', tolerance: 0.5 })
    ).toThrow();
  });

  it('accepts dual-sourced parts', () => {
    expect(
      checkDualSource({ partNumber: 'PN-0001', supplierA: 'A', supplierB: 'B', tolerance: 0.5 })
    ).toBe(true);
  });
});
TEST2

# Security headers middleware
cat <<'MID' > middleware.ts
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = new Response(null, { headers: { 'x-middleware-next': '1' } });
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}
MID

# Wire metrics in home page
cat <<'PAGE' > src/app/page.tsx
import { metrics } from '../lib/metrics';

export default function Home() {
  metrics.inc('page_hits');
  return (
    <main>
      <h1>Hello World</h1>
      <p>Hits: {metrics.get('page_hits')}</p>
    </main>
  );
}
PAGE

# Vercel preview workflow template
cat <<'VERCEL' > .github/workflows/vercel-preview.yml
name: Vercel Preview
on:
  pull_request:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install --frozen-lockfile
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          scope: ${{ github.repository_owner }}
VERCEL

# CI with reproducibility assertion
cat <<'CI' > .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install --frozen-lockfile
      - run: test -z "$(git status --porcelain)" # reproducibility assertion
      - run: pnpm test
CI

# Done
printf "\nProject %s is ready.\n" "$APP_NAME"
