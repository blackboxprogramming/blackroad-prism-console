import { metrics, trace } from '@opentelemetry/api';

export const tracer = trace.getTracer('sb-gateway');
const meter = metrics.getMeter('sb-gateway');

export const iterationHistogram = meter.createHistogram('sb_sinkhorn_iterations', {
  description: 'Number of Sinkhorn iterations performed'
});

export const marginalErrorGauge = meter.createGauge('sb_sinkhorn_marginal_error', {
  description: 'Max marginal residual observed at convergence'
});

export function recordIterationStats(iterations: number, marginalError: number) {
  iterationHistogram.record(iterations);
  marginalErrorGauge.record(marginalError);
}
