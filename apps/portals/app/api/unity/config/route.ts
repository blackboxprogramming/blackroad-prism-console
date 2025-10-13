import { NextResponse } from 'next/server';

import { mergeUnityPortalContent } from '../../../../lib/unity/config';
import { resolveUnityExporterUrl } from '../../../../lib/unity/exporter';

interface OverridesResult {
  overrides: unknown;
  error: string | null;
}

function loadOverridesFromEnv(): OverridesResult {
  const raw = process.env.UNITY_PORTAL_CONFIG_JSON;
  if (!raw) {
    return { overrides: undefined, error: null };
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { overrides: parsed, error: null };
    }
    return { overrides: undefined, error: 'UNITY_PORTAL_CONFIG_JSON must be a JSON object.' };
  } catch (error) {
    console.error('Failed to parse UNITY_PORTAL_CONFIG_JSON', error);
    return { overrides: undefined, error: 'Unable to parse UNITY_PORTAL_CONFIG_JSON.' };
  }
}

export async function GET() {
  const { overrides, error } = loadOverridesFromEnv();
  const merged = mergeUnityPortalContent(overrides);
  const exporterUrl = resolveUnityExporterUrl(process.env.UNITY_EXPORTER_URL);

  return NextResponse.json({
    ok: true,
    config: {
      exporterUrl,
      templates: merged.templates,
      pipelinePhases: merged.pipelinePhases,
      renderChecklist: merged.renderChecklist,
      defaultTargets: merged.defaultTargets,
      targetOptions: merged.targetOptions,
    },
    meta: {
      overridesApplied: Boolean(overrides),
      overrideError: error,
    },
  });
}
