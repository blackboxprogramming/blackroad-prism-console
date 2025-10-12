'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Topbar } from '../../components/ui/topbar';
import {
  DEFAULT_UNITY_PORTAL_CONTENT,
  UNITY_TARGET_OPTIONS,
  sanitizeUnityChecklist,
  sanitizeUnityPipeline,
  sanitizeUnityTargetIds,
  sanitizeUnityTemplates,
  type UnityPipelinePhase,
  type UnityTargetId,
  type UnityTemplate,
} from '../../lib/unity/config';
import { UNITY_EXPORTER_DEFAULT_URL } from '../../lib/unity/exporter';

type BuildTarget = UnityTargetId;

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

type ConfigState = {
  loading: boolean;
  error: string | null;
  warning: string | null;
  exporterUrl: string;
};

const HISTORY_STORAGE_KEY = 'unity-portal-history';
const HISTORY_LIMIT = 25;
const targetOptions = UNITY_TARGET_OPTIONS;
const defaultTemplateId = DEFAULT_UNITY_PORTAL_CONTENT.templates[0]?.id ?? 'sandbox';

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function cloneDefaultTemplates(): UnityTemplate[] {
  return DEFAULT_UNITY_PORTAL_CONTENT.templates.map((template) => ({ ...template }));
}

function cloneDefaultPipeline(): UnityPipelinePhase[] {
  return DEFAULT_UNITY_PORTAL_CONTENT.pipelinePhases.map((phase) => ({
    title: phase.title,
    items: [...phase.items],
  }));
}

function cloneDefaultChecklist(): string[] {
  return [...DEFAULT_UNITY_PORTAL_CONTENT.renderChecklist];
}

function cloneDefaultTargets(): BuildTarget[] {
  return [...DEFAULT_UNITY_PORTAL_CONTENT.defaultTargets];
}

function sanitizeHistoryRecords(value: unknown): BuildRecord[] {
  if (!Array.isArray(value)) return [];

  const records: BuildRecord[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;

    const { id, project, template, targets, status, artifact, notes, message, timestamp } = entry as Record<string, unknown>;

    if (!isNonEmptyString(id) || !isNonEmptyString(project) || !isNonEmptyString(template)) {
      continue;
    }

    if (status !== 'ready' && status !== 'failed') {
      continue;
    }

    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
      continue;
    }

    const sanitizedTargets = sanitizeUnityTargetIds(targets);
    if (sanitizedTargets.length === 0) {
      continue;
    }

    records.push({
      id: id.trim(),
      project: project.trim(),
      template: template.trim(),
      targets: sanitizedTargets as BuildTarget[],
      status,
      artifact: isNonEmptyString(artifact) ? artifact.trim() : undefined,
      notes: isNonEmptyString(notes) ? notes.trim() : undefined,
      message: isNonEmptyString(message) ? message.trim() : undefined,
      timestamp,
    });
  }

  return records;
}

