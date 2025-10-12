'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Topbar } from '../../components/ui/topbar';
import {
  DEFAULT_UNITY_PORTAL_CONTENT,
  sanitizeUnityChecklist,
  sanitizeUnityPipeline,
  sanitizeUnityTargetIds,
  sanitizeUnityTargetOptions,
  sanitizeUnityTemplates,
  type UnityPipelinePhase,
  type UnityTargetId,
  type UnityTargetOption,
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
  overridesActive: boolean;
};

type ExporterStatusState = {
  state: 'idle' | 'checking' | 'ready' | 'error';
  statusCode?: number;
  method?: string;
  path?: string;
  message?: string;
  checkedAt: number | null;
};

const HISTORY_STORAGE_KEY = 'unity-portal-history';
const HISTORY_LIMIT = 25;
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

function cloneDefaultTargetOptions(): UnityTargetOption[] {
  return DEFAULT_UNITY_PORTAL_CONTENT.targetOptions.map((option) => ({ ...option }));
}

function cloneDefaultTargets(targetOptionsOverride?: UnityTargetOption[]): BuildTarget[] {
  const allowed = targetOptionsOverride && targetOptionsOverride.length > 0 ? targetOptionsOverride : DEFAULT_UNITY_PORTAL_CONTENT.targetOptions;
  const sanitized = sanitizeUnityTargetIds(
    DEFAULT_UNITY_PORTAL_CONTENT.defaultTargets,
    allowed,
  ) as BuildTarget[];
  if (sanitized.length > 0) {
    return sanitized;
  }

  return allowed.length > 0 ? [(allowed[0].id as BuildTarget)] : [];
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

type ItemProgressState = {
  done: boolean;
  updatedAt: number | null;
};

const CHECKLIST_PROGRESS_STORAGE_KEY = 'unity-portal-checklist-progress';
const PIPELINE_PROGRESS_STORAGE_KEY = 'unity-portal-pipeline-progress';

function sanitizeProgressMap(value: unknown): Record<string, ItemProgressState> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const result: Record<string, ItemProgressState> = {};
  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, raw] of entries) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }

    const { done, updatedAt } = raw as { done?: unknown; updatedAt?: unknown };
    if (typeof done !== 'boolean') {
      continue;
    }

    const normalizedTimestamp =
      typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : null;

    result[key] = {
      done,
      updatedAt: normalizedTimestamp,
    };
  }

  return result;
}

function pruneProgressMap(
  progress: Record<string, ItemProgressState>,
  allowed: Iterable<string>,
): Record<string, ItemProgressState> {
  const allowedSet = new Set(allowed);
  if (allowedSet.size === 0) {
    return Object.keys(progress).length === 0 ? progress : {};
  }

  const next: Record<string, ItemProgressState> = {};
  for (const key of allowedSet) {
    if (key in progress) {
      next[key] = progress[key];
    }
  }

  if (Object.keys(next).length === Object.keys(progress).length) {
    let identical = true;
    for (const key of Object.keys(next)) {
      if (next[key] !== progress[key]) {
        identical = false;
        break;
      }
    }
    if (identical) {
      return progress;
    }
  }

  return next;
}

function makePipelineKey(phaseTitle: string, item: string) {
  return `${phaseTitle}::${item}`;
}

