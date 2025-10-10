'use client';

import useSWR from 'swr';
import { Activity, ShieldCheck, Timer, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

type Severity = 'green' | 'yellow' | 'red' | 'neutral';

type ScorecardResponse = {
  updated: string;
  health: {
    uptime: number | null;
    latencyP95: number | null;
    errorRate: number | null;
    requestCount: number | null;
    errorCount: number | null;
    wafBlocked: number | null;
  };
  security: {
    alerts: number | null;
    openFindings: number | null;
    incidents: number | null;
    academyCoverage: number | null;
  };
  velocity: {
    deploysMonth: number | null;
    changeSuccess: number | null;
    lastDeployAt: string | null;
  };
  spend: {
    monthToDate: number | null;
    forecast: number | null;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const severityColors: Record<Severity, string> = {
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  red: 'bg-red-50 border-red-200',
  neutral: 'bg-slate-50 border-slate-200'
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

function classifyHigh(value: number | null, thresholds: { green: number; yellow: number }): Severity {
  if (typeof value !== 'number') return 'neutral';
  if (value >= thresholds.green) return 'green';
  if (value >= thresholds.yellow) return 'yellow';
  return 'red';
}

function classifyLow(value: number | null, thresholds: { green: number; yellow: number }): Severity {
  if (typeof value !== 'number') return 'neutral';
  if (value <= thresholds.green) return 'green';
  if (value <= thresholds.yellow) return 'yellow';
  return 'red';
}

function combineSeverity(values: Severity[]): Severity {
  if (values.includes('red')) return 'red';
  if (values.includes('yellow')) return 'yellow';
  if (values.includes('green')) return 'green';
  return 'neutral';
}

function formatPercent(value: number | null, digits = 1) {
  if (typeof value !== 'number') return '—';
  return `${value.toFixed(digits)}%`;
}

function formatMs(seconds: number | null) {
  if (typeof seconds !== 'number') return '—';
  return `${Math.round(seconds * 1000)} ms`;
}

function formatNumber(value: number | null) {
  if (typeof value !== 'number') return '—';
  return numberFormatter.format(value);
}

function formatCurrency(value: number | null) {
  if (typeof value !== 'number') return '—';
  return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString();
}

type CardProps = {
  title: string;
  icon: ReactNode;
  severity: Severity;
  children: ReactNode;
};

function Card({ title, icon, severity, children }: CardProps) {
  return (
    <section
      className={`border rounded-2xl p-6 shadow-sm flex flex-col gap-4 transition-colors ${severityColors[severity]}`}
    >
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/70 flex items-center justify-center text-slate-700">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>
      <div className="space-y-3 text-slate-800 text-sm">{children}</div>
    </section>
  );
}

type MetricProps = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
};

function Metric({ label, value, helper }: MetricProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        {helper && <div className="text-xs text-slate-500 mt-1">{helper}</div>}
      </div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function ScorecardPage() {
  const { data, error } = useSWR<ScorecardResponse>('/api/scorecard', fetcher, {
    refreshInterval: 120_000,
    revalidateOnFocus: false
  });

  const computed = useMemo(() => {
    if (!data) {
      return null;
    }

    const healthSeverity = combineSeverity([
      classifyHigh(data.health.uptime, { green: 99.9, yellow: 99 }),
      classifyLow(data.health.latencyP95, { green: 1, yellow: 1.5 }),
      classifyLow(data.health.errorRate, { green: 0.5, yellow: 1 })
    ]);

    const changeSeverity = classifyHigh(data.velocity.changeSuccess, {
      green: 98,
      yellow: 95
    });

    const securitySeverity = combineSeverity([
      classifyLow(data.security.alerts, { green: 0, yellow: 10 }),
      classifyLow(data.security.openFindings, { green: 0, yellow: 5 }),
      classifyLow(data.security.incidents, { green: 0, yellow: 1 }),
      classifyHigh(data.security.academyCoverage, { green: 90, yellow: 80 })
    ]);

    const spendVariance =
      typeof data.spend.monthToDate === 'number' &&
      typeof data.spend.forecast === 'number' &&
      data.spend.forecast > 0
        ? (data.spend.monthToDate / data.spend.forecast) * 100
        : null;

    const spendSeverity = classifyLow(spendVariance, { green: 100, yellow: 110 });

    return {
      healthSeverity,
      changeSeverity,
      securitySeverity,
      spendSeverity,
      spendVariance
    };
  }, [data]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">BlackRoad Scorecard</h1>
            <p className="text-sm text-slate-600">
              Health, security, velocity, and spend in one glance.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {data && `Updated ${new Date(data.updated).toLocaleString()}`}
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            Unable to load scorecard data. Please check the data feeds.
          </div>
        )}

        {!data && !error && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            Loading live metrics…
          </div>
        )}

        {data && computed && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              title="Health"
              icon={<Activity className="h-5 w-5" />}
              severity={computed.healthSeverity}
            >
              <Metric label="Uptime" value={formatPercent(data.health.uptime, 2)} />
              <Metric
                label="Latency p95"
                value={formatMs(data.health.latencyP95)}
                helper="Last 15 minutes"
              />
              <Metric
                label="Error rate"
                value={formatPercent(data.health.errorRate, 2)}
                helper={`5xx count: ${formatNumber(data.health.errorCount)}`}
              />
              <Metric
                label="Request volume"
                value={formatNumber(data.health.requestCount)}
                helper="Last 15 minutes"
              />
            </Card>

            <Card
              title="Security"
              icon={<ShieldCheck className="h-5 w-5" />}
              severity={computed.securitySeverity}
            >
              <Metric
                label="WAF alerts"
                value={formatNumber(data.security.alerts)}
                helper="Blocked requests (15m)"
              />
              <Metric
                label="Open findings"
                value={formatNumber(data.security.openFindings)}
                helper="Evidence pack"
              />
              <Metric
                label="Open incidents"
                value={formatNumber(data.security.incidents)}
                helper="cstate"
              />
              <Metric
                label="Academy coverage"
                value={formatPercent(data.security.academyCoverage, 1)}
                helper="PeopleOps"
              />
            </Card>

            <Card
              title="Velocity"
              icon={<Timer className="h-5 w-5" />}
              severity={computed.changeSeverity}
            >
              <Metric
                label="Deploys this month"
                value={formatNumber(data.velocity.deploysMonth)}
                helper={
                  data.velocity.lastDeployAt
                    ? `Last deploy ${formatDate(data.velocity.lastDeployAt)}`
                    : undefined
                }
              />
              <Metric
                label="Change success"
                value={formatPercent(data.velocity.changeSuccess, 2)}
                helper="Workflow success rate"
              />
            </Card>

            <Card
              title="Spend"
              icon={<Wallet className="h-5 w-5" />}
              severity={computed.spendSeverity}
            >
              <Metric
                label="Month-to-date"
                value={formatCurrency(data.spend.monthToDate)}
              />
              <Metric label="Forecast" value={formatCurrency(data.spend.forecast)} />
              <Metric
                label="vs forecast"
                value={
                  computed.spendVariance !== null
                    ? formatPercent(computed.spendVariance, 1)
                    : '—'
                }
                helper="Target ≤ 100%"
              />
            </Card>
          </div>
        )}

        <footer className="text-xs text-slate-500">
          Auto-refreshing every 2 minutes. Configure feeds via SCORECARD_* env vars.
        </footer>
      </div>
    </main>
  );
}
