import {Capability, Policy} from './types';

export const ALL_CAPABILITIES: Capability[] = [
  'read',
  'write',
  'exec',
  'net',
  'secrets',
  'dns',
  'deploy',
];

type Approval = Policy['approvals'][Capability];

type PolicyPreset = Record<Capability, Approval>;

type PartialApprovals = Partial<Record<Capability, Approval>>;

type PolicyOverrides = {
  mode?: Policy['mode'];
  approvals?: PartialApprovals;
};

const PRESETS: Record<Policy['mode'], PolicyPreset> = {
  playground: {
    read: 'auto',
    write: 'auto',
    exec: 'auto',
    net: 'auto',
    secrets: 'forbid',
    dns: 'forbid',
    deploy: 'forbid',
  },
  dev: {
    read: 'auto',
    write: 'auto',
    exec: 'auto',
    net: 'review',
    secrets: 'review',
    dns: 'review',
    deploy: 'review',
  },
  trusted: {
    read: 'auto',
    write: 'auto',
    exec: 'auto',
    net: 'auto',
    secrets: 'review',
    dns: 'auto',
    deploy: 'review',
  },
  prod: {
    read: 'auto',
    write: 'review',
    exec: 'review',
    net: 'review',
    secrets: 'forbid',
    dns: 'review',
    deploy: 'forbid',
  },
};

export function createPolicy(
  mode: Policy['mode'] = 'dev',
  overrides: PartialApprovals = {}
): Policy {
  const preset = PRESETS[mode];
  const approvals: Record<Capability, Approval> = {...preset};
  for (const capability of Object.keys(overrides) as Capability[]) {
    const decision = overrides[capability];
    if (decision) {
      approvals[capability] = decision;
    }
  }
  return {
    mode,
    approvals,
  };
}

export function normalizePolicy(policy: Policy | PolicyOverrides | undefined): Policy {
  if (!policy) {
    return createPolicy('dev');
  }
  if ('mode' in policy || 'approvals' in policy) {
    const mode = (policy as PolicyOverrides).mode ?? 'dev';
    return createPolicy(mode, (policy as PolicyOverrides).approvals);
  }
  return createPolicy(policy.mode, policy.approvals);
}

export function mergePolicy(base: Policy, overrides: PolicyOverrides): Policy {
  const mergedMode = overrides.mode ?? base.mode;
  const approvals = {...base.approvals};
  if (overrides.approvals) {
    for (const capability of Object.keys(overrides.approvals) as Capability[]) {
      const decision = overrides.approvals[capability];
      if (decision) {
        approvals[capability] = decision;
      }
    }
  }
  return {
    mode: mergedMode,
    approvals,
  };
}

export function decisionFor(policy: Policy, capability: Capability): Approval {
  return policy.approvals[capability] ?? 'review';
}

export function isCapabilityAllowed(policy: Policy, capability: Capability) {
  return decisionFor(policy, capability) === 'auto';
}

export function requiresApproval(policy: Policy, capability: Capability) {
  return decisionFor(policy, capability) === 'review';
}

export function isCapabilityForbidden(policy: Policy, capability: Capability) {
  return decisionFor(policy, capability) === 'forbid';
}

export function assertCapability(
  policy: Policy,
  capability: Capability,
  message?: string
) {
  const decision = decisionFor(policy, capability);
  if (decision === 'forbid') {
    throw new Error(message ?? `Capability ${capability} is forbidden under ${policy.mode} policy`);
  }
}

export function summarizePolicy(policy: Policy) {
  return ALL_CAPABILITIES.reduce<Record<Capability, Approval>>((acc, capability) => {
    acc[capability] = decisionFor(policy, capability);
    return acc;
  }, {} as Record<Capability, Approval>);
}
