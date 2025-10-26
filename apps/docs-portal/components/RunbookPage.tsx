import clsx from "clsx";
import { isSloTagged, type RunbookRecord } from "@/lib/runbook-data";
import { ExecuteDrawer } from "@/components/ExecuteDrawer";
import { SloBadge, Tags } from "@/components/Tags";

function StepKindBadge({ kind }: { kind: RunbookRecord["steps"][number]["kind"] }) {
  const colors: Record<string, string> = {
    manual: "bg-slate-700/70 text-slate-100",
    verify: "bg-emerald-600/40 text-emerald-100",
    execute: "bg-sky-600/40 text-sky-100"
  };
  return <span className={clsx("badge", colors[kind])}>{kind}</span>;
}

export function RunbookPage({ runbook }: { runbook: RunbookRecord }) {
  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-8" aria-labelledby="runbook-title">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h1 id="runbook-title" className="text-3xl font-bold text-slate-50">
            {runbook.title}
          </h1>
          {isSloTagged(runbook) ? <SloBadge /> : null}
          {runbook.deprecated ? (
            <span className="badge bg-rose-600/30 text-rose-100">Deprecated</span>
          ) : null}
        </div>
        <p className="text-slate-300">{runbook.summary}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>Owners: {runbook.owners.join(", ")}</span>
          <span>Severity: {runbook.severity}</span>
          {runbook.lastReviewedAt ? <span>Last reviewed: {runbook.lastReviewedAt}</span> : null}
        </div>
        <Tags tags={runbook.tags} />
      </header>

      <section aria-labelledby="preconditions">
        <h2 id="preconditions" className="text-xl font-semibold text-slate-100">
          Preconditions
        </h2>
        {runbook.preconditions.length ? (
          <ul className="ml-5 list-disc text-slate-300">
            {runbook.preconditions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">None specified.</p>
        )}
      </section>

      {runbook.impact ? (
        <section aria-labelledby="impact">
          <h2 id="impact" className="text-xl font-semibold text-slate-100">
            Impact
          </h2>
          <p className="text-slate-300">{runbook.impact}</p>
        </section>
      ) : null}

      <section aria-labelledby="steps">
        <h2 id="steps" className="text-xl font-semibold text-slate-100">
          Steps
        </h2>
        <ol className="flex flex-col gap-4">
          {runbook.steps.map((step) => (
            <li key={step.id} className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 shadow">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{step.title}</h3>
                  {step.description ? <p className="text-sm text-slate-300">{step.description}</p> : null}
                </div>
                <StepKindBadge kind={step.kind} />
              </div>
              {step.notes ? <p className="mt-2 text-sm text-slate-400">{step.notes}</p> : null}
              {step.kind === "verify" && step.verify ? (
                <p className="mt-3 text-sm text-emerald-200">{step.verify.description}</p>
              ) : null}
              {step.kind === "execute" && step.execute ? (
                <div className="mt-3 text-sm text-sky-200">
                  <div>Action: {step.execute.action}</div>
                </div>
              ) : null}
              {step.guards.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {step.guards.map((guard) => (
                    <li key={guard.description} className="badge bg-amber-600/20 text-amber-100">
                      {guard.required ? "Required: " : "Guard: "}
                      {guard.description}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="contacts">
        <h2 id="contacts" className="text-xl font-semibold text-slate-100">
          Contacts
        </h2>
        <dl className="grid gap-2 text-slate-300 md:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-100">Team</dt>
            <dd>{runbook.contacts.team}</dd>
          </div>
          {runbook.contacts.slack ? (
            <div>
              <dt className="font-semibold text-slate-100">Slack</dt>
              <dd>{runbook.contacts.slack}</dd>
            </div>
          ) : null}
          {runbook.contacts.email ? (
            <div>
              <dt className="font-semibold text-slate-100">Email</dt>
              <dd>{runbook.contacts.email}</dd>
            </div>
          ) : null}
          {runbook.contacts.pagerduty ? (
            <div>
              <dt className="font-semibold text-slate-100">PagerDuty</dt>
              <dd>{runbook.contacts.pagerduty}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby="rollback">
        <h2 id="rollback" className="text-xl font-semibold text-slate-100">
          Rollback
        </h2>
        {runbook.rollback.length ? (
          <ul className="ml-5 list-disc text-slate-300">
            {runbook.rollback.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">No rollback steps provided.</p>
        )}
      </section>

      <ExecuteDrawer runbook={runbook} />
    </article>
  );
}
