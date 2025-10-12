export type UnityTemplate = {
  id: string;
  name: string;
  description: string;
};

export type UnityPipelinePhase = {
  title: string;
  items: string[];
};

export const UNITY_TARGET_OPTIONS = [
  { id: 'windows', label: 'Windows (Win64)' },
  { id: 'mac', label: 'macOS (Intel/Apple)' },
  { id: 'linux', label: 'Linux (x86_64)' },
  { id: 'webgl', label: 'WebGL' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
] as const;

export type UnityTargetOption = (typeof UNITY_TARGET_OPTIONS)[number];
export type UnityTargetId = UnityTargetOption['id'];

export interface UnityPortalContent {
  templates: UnityTemplate[];
  pipelinePhases: UnityPipelinePhase[];
  renderChecklist: string[];
  defaultTargets: UnityTargetId[];
}

export const DEFAULT_UNITY_TEMPLATES: UnityTemplate[] = [
  {
    id: 'sandbox',
    name: 'HDRP Sandbox',
    description:
      'Baseline lighting, VFX, and level streaming tuned for benchmarking new features before they reach shared projects.',
  },
  {
    id: 'expedition',
    name: 'Narrative Expedition',
    description:
      'Story-driven scene with timeline cues, dialogue hooks, and cinematics for publishing weekly milestone builds.',
  },
  {
    id: 'lab',
    name: 'Simulation Lab',
    description:
      'Physics-heavy environment that mirrors production quality settings used across engineering demos.',
  },
];

export const DEFAULT_UNITY_PIPELINE: UnityPipelinePhase[] = [
  {
    title: 'Prepare Project',
    items: [
      'Sync template changes and confirm scenes open without missing packages or GUID conflicts.',
      'Review platform-specific scripting defines before triggering new exports.',
    ],
  },
  {
    title: 'Build & Export',
    items: [
      'Run Unity CLI builds per target and capture console output for the activity log.',
      'Drop successful artifacts into the exporter downloads share for downstream automation.',
    ],
  },
  {
    title: 'Quality Review',
    items: [
      'Check GPU/CPU frame timings, memory usage, and bundle sizes against current targets.',
      'Validate lighting, post-processing, and platform toggles match the intended release channel.',
    ],
  },
];

export const DEFAULT_UNITY_RENDER_CHECKLIST: string[] = [
  'Bake lighting and probes for the current platform group.',
  'Verify streaming assets and addressables load without stutter on target hardware.',
  'Confirm reflection probes, volumetric settings, and skyboxes are aligned with latest art direction.',
  'Update release notes with known issues or manual steps before promoting the build.',
];

export const DEFAULT_UNITY_TARGETS: UnityTargetId[] = ['windows', 'webgl'];

export const DEFAULT_UNITY_PORTAL_CONTENT: UnityPortalContent = {
  templates: DEFAULT_UNITY_TEMPLATES.map((template) => ({ ...template })),
  pipelinePhases: DEFAULT_UNITY_PIPELINE.map((phase) => ({
    title: phase.title,
    items: [...phase.items],
  })),
  renderChecklist: [...DEFAULT_UNITY_RENDER_CHECKLIST],
  defaultTargets: [...DEFAULT_UNITY_TARGETS],
};

const TARGET_ID_SET = new Set<UnityTargetId>(UNITY_TARGET_OPTIONS.map((option) => option.id));

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function sanitizeUnityTemplates(input: unknown): UnityTemplate[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const templates: UnityTemplate[] = [];

  for (const candidate of input) {
    if (!candidate || typeof candidate !== 'object') continue;
    const { id, name, description } = candidate as {
      id?: unknown;
      name?: unknown;
      description?: unknown;
    };

    if (!isNonEmptyString(id) || !isNonEmptyString(name) || !isNonEmptyString(description)) {
      continue;
    }

    const normalizedId = id.trim();
    if (seen.has(normalizedId)) {
      continue;
    }

    templates.push({
      id: normalizedId,
      name: name.trim(),
      description: description.trim(),
    });
    seen.add(normalizedId);
  }

  return templates;
}

export function sanitizeUnityPipeline(input: unknown): UnityPipelinePhase[] {
  if (!Array.isArray(input)) return [];
  const phases: UnityPipelinePhase[] = [];

  for (const candidate of input) {
    if (!candidate || typeof candidate !== 'object') continue;
    const { title, items } = candidate as {
      title?: unknown;
      items?: unknown;
    };

    if (!isNonEmptyString(title) || !Array.isArray(items)) {
      continue;
    }

    const sanitizedItems = items
      .filter((item): item is string => isNonEmptyString(item))
      .map((item) => item.trim());

    if (sanitizedItems.length === 0) {
      continue;
    }

    phases.push({
      title: title.trim(),
      items: sanitizedItems,
    });
  }

  return phases;
}

export function sanitizeUnityChecklist(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const checklist: string[] = [];
  for (const item of input) {
    if (isNonEmptyString(item)) {
      checklist.push(item.trim());
    }
  }

  return checklist;
}

export function sanitizeUnityTargetIds(input: unknown): UnityTargetId[] {
  if (!Array.isArray(input)) return [];
  const targets: UnityTargetId[] = [];

  for (const candidate of input) {
    if (!isNonEmptyString(candidate)) {
      continue;
    }
    const normalized = candidate.trim() as UnityTargetId;
    if (TARGET_ID_SET.has(normalized) && !targets.includes(normalized)) {
      targets.push(normalized);
    }
  }

  return targets;
}

export function mergeUnityPortalContent(overrides: unknown): UnityPortalContent {
  const base: UnityPortalContent = {
    templates: DEFAULT_UNITY_PORTAL_CONTENT.templates.map((template) => ({ ...template })),
    pipelinePhases: DEFAULT_UNITY_PORTAL_CONTENT.pipelinePhases.map((phase) => ({
      title: phase.title,
      items: [...phase.items],
    })),
    renderChecklist: [...DEFAULT_UNITY_PORTAL_CONTENT.renderChecklist],
    defaultTargets: [...DEFAULT_UNITY_PORTAL_CONTENT.defaultTargets],
  };

  if (!overrides || typeof overrides !== 'object') {
    return base;
  }

  const overridesObject = overrides as Record<string, unknown>;
  const templates = sanitizeUnityTemplates(overridesObject.templates);
  const pipeline = sanitizeUnityPipeline(overridesObject.pipelinePhases);
  const checklist = sanitizeUnityChecklist(overridesObject.renderChecklist);
  const targets = sanitizeUnityTargetIds(overridesObject.defaultTargets);

  if (templates.length > 0) {
    base.templates = templates;
  }

  if (pipeline.length > 0) {
    base.pipelinePhases = pipeline;
  }

  if (checklist.length > 0) {
    base.renderChecklist = checklist;
  }

  if (targets.length > 0) {
    base.defaultTargets = targets;
  }

  return base;
}
