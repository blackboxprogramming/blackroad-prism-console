import { NextResponse } from 'next/server';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  type Dimension
} from '@aws-sdk/client-cloudwatch';

export const runtime = 'nodejs';
export const revalidate = 0;

const region =
  process.env.SCORECARD_AWS_REGION || process.env.AWS_REGION || 'us-west-2';

const cloudWatch = new CloudWatchClient({ region });

const fifteenMinutes = 15 * 60 * 1000;

async function getMetric({
  namespace,
  metricName,
  dimensions,
  statistic,
  extendedStatistic,
  period = 60
}: {
  namespace: string;
  metricName: string;
  dimensions: Dimension[];
  statistic?: 'Average' | 'Sum' | 'Minimum' | 'Maximum';
  extendedStatistic?: string;
  period?: number;
}): Promise<number | null> {
  const now = new Date();
  const start = new Date(now.getTime() - fifteenMinutes);

  try {
    const command = new GetMetricStatisticsCommand({
      Namespace: namespace,
      MetricName: metricName,
      Dimensions: dimensions,
      StartTime: start,
      EndTime: now,
      Period: period,
      ...(statistic ? { Statistics: [statistic] } : {}),
      ...(extendedStatistic ? { ExtendedStatistics: [extendedStatistic] } : {})
    });

    const response = await cloudWatch.send(command);
    const datapoints = [...(response.Datapoints ?? [])].sort(
      (a, b) =>
        (a.Timestamp?.getTime() ?? 0) - (b.Timestamp?.getTime() ?? 0)
    );

    const latest = datapoints.at(-1);
    if (!latest) {
      return null;
    }

    if (extendedStatistic) {
      const extended = latest.ExtendedStatistics ?? {};
      const value =
        extended[extendedStatistic] ?? extended[extendedStatistic.toLowerCase()];
      return typeof value === 'number' ? value : null;
    }

    if (!statistic) {
      return null;
    }

    const value = (latest as Record<string, unknown>)[statistic];
    return typeof value === 'number' ? value : null;
  } catch (error) {
    console.error('scorecard: metric fetch failed', {
      namespace,
      metricName,
      error
    });
    return null;
  }
}

function safePercent(value: number | null, fractionDigits = 2): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  const rounded = Number(value.toFixed(fractionDigits));
  return Number.isFinite(rounded) ? rounded : null;
}

async function getHealthMetrics() {
  const albDimensionValue =
    process.env.SCORECARD_ALB_SUFFIX || process.env.ALB_SUFFIX;
  if (!albDimensionValue) {
    return {
      uptime: null,
      latencyP95: null,
      errorRate: null,
      requestCount: null,
      errorCount: null,
      wafBlocked: null
    };
  }

  const dimensions: Dimension[] = [
    { Name: 'LoadBalancer', Value: albDimensionValue }
  ];

  const wafAcl = process.env.SCORECARD_WAF_ACL || process.env.WAF_WEB_ACL;

  const wafPromise = wafAcl
    ? getMetric({
        namespace: 'AWS/WAFV2',
        metricName: 'BlockedRequests',
        dimensions: [{ Name: 'WebACL', Value: wafAcl }],
        statistic: 'Sum'
      })
    : Promise.resolve(null);

  const [requestCount, elb5xx, target5xx, latencyP95, wafBlocked] =
    await Promise.all([
      getMetric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'RequestCount',
        dimensions,
        statistic: 'Sum'
      }),
      getMetric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_ELB_5XX_Count',
        dimensions,
        statistic: 'Sum'
      }),
      getMetric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensions,
        statistic: 'Sum'
      }),
      getMetric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        dimensions,
        extendedStatistic: 'p95'
      }),
      wafPromise
    ]);

  const hasErrorMetric =
    typeof elb5xx === 'number' || typeof target5xx === 'number';
  const errorCount = hasErrorMetric ? (elb5xx ?? 0) + (target5xx ?? 0) : null;
  const errorRate =
    typeof errorCount === 'number' && requestCount && requestCount > 0
      ? (errorCount / requestCount) * 100
      : null;
  const uptime =
    typeof errorRate === 'number' ? Math.max(0, 100 - errorRate) : null;

  return {
    uptime: safePercent(uptime),
    latencyP95: latencyP95 ?? null,
    errorRate: safePercent(errorRate),
    requestCount: requestCount ?? null,
    errorCount,
    wafBlocked: wafBlocked ?? null
  };
}

