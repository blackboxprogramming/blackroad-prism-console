'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { FlagRule, FlagsDoc } from '@/packages/flags/types';
import { saveFlagsAction } from './actions';

const { isOn } = require('@/packages/flags/eval');

type Props = {
  initialDoc: FlagsDoc;
  paramName: string;
};

type DraftDoc = FlagsDoc & { version: number };

const defaultRule: FlagRule = {
  state: 'off',
  percent: 0,
  segments: [],
  startAt: null,
  endAt: null,
};

function toInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function FlagsAdminClient({ initialDoc, paramName }: Props) {
  const [doc, setDoc] = useState<DraftDoc>({
    features: initialDoc.features || {},
    segments: initialDoc.segments || {},
    version: initialDoc.version ?? 0,
  });
  const [savedDoc, setSavedDoc] = useState<DraftDoc>({
    features: initialDoc.features || {},
    segments: initialDoc.segments || {},
    version: initialDoc.version ?? 0,
  });
  const [selectedFeature, setSelectedFeature] = useState<string>(
    Object.keys(initialDoc.features || {})[0] || ''
  );
  const [previewUserId, setPreviewUserId] = useState('');
  const [previewEmail, setPreviewEmail] = useState('');
  const [previewReqId, setPreviewReqId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDoc({
      features: initialDoc.features || {},
      segments: initialDoc.segments || {},
      version: initialDoc.version ?? 0,
    });
    setSavedDoc({
      features: initialDoc.features || {},
      segments: initialDoc.segments || {},
      version: initialDoc.version ?? 0,
    });
    setSelectedFeature(Object.keys(initialDoc.features || {})[0] || '');
  }, [initialDoc.features, initialDoc.segments, initialDoc.version]);

  const featureKeys = useMemo(
    () => Object.keys(doc.features || {}).sort(),
    [doc.features]
  );

  useEffect(() => {
    if (!featureKeys.includes(selectedFeature)) {
      setSelectedFeature(featureKeys[0] || '');
    }
  }, [featureKeys, selectedFeature]);

  const isDirty = useMemo(
    () => JSON.stringify(doc) !== JSON.stringify(savedDoc),
    [doc, savedDoc]
  );

  const previewResult = useMemo(() => {
    if (!selectedFeature) return null;
    return isOn(doc, selectedFeature, {
      userId: previewUserId || undefined,
      email: previewEmail || undefined,
      reqId: previewReqId || undefined,
    });
  }, [doc, selectedFeature, previewEmail, previewReqId, previewUserId]);

  function updateFeature(key: string, patch: Partial<FlagRule>) {
    setDoc((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: {
          ...defaultRule,
          ...(prev.features[key] || {}),
          ...patch,
        },
      },
    }));
  }

  function updateSegments(key: string, value: string) {
    const entries = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setDoc((prev) => ({
      ...prev,
      segments: {
        ...(prev.segments || {}),
        [key]: entries,
      },
    }));
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        const next = await saveFlagsAction(doc);
        setDoc(next);
        setSavedDoc(next);
        setMessage('Flags saved and version bumped.');
      } catch (error) {
        console.error('Failed to save flags', error);
        setMessage('Failed to save flags. Check server logs.');
      }
    });
  }

  function handleReset() {
    setDoc(savedDoc);
    setMessage('Changes reverted.');
  }

  function addFeature() {
    const key = window.prompt('Feature key (e.g., prism.github.tiles)');
    if (!key) return;
    setDoc((prev) => {
      if (prev.features[key]) return prev;
      return {
        ...prev,
        features: {
          ...prev.features,
          [key]: { ...defaultRule },
        },
      };
    });
    setSelectedFeature(key);
  }

  function removeFeature(key: string) {
    if (!window.confirm(`Remove feature ${key}?`)) return;
    setDoc((prev) => {
      const nextFeatures = { ...prev.features };
      delete nextFeatures[key];
      return {
        ...prev,
        features: nextFeatures,
      };
    });
  }

  function addSegment() {
    const key = window.prompt('Segment key (e.g., staff)');
    if (!key) return;
    setDoc((prev) => ({
      ...prev,
      segments: {
        ...(prev.segments || {}),
        [key]: [],
      },
    }));
  }

  function removeSegment(key: string) {
    if (!window.confirm(`Remove segment ${key}?`)) return;
    setDoc((prev) => {
      const nextSegments = { ...(prev.segments || {}) };
      delete nextSegments[key];
      return {
        ...prev,
        segments: nextSegments,
      };
    });
  }

  return (
    <div className="space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Feature Flags</h1>
        <p className="text-sm text-gray-500">
          Parameter: <code>{paramName}</code> · Version {doc.version}
        </p>
        {message ? <p className="text-sm text-blue-600">{message}</p> : null}
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addFeature}
            className="rounded bg-black px-3 py-1 text-white"
          >
            Add feature
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || isPending}
            className="rounded bg-gray-200 px-3 py-1 text-gray-800 disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 font-medium">Feature</th>
                <th className="px-3 py-2 font-medium">State</th>
                <th className="px-3 py-2 font-medium">Percent</th>
                <th className="px-3 py-2 font-medium">Segments</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">End</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {featureKeys.length === 0 ? (
                <tr>
                  <td className="px-3 py-4" colSpan={7}>
                    No features configured.
                  </td>
                </tr>
              ) : (
                featureKeys.map((key) => {
                  const rule = doc.features[key] || { ...defaultRule };
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedFeature(key)}
                          className={`text-left font-mono text-sm ${
                            selectedFeature === key
                              ? 'text-blue-600'
                              : 'text-gray-800'
                          }`}
                        >
                          {key}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={rule.state}
                          onChange={(event) =>
                            updateFeature(key, {
                              state: event.target.value as FlagRule['state'],
                            })
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1"
                        >
                          <option value="off">off</option>
                          <option value="on">on</option>
                          <option value="conditional">conditional</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={rule.percent ?? 0}
                          onChange={(event) =>
                            updateFeature(key, {
                              percent: Number(event.target.value),
                            })
                          }
                          className="w-24 rounded border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={(rule.segments || []).join(', ')}
                          onChange={(event) =>
                            updateFeature(key, {
                              segments: event.target.value
                                .split(',')
                                .map((v) => v.trim())
                                .filter(Boolean),
                            })
                          }
                          className="w-64 rounded border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="datetime-local"
                          value={toInputValue(rule.startAt ?? null)}
                          onChange={(event) =>
                            updateFeature(key, {
                              startAt: fromInputValue(event.target.value),
                            })
                          }
                          className="w-48 rounded border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="datetime-local"
                          value={toInputValue(rule.endAt ?? null)}
                          onChange={(event) =>
                            updateFeature(key, {
                              endAt: fromInputValue(event.target.value),
                            })
                          }
                          className="w-48 rounded border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeFeature(key)}
                          className="text-sm text-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Segments</h2>
          <button
            type="button"
            onClick={addSegment}
            className="rounded bg-black px-3 py-1 text-white"
          >
            Add segment
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(doc.segments || {}).length === 0 ? (
            <p className="text-sm text-gray-500">No segments configured.</p>
          ) : (
            Object.entries(doc.segments || {}).map(([key, entries]) => (
              <div key={key} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm">{key}</h3>
                  <button
                    type="button"
                    onClick={() => removeSegment(key)}
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={(entries || []).join(', ')}
                  onChange={(event) => updateSegments(key, event.target.value)}
                  className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  placeholder="alexa@..., qa@..., @blackroad.io"
                />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Preview</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded border border-gray-200 p-3">
            <label className="block text-xs uppercase tracking-wide text-gray-500">
              Feature
            </label>
            <select
              value={selectedFeature}
              onChange={(event) => setSelectedFeature(event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1"
            >
              <option value="">Select a feature</option>
              {featureKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 rounded border border-gray-200 p-3">
            <label className="block text-xs uppercase tracking-wide text-gray-500">
              User ID
            </label>
            <input
              type="text"
              value={previewUserId}
              onChange={(event) => setPreviewUserId(event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1"
            />
            <label className="block text-xs uppercase tracking-wide text-gray-500">
              Email
            </label>
            <input
              type="email"
              value={previewEmail}
              onChange={(event) => setPreviewEmail(event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1"
            />
            <label className="block text-xs uppercase tracking-wide text-gray-500">
              Request ID
            </label>
            <input
              type="text"
              value={previewReqId}
              onChange={(event) => setPreviewReqId(event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1"
            />
          </div>
        </div>
        <div className="rounded border border-dashed border-gray-300 p-3 text-sm">
          {selectedFeature ? (
            <div className="flex items-center justify-between">
              <span className="font-mono">{selectedFeature}</span>
              <span
                className={`font-semibold ${
                  previewResult ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {previewResult ? 'ON' : 'OFF'}
              </span>
            </div>
          ) : (
            <p className="text-gray-500">Select a feature to preview.</p>
          )}
        </div>
      </section>
    </div>
  );
}
