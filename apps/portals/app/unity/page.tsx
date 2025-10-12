'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Topbar } from '../../components/ui/topbar';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const templates = [
  {
    id: 'sandbox',
    name: 'Sandbox HDRP World',
    description:
      'High Definition Render Pipeline scene with chunk streaming, volumetrics, and atmospheric systems aligned to the shared asset library.',
  },
  {
    id: 'expedition',
    name: 'Expedition Story Track',
    description:
      'Narrative-driven template with day/night cycles, cinematic camera rigs, and dialogue hooks ready for AutoNovel story beats.',
  },
  {
    id: 'lab',
    name: 'Simulation Lab',
    description:
      'Deterministic physics sandbox tuned for engineering and STEM scenarios with profiler markers baked in.',
  },
];

const targetOptions = [
  { id: 'windows', label: 'Windows (Win64)' },
  { id: 'mac', label: 'macOS (Intel/Apple)' },
  { id: 'linux', label: 'Linux (x86_64)' },
  { id: 'webgl', label: 'WebGL' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
] as const;

type BuildTarget = (typeof targetOptions)[number]['id'];

type BuildRecord = {
  id: string;
  project: string;
  template: string;
  targets: BuildTarget[];
  status: 'ready' | 'failed';
  artifact?: string;
  notes?: string;
  message?: string;
  timestamp: number;
};

const pipelinePhases = [
  {
    title: 'Template Curation',
    items: [
      'Keep HDRP baseline scenes in sync with shared texture atlases and shader graphs.',
      'Validate voxel mesh plugins, animation rigs, and StoryTrack bindings before each release.',
    ],
  },
  {
    title: 'Build & Export',
    items: [
      'Automate Unity CLI builds per target and package artifacts in the downloads vault.',
      'Capture profiler traces and frame grabs for regression comparison against Unreal parity goals.',
    ],
  },
  {
    title: 'Quality Gates',
    items: [
      'Hold frame timing budgets under 12ms on CPU/GPU for 60 FPS delivery tiers.',
      'Audit volumetric lighting, water shaders, and atmospheric profiles for parity across environments.',
    ],
  },
];

const renderChecklist = [
  'HDRP volumetrics tuned per performance tier with Enlighten GI probes.',
  'ChunkRenderSystem streaming jobs budgeted with profiler markers.',
  'Planar reflections active on water materials with fallback path for WebGL.',
  'Shared Substance texture atlases validated for consistent texel density.',
];

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function UnityPortalPage() {
  const [projectName, setProjectName] = useState('');
  const [template, setTemplate] = useState(templates[0]?.id ?? 'sandbox');
  const [targets, setTargets] = useState<BuildTarget[]>(['windows', 'webgl']);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [history, setHistory] = useState<BuildRecord[]>([]);

  const toggleTarget = (value: BuildTarget) => {
    setTargets((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === template) ?? templates[0],
    [template],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = projectName.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName) {
      setAlert({ type: 'error', message: 'Project name is required to request an export.' });
      return;
    }

    if (targets.length === 0) {
      setAlert({ type: 'error', message: 'Select at least one build target.' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const response = await fetch('/api/unity/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: trimmedName,
          template,
          targets,
          notes: trimmedNotes || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok === false) {
        const message = payload?.error || 'Unity exporter rejected the request.';
        throw new Error(message);
      }

      const record: BuildRecord = {
        id: makeId(),
        project: trimmedName,
        template,
        targets,
        status: 'ready',
        artifact: payload?.path || payload?.exporter?.path,
        notes: trimmedNotes || undefined,
        message: payload?.message || undefined,
        timestamp: Date.now(),
      };

      setHistory((prev) => [record, ...prev]);
      setAlert({
        type: 'success',
        message:
          payload?.message ||
          (record.artifact
            ? `Export completed. Artifact ready at ${record.artifact}.`
            : 'Export completed. Retrieve the artifact from the Unity exporter downloads directory.'),
      });

      setProjectName('');
      setNotes('');
    } catch (error) {
      console.error('Unity export request failed', error);
      setAlert({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Something went wrong while contacting the Unity exporter.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <Topbar title="Unity Portal" />
      <main className="flex-1 space-y-8 p-6">
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold">Unity Production Control</h1>
          <p className="max-w-3xl text-sm text-gray-300">
            Coordinate Unity build exports, ensure render parity with Unreal targets, and distribute HDRP-ready templates to the broader BlackRoad ecosystem. Use the workflow below to capture artifacts and keep nightly automation on track.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {pipelinePhases.map((phase) => (
              <Card key={phase.title} className="space-y-3 p-4">
                <h2 className="text-lg font-semibold">{phase.title}</h2>
                <ul className="space-y-2 text-sm text-gray-300">
                  {phase.items.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="space-y-6 p-6">
            <div>
              <h2 className="text-2xl font-semibold">Request an Export</h2>
              <p className="mt-1 text-sm text-gray-400">
                Choose a template, targets, and optional notes. The exporter writes build artifacts to its configured downloads directory.
              </p>
            </div>

            {alert && (
              <div
                className={`rounded border px-3 py-2 text-sm ${
                  alert.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                }`}
              >
                {alert.message}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200" htmlFor="projectName">
                  Project name
                </label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. aurora-sandbox"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200" htmlFor="template">
                  Template
                </label>
                <select
                  id="template"
                  value={template}
                  onChange={(event) => setTemplate(event.target.value)}
                  disabled={submitting}
                  className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFB000]"
                >
                  {templates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="text-xs text-gray-400">{selectedTemplate.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-200">Targets</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {targetOptions.map((option) => {
                    const checked = targets.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between rounded border px-3 py-2 text-sm transition ${
                          checked ? 'border-[#FFB000]/60 bg-gray-900' : 'border-gray-800 bg-gray-900/40'
                        }`}
                      >
                        <span>{option.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTarget(option.id)}
                          className="h-4 w-4 accent-[#FFB000]"
                          disabled={submitting}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200" htmlFor="notes">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Deployment instructions, scene variations, or QA reminders"
                  className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFB000]"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting} className="bg-[#FFB000] text-black hover:bg-[#e49c00]">
                  {submitting ? 'Submitting…' : 'Request Export'}
                </Button>
                <p className="text-xs text-gray-400">
                  The exporter service must be reachable at the configured URL for this request to complete.
                </p>
              </div>
            </form>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold">Recent Export Activity</h2>
              <p className="text-sm text-gray-400">
                Track exporter responses, artifacts, and notes for each build request.
              </p>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No exports requested yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((entry) => (
                  <li key={entry.id} className="rounded border border-gray-800 bg-gray-900/60 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-gray-100">{entry.project}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                      <span className="rounded bg-gray-800 px-2 py-0.5">Template: {entry.template}</span>
                      <span className="rounded bg-gray-800 px-2 py-0.5">
                        Targets: {entry.targets.join(', ')}
                      </span>
                    </div>
                    {entry.artifact && (
                      <div className="mt-2 text-xs text-[#FFB000]">
                        Artifact: {entry.artifact}
                      </div>
                    )}
                    {entry.message && (
                      <div className="mt-2 text-xs text-gray-300">{entry.message}</div>
                    )}
                    {entry.notes && (
                      <div className="mt-2 text-xs text-gray-400">Notes: {entry.notes}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold">Render Readiness Checklist</h2>
              <p className="text-sm text-gray-400">Confirm these Unity-specific tasks before promoting a build.</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              {renderChecklist.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
}

