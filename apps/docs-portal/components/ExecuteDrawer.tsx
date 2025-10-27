"use client";

import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildExecutionRequest } from "@/lib/execution";
import type { RunbookRecord } from "@/lib/runbook-data";

interface ExecutionState {
  status: "idle" | "pending" | "success" | "error";
  message?: string;
  runId?: string;
}

const STORAGE_KEY = (id: string) => `docs-exec-pref.${id}`;

function loadPreferences(id: string): {
  variables: Record<string, string>;
  rememberToken: boolean;
  token?: string;
} {
  if (typeof window === "undefined") return { variables: {}, rememberToken: false };
  const stored = window.localStorage.getItem(STORAGE_KEY(id));
  if (!stored) return { variables: {}, rememberToken: false };
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Unable to parse runbook preferences", error);
    return { variables: {}, rememberToken: false };
  }
}

function persistPreferences(
  id: string,
  variables: Record<string, string>,
  rememberToken: boolean,
  token?: string
) {
  if (typeof window === "undefined") return;
  const payload = {
    variables,
    rememberToken,
    token: rememberToken ? token : undefined
  };
  window.localStorage.setItem(STORAGE_KEY(id), JSON.stringify(payload));
}

export function ExecuteDrawer({ runbook }: { runbook: RunbookRecord }) {
  const [open, setOpen] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const [rememberToken, setRememberToken] = useState(false);
  const [dryRun, setDryRun] = useState(runbook.execution.dryRunSupported);
  const [state, setState] = useState<ExecutionState>({ status: "idle" });

  useEffect(() => {
    if (!open) return;
    const prefs = loadPreferences(runbook.id);
    const defaults = runbook.execution.variables.reduce((acc, variable) => {
      acc[variable.name] = variable.default?.toString() ?? "";
      return acc;
    }, {} as Record<string, string>);
    setVariables({
      ...defaults,
      ...prefs.variables
    });
    setRememberToken(prefs.rememberToken ?? false);
    if (prefs.token) {
      setToken(prefs.token);
    }
  }, [open, runbook]);

  useEffect(() => {
    if (!open) return;
    persistPreferences(runbook.id, variables, rememberToken, token);
  }, [variables, rememberToken, token, runbook.id, open]);

  const payloadPreview = useMemo(
    () => ({
      workflowName: runbook.execution.workflowName,
      version: runbook.execution.version,
      input: variables,
      dryRun: dryRun ? true : undefined
    }),
    [variables, dryRun, runbook.execution.workflowName, runbook.execution.version]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "pending" });
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "";
    if (!gateway) {
      setState({ status: "error", message: "Gateway base URL is not configured." });
      return;
    }
    if (!token) {
      setState({ status: "error", message: "Bearer token is required." });
      return;
    }

    try {
      const request = buildExecutionRequest(runbook, variables, token, gateway, dryRun);
      const response = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body)
      });
      if (!response.ok) {
        const text = await response.text();
        setState({ status: "error", message: `Gateway responded with ${response.status}: ${text}` });
        return;
      }
      const json = await response.json();
      setState({ status: "success", message: "Execution started", runId: json.runId ?? json.id });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to execute runbook"
      });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="button-primary" type="button">
          <span className="flex items-center gap-2">
            <Play size={16} /> Execute runbook
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/70 backdrop-blur" />
        <Dialog.Content className="fixed inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-slate-950 p-6 shadow-2xl">
          <Dialog.Title className="text-2xl font-semibold text-slate-100">Execute {runbook.title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-slate-400">
            Provide the variables and token required to execute this workflow via RoadGlitch.
          </Dialog.Description>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-slate-200">Variables</legend>
              {runbook.execution.variables.length === 0 ? (
                <p className="text-sm text-slate-400">No variables defined for this runbook.</p>
              ) : (
                runbook.execution.variables.map((variable) => (
                  <label key={variable.name} className="flex flex-col gap-1 text-sm text-slate-200">
                    {variable.name}
                    <input
                      required={variable.required}
                      value={variables[variable.name] ?? ""}
                      onChange={(event) =>
                        setVariables((current) => ({ ...current, [variable.name]: event.target.value }))
                      }
                      placeholder={variable.description ?? ""}
                      className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                    {variable.description ? (
                      <span className="text-xs text-slate-400">{variable.description}</span>
                    ) : null}
                  </label>
                ))
              )}
            </fieldset>
            <label className="flex flex-col gap-1 text-sm text-slate-200">
              Bearer token
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={rememberToken}
                onChange={(event) => setRememberToken(event.target.checked)}
              />
              Remember token locally
            </label>
            {runbook.execution.dryRunSupported ? (
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
                Dry run (no side effects)
              </label>
            ) : null}
            <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-400">
              <h3 className="text-sm font-semibold text-slate-200">Payload preview</h3>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(payloadPreview, null, 2)}</pre>
            </section>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className={clsx("button-primary", state.status === "pending" && "opacity-70")}
                disabled={state.status === "pending"}
              >
                <span className="flex items-center gap-2">
                  <Play size={16} />
                  {state.status === "pending" ? "Executing..." : "Send to RoadGlitch"}
                </span>
              </button>
              <Dialog.Close type="button" className="text-sm text-slate-400">
                Cancel
              </Dialog.Close>
            </div>
            {state.status === "success" ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Execution started. Run ID: <strong>{state.runId ?? "unknown"}</strong>
              </div>
            ) : null}
            {state.status === "error" ? (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
                {state.message}
              </div>
            ) : null}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