function formatProgressTimestamp(value: number | null): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return null;
  }
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
  const [targetOptions, setTargetOptions] = useState<UnityTargetOption[]>(() => cloneDefaultTargetOptions());
  const [renderChecklist, setRenderChecklist] = useState<string[]>(() => cloneDefaultChecklist());
  const [checklistProgress, setChecklistProgress] = useState<Record<string, ItemProgressState>>({});
  const [pipelineProgress, setPipelineProgress] = useState<Record<string, ItemProgressState>>({});
  const [defaultConfigTargets, setDefaultConfigTargets] = useState<BuildTarget[]>(() => cloneDefaultTargets());
  const [configState, setConfigState] = useState<ConfigState>({
    loading: true,
    error: null,
    warning: null,
    exporterUrl: UNITY_EXPORTER_DEFAULT_URL,
    overridesActive: false,
  });
  const [configRefreshedAt, setConfigRefreshedAt] = useState<number | null>(null);
  const [exporterStatus, setExporterStatus] = useState<ExporterStatusState>({ state: 'idle', checkedAt: null });

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
    [targetOptions],
  );
  const checklistKeys = useMemo(() => [...renderChecklist], [renderChecklist]);
  const checklistKeySet = useMemo(() => new Set(checklistKeys), [checklistKeys]);
  const pipelineKeys = useMemo(
    () =>
      pipelinePhases.flatMap((phase) =>
        phase.items.map((item) => makePipelineKey(phase.title, item)),
      ),
    [pipelinePhases],
  );
  const pipelineKeySet = useMemo(() => new Set(pipelineKeys), [pipelineKeys]);

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

      const optionsFromApi = sanitizeUnityTargetOptions(config.targetOptions);
      const nextTargetOptions = optionsFromApi.length > 0 ? optionsFromApi : cloneDefaultTargetOptions();
      setTargetOptions(nextTargetOptions);

      const checklistFromApi = sanitizeUnityChecklist(config.renderChecklist);
      setRenderChecklist(checklistFromApi.length > 0 ? checklistFromApi : cloneDefaultChecklist());

      const defaultsFromApi = sanitizeUnityTargetIds(config.defaultTargets, nextTargetOptions) as BuildTarget[];
      const resolvedDefaults =
        defaultsFromApi.length > 0 ? defaultsFromApi : cloneDefaultTargets(nextTargetOptions);
      setDefaultConfigTargets(resolvedDefaults);

      if (!hasCustomTargets.current || !configTargetsApplied.current) {
        setTargets(resolvedDefaults);
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
        overridesActive: Boolean(body?.meta?.overridesApplied),
      });
      setConfigRefreshedAt(Date.now());
    } catch (error) {
      console.error('Unity portal configuration fetch failed', error);
      if (!isMountedRef.current) {
        return;
      }
      const fallbackTargets = cloneDefaultTargets();
      setTargetOptions(cloneDefaultTargetOptions());
      setDefaultConfigTargets(fallbackTargets);
      if (!hasCustomTargets.current || !configTargetsApplied.current) {
        setTargets(fallbackTargets);
        configTargetsApplied.current = true;
      }
      setConfigState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load Unity portal configuration.',
        warning: null,
        exporterUrl: UNITY_EXPORTER_DEFAULT_URL,
        overridesActive: false,
      });
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedChecklist = window.localStorage.getItem(CHECKLIST_PROGRESS_STORAGE_KEY);
      if (storedChecklist) {
        const parsed = JSON.parse(storedChecklist);
        const sanitized = sanitizeProgressMap(parsed);
        if (Object.keys(sanitized).length > 0) {
          setChecklistProgress(sanitized);
        }
      }
    } catch (error) {
      console.error('Failed to load Unity checklist progress from storage', error);
    }

    try {
      const storedPipeline = window.localStorage.getItem(PIPELINE_PROGRESS_STORAGE_KEY);
      if (storedPipeline) {
        const parsed = JSON.parse(storedPipeline);
        const sanitized = sanitizeProgressMap(parsed);
        if (Object.keys(sanitized).length > 0) {
          setPipelineProgress(sanitized);
        }
      }
    } catch (error) {
      console.error('Failed to load Unity pipeline progress from storage', error);
    }
  }, []);

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
    setChecklistProgress((prev) => pruneProgressMap(prev, checklistKeySet));
  }, [checklistKeySet]);

  useEffect(() => {
    setPipelineProgress((prev) => pruneProgressMap(prev, pipelineKeySet));
  }, [pipelineKeySet]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (Object.keys(checklistProgress).length === 0) {
      window.localStorage.removeItem(CHECKLIST_PROGRESS_STORAGE_KEY);
      return;
    }

    try {
      window.localStorage.setItem(
        CHECKLIST_PROGRESS_STORAGE_KEY,
        JSON.stringify(checklistProgress),
      );
    } catch (error) {
      console.error('Failed to persist Unity checklist progress', error);
    }
  }, [checklistProgress]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (Object.keys(pipelineProgress).length === 0) {
      window.localStorage.removeItem(PIPELINE_PROGRESS_STORAGE_KEY);
      return;
    }

    try {
      window.localStorage.setItem(
        PIPELINE_PROGRESS_STORAGE_KEY,
        JSON.stringify(pipelineProgress),
      );
    } catch (error) {
      console.error('Failed to persist Unity pipeline progress', error);
    }
  }, [pipelineProgress]);

  useEffect(() => {
    if (templates.length === 0) {
      return;
    }

    setTemplate((current) =>
      templates.some((item) => item.id === current) ? current : templates[0].id,
    );
  }, [templates]);

  useEffect(() => {
    setExporterStatus({ state: 'idle', checkedAt: null });
  }, [configState.exporterUrl]);

  const checkExporterStatus = useCallback(async () => {
    setExporterStatus({ state: 'checking', checkedAt: null });
    try {
      const response = await fetch('/api/unity/exporter/status', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

      if (!payload || typeof payload !== 'object') {
        throw new Error(`Unexpected exporter status response (${response.status}).`);
      }

      const ok = payload.ok === true;
      const statusCode = typeof payload.status === 'number' ? payload.status : response.status;
      const method = typeof payload.method === 'string' ? payload.method : undefined;
      const path = typeof payload.path === 'string' ? payload.path : undefined;
      const rawMessage =
        (typeof payload.message === 'string' && payload.message.trim().length > 0
          ? payload.message.trim()
          : null) ||
        (typeof payload.error === 'string' && payload.error.trim().length > 0
          ? payload.error.trim()
          : null);

      const message = rawMessage
        ? rawMessage
        : ok
        ? `Exporter responded with HTTP ${statusCode}.`
        : `Exporter status check failed (${statusCode}).`;

      setExporterStatus({
        state: ok ? 'ready' : 'error',
        statusCode,
        method,
        path,
        message,
        checkedAt: Date.now(),
      });
    } catch (error) {
      setExporterStatus({
        state: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to reach the Unity exporter service.',
        checkedAt: Date.now(),
      });
    }
  }, []);

  const toggleTarget = (value: BuildTarget) => {
    hasCustomTargets.current = true;
    setTargets((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const toggleChecklistItem = useCallback(
    (item: string) => {
      if (!checklistKeySet.has(item)) {
        return;
      }

      setChecklistProgress((prev) => {
        const next = { ...prev };
        const previous = prev[item];
        const nextDone = !(previous?.done ?? false);
        if (nextDone) {
          next[item] = { done: true, updatedAt: Date.now() };
        } else {
          delete next[item];
        }
        return next;
      });
    },
    [checklistKeySet],
  );

  const togglePipelineItem = useCallback(
    (phaseTitle: string, item: string) => {
      const key = makePipelineKey(phaseTitle, item);
      if (!pipelineKeySet.has(key)) {
        return;
      }

      setPipelineProgress((prev) => {
        const next = { ...prev };
        const previous = prev[key];
        const nextDone = !(previous?.done ?? false);
        if (nextDone) {
          next[key] = { done: true, updatedAt: Date.now() };
        } else {
          delete next[key];
        }
        return next;
      });
    },
    [pipelineKeySet],
  );

  const handleResetChecklist = useCallback(() => {
    setChecklistProgress({});
  }, []);

  const handleResetPipeline = useCallback(() => {
    setPipelineProgress({});
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === template) ?? templates[0],
    [templates, template],
  );

  const checklistSummary = useMemo(() => {
    const total = renderChecklist.length;
    let complete = 0;
    for (const item of renderChecklist) {
      if (checklistProgress[item]?.done) {
        complete += 1;
      }
    }

    return { total, complete };
  }, [renderChecklist, checklistProgress]);

  const pipelineSummary = useMemo(() => {
    let total = 0;
    let complete = 0;

    for (const phase of pipelinePhases) {
      for (const item of phase.items) {
        total += 1;
        if (pipelineProgress[makePipelineKey(phase.title, item)]?.done) {
          complete += 1;
        }
      }
    }

    return { total, complete };
  }, [pipelinePhases, pipelineProgress]);

  const hasChecklistProgress = useMemo(
    () => Object.keys(checklistProgress).length > 0,
    [checklistProgress],
  );
  const hasPipelineProgress = useMemo(
    () => Object.keys(pipelineProgress).length > 0,
    [pipelineProgress],
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

  const exporterStatusMessage =
    exporterStatus.state === 'idle'
      ? null
      : exporterStatus.message ??
        (exporterStatus.state === 'ready'
          ? `Exporter responded with HTTP ${exporterStatus.statusCode ?? ''}.`
          : 'Exporter status check failed.');
  const exporterStatusMeta =
    exporterStatus.state === 'idle' || exporterStatus.checkedAt === null
      ? null
      : `Checked ${new Date(exporterStatus.checkedAt).toLocaleTimeString()}${
          exporterStatus.path
            ? ` • ${exporterStatus.method ?? 'GET'} ${exporterStatus.path}`
            : ''
        }`;
  const checkButtonLabel =
    exporterStatus.state === 'checking' ? 'Checking…' : 'Check connection';
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

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Exporter Endpoint</h2>
                  <p className="text-xs text-gray-400">Unity exporter proxy target for build submissions.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                  <Button
                    type="button"
                    onClick={() => {
                      void checkExporterStatus();
                    }}
                    disabled={configState.loading || exporterStatus.state === 'checking'}
                    className="bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-60"
                  >
                    {checkButtonLabel}
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
              {exporterStatusMessage && (
                <p
                  className={`text-xs ${
                    exporterStatus.state === 'ready' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {exporterStatusMessage}
                  {exporterStatusMeta && (
                    <span className="ml-2 text-gray-500">{exporterStatusMeta}</span>
                  )}
                </p>
              )}
              <div className="grid gap-4 border-t border-gray-800 pt-4 text-xs text-gray-300 sm:grid-cols-3">
                <div className="space-y-2">
                  <span className="font-semibold text-gray-200">Default targets</span>
                  {defaultConfigTargets.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {defaultConfigTargets.map((target) => (
                        <span
                          key={target}
                          className="rounded border border-gray-800 bg-gray-900/60 px-2 py-0.5 text-xs text-gray-200"
                        >
                          {targetLookup.get(target) ?? target}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500">No defaults configured.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="font-semibold text-gray-200">Templates</span>
                  <p className="text-[11px] text-gray-400">
                    {templates.length} available
                    {selectedTemplate ? ` • ${selectedTemplate.name}` : ''}
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="font-semibold text-gray-200">Config overrides</span>
                  <p className="text-[11px] text-gray-400">
                    {configState.overridesActive
                      ? 'Active via UNITY_PORTAL_CONFIG_JSON'
                      : 'Not configured'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="space-y-3 p-4">
              <div>
                <h2 className="text-lg font-semibold">Template Presets</h2>
                <p className="text-xs text-gray-400">Review Unity starter scenes before requesting exports.</p>
              </div>
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500">No templates available.</p>
              ) : (
                <ul className="space-y-3 text-sm text-gray-300">
                  {templates.map((item) => {
                    const isSelected = item.id === template;
                    return (
                      <li
                        key={item.id}
                        className="rounded border border-gray-800 bg-gray-900/50 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-100">{item.name}</span>
                          {isSelected && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#FFB000]">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{item.description}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Production Pipeline</h2>
              <p className="text-xs text-gray-400">Track each step as you prepare builds for export.</p>
            </div>
            {pipelineSummary.total > 0 && (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>
                  {pipelineSummary.complete} / {pipelineSummary.total} complete
                </span>
                <Button
                  type="button"
                  onClick={handleResetPipeline}
                  disabled={!hasPipelineProgress}
                  className="bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pipelinePhases.map((phase) => {
              const phaseComplete = phase.items.reduce((count, item) => {
                const key = makePipelineKey(phase.title, item);
                return pipelineProgress[key]?.done ? count + 1 : count;
              }, 0);

              return (
                <Card key={phase.title} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{phase.title}</h3>
                    <span className="text-[11px] text-gray-400">
                      {phaseComplete}/{phase.items.length} done
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {phase.items.map((item) => {
                      const key = makePipelineKey(phase.title, item);
                      const entry = pipelineProgress[key];
                      const done = entry?.done ?? false;
                      const timestamp = formatProgressTimestamp(entry?.updatedAt ?? null);

                      return (
                        <li
                          key={key}
                          className={`rounded border px-3 py-2 text-sm transition ${
                            done
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                              : 'border-gray-800 bg-gray-900/60 text-gray-300'
                          }`}
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[#FFB000]"
                              checked={done}
                              onChange={() => togglePipelineItem(phase.title, item)}
                            />
                            <span
                              className={`flex-1 leading-relaxed ${
                                done
                                  ? 'text-emerald-50 line-through decoration-emerald-300/60'
                                  : 'text-gray-200'
                              }`}
                            >
                              {item}
                            </span>
                          </label>
                          {done && timestamp && (
                            <p className="mt-1 pl-7 text-[11px] text-gray-500">Checked {timestamp}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Render Readiness Checklist</h2>
                <p className="text-sm text-gray-400">Confirm these Unity-specific tasks before promoting a build.</p>
              </div>
              {checklistSummary.total > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    {checklistSummary.complete} / {checklistSummary.total} done
                  </span>
                  <Button
                    type="button"
                    onClick={handleResetChecklist}
                    disabled={!hasChecklistProgress}
                    className="bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
            {renderChecklist.length === 0 ? (
              <p className="text-sm text-gray-500">No readiness tasks configured.</p>
            ) : (
              <ul className="space-y-2">
                {renderChecklist.map((item) => {
                  const entry = checklistProgress[item];
                  const done = entry?.done ?? false;
                  const timestamp = formatProgressTimestamp(entry?.updatedAt ?? null);

                  return (
                    <li
                      key={item}
                      className={`rounded border px-3 py-2 text-sm transition ${
                        done
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                          : 'border-gray-800 bg-gray-900/60 text-gray-300'
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-[#FFB000]"
                          checked={done}
                          onChange={() => toggleChecklistItem(item)}
                        />
                        <span
                          className={`flex-1 leading-relaxed ${
                            done
                              ? 'text-emerald-50 line-through decoration-emerald-300/60'
                              : 'text-gray-200'
                          }`}
                        >
                          {item}
                        </span>
                      </label>
                      {done && timestamp && (
                        <p className="mt-1 pl-7 text-[11px] text-gray-500">Checked {timestamp}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