async function githubRequest(path: string) {
  const token = process.env.SCORECARD_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`https://api.github.com${path}`, {
    headers,
    next: { revalidate: 0 }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub request failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function getVelocityMetrics() {
  const repo = process.env.SCORECARD_GITHUB_REPO;
  if (!repo) {
    return {
      deploysMonth: null,
      changeSuccess: null,
      lastDeployAt: null
    };
  }

  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    throw new Error('SCORECARD_GITHUB_REPO must be in the form owner/name');
  }

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  try {
    const releases = await githubRequest(
      `/repos/${owner}/${name}/releases?per_page=100`
    );
    const deploysThisMonth = Array.isArray(releases)
      ? releases.filter((release: any) => {
          const created = release?.created_at
            ? new Date(release.created_at)
            : null;
          return created ? created >= since : false;
        })
      : [];

    const workflowFilter = process.env.SCORECARD_DEPLOY_WORKFLOW;
    const workflows = await githubRequest(
      `/repos/${owner}/${name}/actions/runs?per_page=100`
    );
    const workflowRuns = Array.isArray(workflows?.workflow_runs)
      ? workflows.workflow_runs
      : [];

    const relevantRuns = workflowRuns.filter((run: any) => {
      const created = run?.created_at ? new Date(run.created_at) : null;
      if (!created || created < since) {
        return false;
      }
      if (workflowFilter) {
        return run?.name === workflowFilter;
      }
      return run?.event === 'deployment' || run?.conclusion === 'success';
    });

    const total = relevantRuns.length;
    const successes = relevantRuns.filter(
      (run: any) => run?.conclusion === 'success'
    ).length;

    const latestDeploy = deploysThisMonth
      .map((release: any) => release?.created_at)
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      deploysMonth: deploysThisMonth.length,
      changeSuccess: total > 0 ? safePercent((successes / total) * 100) : null,
      lastDeployAt: latestDeploy ?? null
    };
  } catch (error) {
    console.error('scorecard: velocity metrics failed', error);
    return {
      deploysMonth: null,
      changeSuccess: null,
      lastDeployAt: null
    };
  }
}

async function getSecurityMetrics() {
  const incidentRepo = process.env.SCORECARD_INCIDENT_REPO;
  const incidentLabel = process.env.SCORECARD_INCIDENT_LABEL || 'incident';
  let incidents: number | null = null;
  try {
    if (incidentRepo) {
      const query = encodeURIComponent(
        `repo:${incidentRepo} state:open label:"${incidentLabel}"`
      );
      const data = await githubRequest(`/search/issues?q=${query}`);
      incidents = typeof data?.total_count === 'number' ? data.total_count : null;
    }
  } catch (error) {
    console.error('scorecard: incident lookup failed', error);
    incidents = null;
  }

  const academyFeed = process.env.SCORECARD_ACADEMY_FEED;
  let academyCoverage: number | null = null;
  if (academyFeed) {
    try {
      const res = await fetch(academyFeed, { next: { revalidate: 0 } });
      if (res.ok) {
        const data = await res.json();
        const coverage = data?.coverage ?? data?.academyCoverage;
        academyCoverage =
          typeof coverage === 'number' ? safePercent(coverage, 1) : null;
      }
    } catch (error) {
      console.error('scorecard: academy feed failed', error);
    }
  }

  const evidenceFeed = process.env.SCORECARD_EVIDENCE_FEED;
  let openFindings: number | null = null;
  if (evidenceFeed) {
    try {
      const res = await fetch(evidenceFeed, { next: { revalidate: 0 } });
      if (res.ok) {
        const data = await res.json();
        const findings = data?.openFindings ?? data?.open_controls;
        openFindings =
          typeof findings === 'number' ? Math.max(0, findings) : null;
      }
    } catch (error) {
      console.error('scorecard: evidence feed failed', error);
    }
  }

  return {
    alerts: null,
    openFindings,
    incidents,
    academyCoverage
  };
}

async function getSpend() {
  const feed = process.env.COST_FEED || process.env.SCORECARD_COST_FEED;
  if (!feed) {
    return { monthToDate: null, forecast: null };
  }

  try {
    const res = await fetch(feed, { next: { revalidate: 0 } });
    if (!res.ok) {
      throw new Error(`cost feed failed: ${res.status}`);
    }
    const data = await res.json();
    const month = data?.month ?? data?.monthToDate ?? data?.actual;
    const forecast = data?.forecast ?? data?.projected;
    return {
      monthToDate: typeof month === 'number' ? month : null,
      forecast: typeof forecast === 'number' ? forecast : null
    };
  } catch (error) {
    console.error('scorecard: cost feed failed', error);
    return { monthToDate: null, forecast: null };
  }
}

export async function GET() {
  const [health, velocity, security, spend] = await Promise.all([
    getHealthMetrics(),
    getVelocityMetrics(),
    getSecurityMetrics(),
    getSpend()
  ]);

  const alerts =
    typeof health.wafBlocked === 'number'
      ? Math.max(0, Math.round(health.wafBlocked))
      : security.alerts;

  return NextResponse.json({
    updated: new Date().toISOString(),
    health,
    security: { ...security, alerts },
    velocity,
    spend
  });
}
