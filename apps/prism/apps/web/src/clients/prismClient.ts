import {PrismEvent, PrismSpan, PrismDiff, Policy} from 'prism-core';

export interface PrismClient {
  publish(e: PrismEvent): Promise<void>;
  startSpan(name: string, attrs?: any): Promise<string>;
  endSpan(spanId: string, status?: PrismSpan['status'], attrs?: any): Promise<void>;
  proposeDiff(files: Record<string,string>): Promise<PrismDiff[]>;
  applyDiffs(diffs: PrismDiff[], message: string): Promise<{commitSha:string}>;
  run(cmd: string, opts?: {cwd?: string, env?: Record<string,string>}): AsyncIterable<PrismEvent>;
  explain(eventId: string): Promise<string>;
  revert(commitSha: string): Promise<void>;
  getPolicy(): Promise<Policy>;
  setPolicy(p: Policy): Promise<void>;
}