export default function UnityPortalPage() {
  const [projectName, setProjectName] = useState('');
  const [template, setTemplate] = useState(defaultTemplateId);
  const [targets, setTargets] = useState<BuildTarget[]>(() => cloneDefaultTargets());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [history, setHistory] = useState<BuildRecord[]>([]);
  const [templates, setTemplates] = useState<UnityTemplate[]>(() => cloneDefaultTemplates());
  const [pipelinePhases, setPipelinePhases] = useState<UnityPipelinePhase[]>(() => cloneDefaultPipeline());
  const [renderChecklist, setRenderChecklist] = useState<string[]>(() => cloneDefaultChecklist());
  const [configState, setConfigState] = useState<ConfigState>({
    loading: true,
    error: null,
    warning: null,
    exporterUrl: UNITY_EXPORTER_DEFAULT_URL,
  });
  const [configRefreshedAt, setConfigRefreshedAt] = useState<number | null>(null);

  const hasCustomTargets = useRef(false);
  const configTargetsApplied = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const templateLookup = useMemo(
    () => new Map(templates.map((item) => [item.id, item.name])),
    [templates],
  );
  const targetLookup = useMemo(
    () => new Map(targetOptions.map((item) => [item.id, item.label])),
    [],
  );

  const loadConfig = useCallback(async () => {
    setConfigState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/unity/config', { cache: 'no-store' });
      const body = await response.json().catch(() => null);

      if (!isMountedRef.current) {
        return;
      }

      if (!response.ok || !body || body.ok === false) {
        const message =
          (body && typeof body.error === 'string' && body.error.trim().length > 0)
            ? body.error
            : `Failed to load Unity portal configuration (${response.status}).`;
        throw new Error(message);
      }

      const config = body.config ?? {};

      const templatesFromApi = sanitizeUnityTemplates(config.templates);
      setTemplates(templatesFromApi.length > 0 ? templatesFromApi : cloneDefaultTemplates());

      const pipelineFromApi = sanitizeUnityPipeline(config.pipelinePhases);
      setPipelinePhases(pipelineFromApi.length > 0 ? pipelineFromApi : cloneDefaultPipeline());

      const checklistFromApi = sanitizeUnityChecklist(config.renderChecklist);
      setRenderChecklist(checklistFromApi.length > 0 ? checklistFromApi : cloneDefaultChecklist());

      const defaultTargets = sanitizeUnityTargetIds(config.defaultTargets) as BuildTarget[];
      if (defaultTargets.length > 0 && !hasCustomTargets.current) {
        setTargets(defaultTargets);
        configTargetsApplied.current = true;
      } else if (!configTargetsApplied.current) {
        setTargets(cloneDefaultTargets());
        configTargetsApplied.current = true;
      }

      const exporterUrl =
        typeof config.exporterUrl === 'string' && config.exporterUrl.trim().length > 0
          ? config.exporterUrl.trim()
          : UNITY_EXPORTER_DEFAULT_URL;

      const overrideWarning =
        body?.meta && typeof body.meta.overrideError === 'string' && body.meta.overrideError.trim().length > 0
          ? body.meta.overrideError.trim()
          : null;

      setConfigState({
        loading: false,
        error: null,
        warning: overrideWarning,
        exporterUrl,
      });
      setConfigRefreshedAt(Date.now());
    } catch (error) {
      console.error('Unity portal configuration fetch failed', error);
      if (!isMountedRef.current) {
        return;
      }
      setConfigState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load Unity portal configuration.',
        warning: null,
        exporterUrl: UNITY_EXPORTER_DEFAULT_URL,
      });
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const sanitized = sanitizeHistoryRecords(parsed);
      if (sanitized.length > 0) {
        setHistory(sanitized.slice(0, HISTORY_LIMIT));
      }
    } catch (error) {
      console.error('Failed to load Unity export history from storage', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (history.length === 0) {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
      return;
    }

    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to persist Unity export history', error);
    }
  }, [history]);

  useEffect(() => {
    if (templates.length === 0) {
      return;
    }

    setTemplate((current) =>
      templates.some((item) => item.id === current) ? current : templates[0].id,
    );
  }, [templates]);

  const toggleTarget = (value: BuildTarget) => {
    hasCustomTargets.current = true;
    setTargets((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === template) ?? templates[0],
    [templates, template],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = projectName.trim();
    const trimmedNotes = notes.trim();
    const requestTargets = [...targets];

    if (!trimmedName) {
      setAlert({ type: 'error', message: 'Project name is required to request an export.' });
      return;
    }

    if (requestTargets.length === 0) {
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
          targets: requestTargets,
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
        targets: requestTargets,
        status: 'ready',
        artifact: payload?.path || payload?.exporter?.path,
        notes: trimmedNotes || undefined,
        message: payload?.message || undefined,
        timestamp: Date.now(),
      };

      setHistory((prev) => [record, ...prev].slice(0, HISTORY_LIMIT));
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
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while contacting the Unity exporter.';
      setAlert({
        type: 'error',
        message,
      });
      setHistory((prev) =>
        [
          {
            id: makeId(),
            project: trimmedName,
            template,
            targets: requestTargets,
            status: 'failed',
            notes: trimmedNotes || undefined,
            message,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, HISTORY_LIMIT),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const configStatus = configState.loading
    ? {
        label: 'Checking',
        className: 'border border-gray-700 bg-gray-900/60 text-gray-300',
      }
    : configState.error
    ? {
        label: 'Unavailable',
        className: 'border border-rose-500/40 bg-rose-500/10 text-rose-300',
      }
    : configState.warning
    ? {
        label: 'Partial',
        className: 'border border-amber-400/40 bg-amber-400/10 text-amber-200',
      }
    : {
        label: 'Ready',
        className: 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
      };
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <Topbar title="Unity Portal" />
      <main className="flex-1 space-y-8 p-6">
        <section className="space-y-4">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Unity Production Control</h1>
            <p className="max-w-3xl text-sm text-gray-300">
              Coordinate Unity build exports, ensure render parity with Unreal targets, and distribute HDRP-ready templates to the broader BlackRoad ecosystem. Use the workflow below to capture artifacts and keep nightly automation on track.
            </p>
          </div>

          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Exporter Endpoint</h2>
                <p className="text-xs text-gray-400">Unity exporter proxy target for build submissions.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-1 text-xs font-semibold ${configStatus.className}`}>
                  {configStatus.label}
                </span>
                <Button
                  type="button"
                  onClick={() => {
                    void loadConfig();
                  }}
                  disabled={configState.loading}
                  className="bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                >
                  Refresh
                </Button>
              </div>
            </div>
            <p className="break-all text-sm text-gray-300">{configState.exporterUrl}</p>
            {configState.loading ? (
              <p className="text-xs text-gray-500">Loading configuration…</p>
            ) : configState.error ? (
              <p className="text-xs text-rose-400">{configState.error}</p>
            ) : (
              <p className="text-xs text-gray-500">
                {configRefreshedAt
                  ? `Updated ${new Date(configRefreshedAt).toLocaleTimeString()}`
                  : 'Using default Unity portal settings.'}
              </p>
            )}
            {configState.warning && !configState.error && (
              <p className="text-xs text-amber-300">{configState.warning}</p>
            )}
          </Card>

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Recent Export Activity</h2>
                <p className="text-sm text-gray-400">
                  Track exporter responses, artifacts, and notes for each build request. Entries persist locally for quick reference.
                </p>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs font-medium text-gray-400 transition hover:text-gray-200"
                >
                  Clear history
                </button>
              )}
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
                      <span className="rounded bg-gray-800 px-2 py-0.5">
                        Template: {templateLookup.get(entry.template) ?? entry.template}
                      </span>
                      <span className="rounded bg-gray-800 px-2 py-0.5">
                        Targets{' '}
                        {entry.targets
                          .map((target) => targetLookup.get(target) ?? target)
                          .join(', ')}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 font-medium ${
                          entry.status === 'ready'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {entry.status === 'ready' ? 'Success' : 'Failed'}
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
