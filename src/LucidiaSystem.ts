import { EventEmitter } from 'events';
import { createHash, randomUUID } from 'crypto';
import http from 'http';
import stringify from 'fast-json-stable-stringify';
import { z } from 'zod';
import * as prom from 'prom-client';

/* ------------------------------ Utilities ------------------------------ */

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function nowIso() {
  return new Date().toISOString();
}
function approxSizeBytes(obj: unknown) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

/* ------------------------------ Schemas ------------------------------- */

const ComplexitySchema = z.object({
  score: z.number().nonnegative(),
  level: z.union([z.literal('low'), z.literal('medium'), z.literal('high')]),
  requiresMultiValuedLogic: z.boolean(),
});

const DataItemInputSchema = z.object({
  type: z.union([z.literal('question'), z.literal('information'), z.literal('general')]),
  content: z.string().min(1),
  context: z.record(z.any()).optional(),
  requestId: z.string().uuid(),
});

type DataItemInput = z.infer<typeof DataItemInputSchema>;

const DataItemSchema = DataItemInputSchema.extend({
  id: z.string().uuid(),
  ts: z.number().int(),
  source: z.literal('curator'),
});

type DataItem = z.infer<typeof DataItemSchema>;

const AnalysisMetadataSchema = z.object({
  complexity: z.union([z.literal('low'), z.literal('medium'), z.literal('high')]),
  category: z.union([
    z.literal('query'),
    z.literal('information'),
    z.literal('general'),
    z.literal('unknown'),
  ]),
  processingTime: z.number().nonnegative(),
});

const AnalyzedItemSchema = DataItemSchema.extend({
  validated: z.boolean(),
  validationScore: z.number().min(0).max(1),
  analysisMetadata: AnalysisMetadataSchema,
});

type AnalyzedItem = z.infer<typeof AnalyzedItemSchema>;

const ReasoningResultSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  states: z.number().int().nonnegative(),
  reasoning: z.string(),
  metadata: z.object({
    complexity: ComplexitySchema,
    processingTime: z.number().nonnegative(),
    stateReduction: z.string(),
  }),
});

type ReasoningResult = z.infer<typeof ReasoningResultSchema>;

const ExplanationSchema = z.object({
  id: z.string(),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  confidenceText: z.string(),
  complexity: z.union([z.literal('low'), z.literal('medium'), z.literal('high')]),
  details: ReasoningResultSchema.optional(),
  context: z.record(z.any()).optional(),
  timestamp: z.string(),
  metadata: z.object({
    processingTime: z.number(),
    stateReduction: z.string(),
    coherence: z.number(),
  }),
});

type Explanation = z.infer<typeof ExplanationSchema>;

/* ----------------------------- Metrics -------------------------------- */

const registry = new prom.Registry();
prom.collectDefaultMetrics({ register: registry });

const stageProcessed = new prom.Counter({
  name: 'lucidia_stage_processed_total',
  help: 'Total items processed by stage',
  labelNames: ['stage'] as const,
  registers: [registry],
});

const stageErrors = new prom.Counter({
  name: 'lucidia_stage_errors_total',
  help: 'Total errors by stage',
  labelNames: ['stage'] as const,
  registers: [registry],
});

const stageDuration = new prom.Histogram({
  name: 'lucidia_stage_duration_seconds',
  help: 'Stage duration in seconds',
  labelNames: ['stage'] as const,
  buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [registry],
});

const queueDepthGauge = new prom.Gauge({
  name: 'lucidia_queue_depth',
  help: 'Current number of queued tasks',
  registers: [registry],
});

const activeTreesGauge = new prom.Gauge({
  name: 'lucidia_active_reasoning_trees',
  help: 'Active reasoning trees',
  registers: [registry],
});

const identityCoherenceGauge = new prom.Gauge({
  name: 'lucidia_identity_coherence',
  help: 'Identity coherence (0..1)',
  registers: [registry],
});

/* ----------------------- Minimal Concurrency Queue -------------------- */

class TaskQueue {
  private q: Array<() => Promise<void>> = [];
  private running = 0;
  constructor(private concurrency = 8) {}

  add(task: () => Promise<void>) {
    this.q.push(task);
    queueDepthGauge.set(this.q.length);
    this.runNext();
  }

  private runNext() {
    while (this.running < this.concurrency && this.q.length > 0) {
      const t = this.q.shift()!;
      queueDepthGauge.set(this.q.length);
      this.running++;
      t()
        .catch(() => {})
        .finally(() => {
          this.running--;
          this.runNext();
        });
    }
  }

  size() {
    return this.q.length;
  }
}

/* ------------------------------- Agents ------------------------------- */

class CuratorAgent extends EventEmitter {
  private dataStore: DataItem[] = [];
  private bytes = 0;
  private config: { maxStoreSize: number; maxBytes: number; autoCleanup: boolean };

  constructor(
    config: Partial<{ maxStoreSize: number; maxBytes: number; autoCleanup: boolean }> = {}
  ) {
    super();
    this.config = {
      maxStoreSize: 10_000,
      maxBytes: 25 * 1024 * 1024,
      autoCleanup: true,
      ...config,
    };
  }

  ingest(input: DataItemInput): DataItem {
    const ok = DataItemInputSchema.safeParse(input);
    if (!ok.success) {
      stageErrors.inc({ stage: 'curator' });
      const err = new Error('Curator validation failed: ' + ok.error.message);
      this.emit('error', { phase: 'ingestion', error: err.message, data: input });
      throw err;
    }

    const item: DataItem = {
      ...ok.data,
      id: randomUUID(),
      ts: Date.now(),
      source: 'curator',
    };

    const enriched = { ...item, timestamp: nowIso() } as any; // for compatibility with previous shape
    const size = approxSizeBytes(enriched);
    this.dataStore.push(item);
    this.bytes += size;
    if (this.config.autoCleanup) this.cleanup();
    stageProcessed.inc({ stage: 'curator' });
    this.emit('data-ingested', item);
    return item;
  }

  query(filter: Partial<DataItem> = {}) {
    return this.dataStore.filter((it) =>
      Object.entries(filter).every(([k, v]) => (it as any)[k] === v)
    );
  }

  private cleanup() {
    while (this.dataStore.length > this.config.maxStoreSize || this.bytes > this.config.maxBytes) {
      const removed = this.dataStore.shift();
      if (!removed) break;
      this.bytes -= approxSizeBytes(removed);
    }
  }

  getMetrics() {
    return {
      ingested: stageProcessed.hashMap?.curator?.value ?? undefined,
      storeSize: this.dataStore.length,
      approxBytes: this.bytes,
      errors: stageErrors.hashMap?.curator?.value ?? undefined,
    };
  }
}

class AnalyzerAgent extends EventEmitter {
  constructor(private config: { enrichmentEnabled: boolean } = { enrichmentEnabled: true }) {
    super();
  }

  analyze(data: DataItem): AnalyzedItem {
    const start = process.hrtime.bigint();
    try {
      const errors: string[] = [];
      if (!data.type) errors.push('Missing required field: type');
      if (!data.content) errors.push('Missing required field: content');
      const score = Math.max(0, 1 - errors.length * 0.2);
      if (errors.length) throw new Error('Validation failed: ' + errors.join(', '));

      const content = String(data.content).toLowerCase();
      const complexityWords = ['because', 'however', 'therefore', 'although', 'complexity'];
      const count = complexityWords.filter((w) => content.includes(w)).length;
      const complexity = count > 2 ? 'high' : count > 0 ? 'medium' : 'low';

      let category: 'query' | 'information' | 'general' | 'unknown' = 'unknown';
      if (content.includes('?')) category = 'query';
      else if (content.includes('fact') || content.includes('data')) category = 'information';
      else if (content.length > 0) category = 'general';

      const analyzed: AnalyzedItem = {
        ...data,
        validated: true,
        validationScore: score,
        analysisMetadata: {
          complexity,
          category,
          processingTime: 0,
        },
      };

      analyzed.analysisMetadata.processingTime = Number(process.hrtime.bigint() - start) / 1e9;
      AnalyzedItemSchema.parse(analyzed);

      stageProcessed.inc({ stage: 'analyzer' });
      this.emit('data-analyzed', analyzed);
      stageDuration.observe({ stage: 'analyzer' }, analyzed.analysisMetadata.processingTime);
      return analyzed;
    } catch (e: any) {
      stageErrors.inc({ stage: 'analyzer' });
      this.emit('error', { phase: 'analysis', error: e.message, data });
      throw e;
    }
  }

  getMetrics() {
    return {
      analyzed: stageProcessed.hashMap?.analyzer?.value ?? undefined,
      failed: stageErrors.hashMap?.analyzer?.value ?? undefined,
    };
  }
}

class BridgeAgent extends EventEmitter {
  private shared: any[] = [];
  private config: { maxSharedItems: number; syncInterval: number };
  private syncTimer?: NodeJS.Timeout;
  private _seen = new Set<string>();
  private _lastSyncTime?: string;

  constructor(config: Partial<{ maxSharedItems: number; syncInterval: number }> = {}) {
    super();
    this.config = { maxSharedItems: 5000, syncInterval: 60_000, ...config };
    if (this.config.syncInterval > 0) {
      this.syncTimer = setInterval(() => this.syncSharedKnowledge(), this.config.syncInterval);
    }
  }

  share(data: any) {
    try {
      const key = createHash('md5').update(stringify(data)).digest('hex');
      if (this._seen.has(key)) return null;
      this._seen.add(key);

      const sharedItem = {
        ...data,
        sharedAt: nowIso(),
        shareId: createHash('md5')
          .update(stringify({ data, t: Date.now() }))
          .digest('hex'),
      };
      this.shared.push(sharedItem);
      if (this.shared.length > this.config.maxSharedItems)
        this.shared = this.shared.slice(-this.config.maxSharedItems);
      stageProcessed.inc({ stage: 'bridge' });
      this.emit('knowledge-shared', sharedItem);
      return sharedItem;
    } catch (e: any) {
      stageErrors.inc({ stage: 'bridge' });
      this.emit('error', { phase: 'sharing', error: e.message, data });
      throw e;
    }
  }

  syncSharedKnowledge() {
    this._lastSyncTime = nowIso();
    this.emit('sync-complete', { itemsSynced: this.shared.length, timestamp: this._lastSyncTime });
  }

  getMetrics() {
    return {
      sharedItems: this.shared.length,
      lastSync: this._lastSyncTime ?? null,
    };
  }

  cleanup() {
    if (this.syncTimer) clearInterval(this.syncTimer);
  }
}

class EnhancedPlannerAgent extends EventEmitter {
  private config: { maxReasoningDepth: number; confidenceThreshold: number };
  private activeTrees = new Map<string, any>();
  private reasoningHistory: Array<any> = [];
  private rand: () => number;

  constructor(
    config: Partial<{ maxReasoningDepth: number; confidenceThreshold: number }> = {},
    deps: { rand?: () => number } = {}
  ) {
    super();
    this.config = { maxReasoningDepth: 10, confidenceThreshold: 0.8, ...config };
    this.rand = deps.rand ?? (() => Math.random());
  }

  assessComplexity(question: string) {
    const k = ['contradiction', 'paradox', 'impossible', 'both', 'neither'];
    const score = k.reduce((s, w) => (question.toLowerCase().includes(w) ? s + 1 : s), 0);
    return {
      score,
      level: score > 2 ? 'high' : score > 0 ? 'medium' : 'low',
      requiresMultiValuedLogic: score > 0,
    } as z.infer<typeof ComplexitySchema>;
  }

  private generateAnswer(question: string, complexity: z.infer<typeof ComplexitySchema>) {
    const pick = <T>(arr: T[]) => arr[Math.floor(this.rand() * arr.length)];
    const responses = {
      low: [
        'Based on available data and logical analysis:',
        'The evidence suggests:',
        'A straightforward approach would be:',
      ],
      medium: [
        'Considering multiple perspectives and potential contradictions:',
        'Through recursive analysis of competing viewpoints:',
        'Balancing certainty with possibility:',
      ],
      high: [
        'Embracing the paradoxical nature of this question:',
        'Through contradiction harmonics and multi-valued reasoning:',
        'In the space between certainty and possibility:',
      ],
    } as const;

    const prefix = pick(responses[complexity.level]);
    const q = question.toLowerCase();
    if (q.includes('climate'))
      return `${prefix} Implement comprehensive renewable energy transition while supporting affected communities through retraining and economic diversification programs.`;
    if (q.includes('energy'))
      return `${prefix} Combine policy incentives, technological innovation, and community engagement to accelerate clean energy adoption.`;
    return `${prefix} This requires a multi-faceted approach that honors both practical constraints and innovative possibilities.`;
  }

  private async performReasoning(
    question: string,
    complexity: z.infer<typeof ComplexitySchema>,
    _context: Record<string, any>
  ): Promise<ReasoningResult> {
    const start = process.hrtime.bigint();
    const states = Array.from({ length: 42 }, (_, i) => ({
      id: i,
      value: this.rand(),
      coherence: this.rand(),
    }));
    const collapsed = states.filter((s) => s.coherence > 0.5);
    const resurrected = collapsed.map((s) => ({ ...s, coherence: Math.min(s.coherence * 1.2, 1) }));
    const finalCoherence = resurrected.length
      ? resurrected.reduce((sum, s) => sum + s.coherence, 0) / resurrected.length
      : 0.0;
    const confidence = Math.min(finalCoherence * (1 + complexity.score * 0.1), 1.0);

    const result: ReasoningResult = {
      answer: this.generateAnswer(question, complexity),
      confidence,
      coherence: finalCoherence,
      states: resurrected.length,
      reasoning: `Applied ${complexity.level} complexity reasoning with ${resurrected.length}/42 coherent states`,
      metadata: {
        complexity,
        processingTime: Number(process.hrtime.bigint() - start) / 1e9,
        stateReduction: (((42 - resurrected.length) / 42) * 100).toFixed(1) + '%',
      },
    };

    ReasoningResultSchema.parse(result);
    return result;
  }

  async reason(question: string, context: Record<string, any> = {}) {
    const reasoningId = createHash('md5').update(`${question}-${Date.now()}`).digest('hex');
    const complexity = this.assessComplexity(question);

    try {
      const timerStart = process.hrtime.bigint();
      const result = await this.performReasoning(question, complexity, context);
      const duration = Number(process.hrtime.bigint() - timerStart) / 1e9;

      const reasoning = {
        id: reasoningId,
        question,
        result,
        complexity,
        duration,
        timestamp: nowIso(),
      };

      this.reasoningHistory.push(reasoning);
      this.activeTrees.set(reasoningId, reasoning);
      activeTreesGauge.set(this.activeTrees.size);

      stageProcessed.inc({ stage: 'planner' });
      stageDuration.observe({ stage: 'planner' }, duration);

      this.emit('reasoning-complete', {
        reasoningId,
        goal: question,
        confidence: result.confidence,
        result,
      });

      return result;
    } catch (e: any) {
      stageErrors.inc({ stage: 'planner' });
      this.emit('reasoning-error', { goal: question, error: e.message });
      throw e;
    }
  }

  getMetrics() {
    const avgConf =
      this.reasoningHistory.length === 0
        ? 0
        : this.reasoningHistory.reduce((s, r) => s + (r.result?.confidence ?? 0), 0) /
          this.reasoningHistory.length;
    return {
      totalReasoning: this.reasoningHistory.length,
      activeReasoningTrees: this.activeTrees.size,
      averageConfidence: avgConf,
    };
  }
}

class IdentityKeeperAgent extends EventEmitter {
  private config: { memoryRetention: number; coherenceThreshold: number; stabilityWindow: number };
  private identity = {
    core: new Map<string, any>(),
    temporal: new Map<number, number>(),
    coherence: 1.0,
  };
  private metrics = { continuityEvents: 0, identityShifts: 0, lastUpdate: Date.now() };
  private window: number[] = [];

  constructor(
    config: Partial<{
      memoryRetention: number;
      coherenceThreshold: number;
      stabilityWindow: number;
    }> = {}
  ) {
    super();
    this.config = {
      memoryRetention: 1000,
      coherenceThreshold: 0.7,
      stabilityWindow: 50,
      ...config,
    };
  }

  private computeIdentityHash(context: any, reasoning?: ReasoningResult) {
    const data = stringify({ context, reasoning: reasoning?.answer });
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private calculateStability() {
    if (this.window.length === 0) return 1.0;
    const mean = this.window.reduce((s, x) => s + x, 0) / this.window.length;
    const variance = this.window.reduce((s, x) => s + (x - mean) ** 2, 0) / this.window.length;
    return Math.max(0, 1 - variance); // simple normalized inverse variance
  }

  updateIdentity(context: any, reasoning?: ReasoningResult) {
    const identityHash = this.computeIdentityHash(context, reasoning);
    const previousCoherence = this.identity.coherence;

    this.identity.core.set('lastReasoning', reasoning);
    this.identity.core.set('contextSignature', identityHash);
    this.identity.core.set('timestamp', Date.now());

    if (reasoning && typeof reasoning.confidence === 'number') {
      this.identity.coherence = this.identity.coherence * 0.8 + reasoning.confidence * 0.2;
    }

    this.window.push(this.identity.coherence);
    if (this.window.length > this.config.stabilityWindow) this.window.shift();

    if (Math.abs(this.identity.coherence - previousCoherence) > 0.1) {
      this.metrics.identityShifts++;
      this.emit('identity-shift', {
        previousCoherence,
        newCoherence: this.identity.coherence,
        context,
      });
    }

    this.metrics.continuityEvents++;
    this.metrics.lastUpdate = Date.now();

    identityCoherenceGauge.set(this.identity.coherence);

    this.emit('identity-updated', {
      coherence: this.identity.coherence,
      stability: this.calculateStability(),
    });
  }

  getIdentitySnapshot() {
    return {
      coherence: this.identity.coherence,
      stability: this.calculateStability(),
      coreElements: this.identity.core.size,
      temporalElements: this.identity.temporal.size,
      metrics: { ...this.metrics },
    };
  }

  getMetrics() {
    return this.getIdentitySnapshot();
  }
}

class ExplainerAgent extends EventEmitter {
  private config: { maxExplanationLength: number; includeMetadata: boolean };
  private explanations: Explanation[] = [];
  private metrics = {
    explained: 0,
    averageLength: 0,
    complexityHandled: { low: 0, medium: 0, high: 0 },
  };

  constructor(config: Partial<{ maxExplanationLength: number; includeMetadata: boolean }> = {}) {
    super();
    this.config = { maxExplanationLength: 500, includeMetadata: true, ...config };
  }

  explain(result: ReasoningResult, context: Record<string, any> = {}) {
    const start = process.hrtime.bigint();
    try {
      const complexity = (result?.metadata?.complexity?.level ?? 'medium') as
        | 'low'
        | 'medium'
        | 'high';
      const confidence = result?.confidence ?? 0.5;

      let summary = result?.answer ?? 'No answer available';
      if (complexity === 'high') summary = `Through recursive multi-valued reasoning: ${summary}`;
      else if (complexity === 'medium') summary = `Considering multiple perspectives: ${summary}`;
      else summary = `Based on analysis: ${summary}`;

      const confidenceText =
        confidence > 0.8
          ? 'High confidence'
          : confidence > 0.5
            ? 'Moderate confidence'
            : 'Low confidence';

      const explanation: Explanation = {
        id: createHash('md5').update(`${summary}-${Date.now()}`).digest('hex'),
        summary: summary.substring(0, this.config.maxExplanationLength),
        confidence,
        confidenceText,
        complexity,
        details: this.config.includeMetadata ? result : undefined,
        context,
        timestamp: nowIso(),
        metadata: {
          processingTime: result?.metadata?.processingTime ?? 0,
          stateReduction: result?.metadata?.stateReduction ?? '0%',
          coherence: result?.coherence ?? 0,
        },
      };

      ExplanationSchema.parse(explanation);
      this.explanations.push(explanation);
      this.metrics.explained++;
      this.metrics.averageLength =
        this.explanations.reduce((s, e) => s + e.summary.length, 0) / this.explanations.length;
      this.metrics.complexityHandled[complexity]++;

      stageProcessed.inc({ stage: 'explainer' });
      const dur = Number(process.hrtime.bigint() - start) / 1e9;
      stageDuration.observe({ stage: 'explainer' }, dur);

      this.emit('explanation-provided', explanation);
      return explanation;
    } catch (e: any) {
      stageErrors.inc({ stage: 'explainer' });
      this.emit('error', { phase: 'explanation', error: e.message, result });
      throw e;
    }
  }

  getMetrics() {
    return { ...this.metrics, totalExplanations: this.explanations.length };
  }
}

/* ----------------------------- Main System ---------------------------- */

type MonitoringCfg = { enabled: boolean; interval: number; detailedLogs: boolean };
type AgentsCfg = {
  curator?: any;
  analyzer?: any;
  planner?: any;
  bridge?: any;
  identity?: any;
  explainer?: any;
};
type MetricsCfg = { enabled: boolean; port: number };

type SystemConfig = {
  monitoring: MonitoringCfg;
  agents: AgentsCfg;
  seed?: number;
  concurrency?: number;
  metrics?: MetricsCfg;
};

class LucidiaSystem extends EventEmitter {
  private config: SystemConfig;
  private curator: CuratorAgent;
  private analyzer: AnalyzerAgent;
  private planner: EnhancedPlannerAgent;
  private bridge: BridgeAgent;
  private identity: IdentityKeeperAgent;
  private explainer: ExplainerAgent;
  private metrics = {
    ingested: 0,
    analyzed: 0,
    shared: 0,
    reasoned: 0,
    explained: 0,
    errors: 0,
    startTime: Date.now(),
  };
  private _monitorInterval?: NodeJS.Timeout;
  private queue: TaskQueue;
  private metricsServer?: http.Server;

  constructor(config: Partial<SystemConfig> = {}) {
    super();
    this.config = {
      monitoring: { enabled: true, interval: 10_000, detailedLogs: false },
      agents: {},
      seed: 123,
      concurrency: 8,
      metrics: { enabled: true, port: 9464 },
      ...config,
    };

    const rand = mulberry32(this.config.seed!);

    this.curator = new CuratorAgent(this.config.agents.curator);
    this.analyzer = new AnalyzerAgent(this.config.agents.analyzer);
    this.planner = new EnhancedPlannerAgent(this.config.agents.planner, { rand });
    this.bridge = new BridgeAgent(this.config.agents.bridge);
    this.identity = new IdentityKeeperAgent(this.config.agents.identity);
    this.explainer = new ExplainerAgent(this.config.agents.explainer);

    this.queue = new TaskQueue(this.config.concurrency);

    this.setupEventListeners();

    if (this.config.monitoring.enabled) this.startMonitoring();
    if (this.config.metrics?.enabled) this.startMetricsServer(this.config.metrics.port);
  }

  private setupEventListeners() {
    this.curator.on('data-ingested', (data: DataItem) => {
      this.metrics.ingested++;
      const start = process.hrtime.bigint();
      this.queue.add(async () => {
        try {
          const analyzed = this.analyzer.analyze(data);
          const dur = Number(process.hrtime.bigint() - start) / 1e9;
          stageDuration.observe({ stage: 'curator_to_analyzer' as any }, dur);
        } catch (e) {}
      });
    });

    this.analyzer.on('data-analyzed', (data: AnalyzedItem) => {
      this.metrics.analyzed++;
      const start = process.hrtime.bigint();
      this.queue.add(async () => {
        try {
          this.bridge.share(data);
          const dur = Number(process.hrtime.bigint() - start) / 1e9;
          stageDuration.observe({ stage: 'analyzer_to_bridge' as any }, dur);
        } catch (e) {}
      });
    });

    this.bridge.on('knowledge-shared', (data: any) => {
      this.metrics.shared++;
      if (data.type === 'question') {
        // Route to reasoning
        this.queue.add(async () => {
          try {
            await this.reason(data.content, data);
          } catch (err: any) {
            this.metrics.errors++;
            this.emit('error', { phase: 'reasoning', error: err.message, data });
          }
        });
      }
    });

    this.planner.on('reasoning-complete', ({ reasoningId, goal, confidence, result }) => {
      this.metrics.reasoned++;
      this.identity.updateIdentity({ goal, reasoningId }, result);
      this.explainer.explain(result, { goal, reasoningId });
      activeTreesGauge.set(this.planner.getMetrics().activeReasoningTrees ?? 0);
    });

    this.explainer.on('explanation-provided', (_explanation: Explanation) => {
      this.metrics.explained++;
      this.emit('explanation-complete', _explanation);
    });

    // Unified agent error funnel
    ['curator', 'analyzer', 'planner', 'bridge', 'identity', 'explainer'].forEach((agentName) => {
      (this as any)[agentName].on('error', (error: any) => {
        this.metrics.errors++;
        stageErrors.inc({ stage: agentName });
        this.emit('agent-error', { agent: agentName, ...error });
      });
    });
  }

  async processQuestion(
    question: string,
    context: Record<string, any> = {},
    opts: { timeoutMs?: number } = {}
  ) {
    const timeoutMs = opts.timeoutMs ?? 30_000;
    return new Promise<Explanation>((resolve, reject) => {
      const requestId = randomUUID();

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Processing timeout'));
      }, timeoutMs);

      const onExplanation = (explanation: Explanation) => {
        if (explanation?.context?.requestId !== requestId) return;
        cleanup();
        resolve(explanation);
      };

      const onError = (error: any) => {
        cleanup();
        reject(new Error(`Processing failed: ${error.error}`));
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.explainer.removeListener('explanation-provided', onExplanation);
        this.removeListener('agent-error', onError);
      };

      this.explainer.on('explanation-provided', onExplanation);
      this.on('agent-error', onError);

      const dataItemInput: DataItemInput = {
        type: 'question',
        content: question,
        context: { ...context, requestId },
        requestId,
      };

      this.curator.ingest(dataItemInput);
    });
  }

  async reason(question: string, context: Record<string, any> = {}) {
    try {
      const result = await this.planner.reason(question, context);
      this.explainer.explain(result, { question, ...context });
      return result;
    } catch (err: any) {
      const fallback: ReasoningResult = {
        answer: `Unable to reason about: ${question}`,
        confidence: 0,
        coherence: 0,
        states: 0,
        reasoning: 'fallback',
        metadata: {
          complexity: { score: 0, level: 'low', requiresMultiValuedLogic: false },
          processingTime: 0,
          stateReduction: '0%',
        },
      };
      this.explainer.explain(fallback, { question, ...context });
      return fallback;
    }
  }

  private startMonitoring() {
    if (this._monitorInterval) return;
    this._monitorInterval = setInterval(() => {
      const m = this.getSystemMetrics();
      if (this.config.monitoring.detailedLogs) {
        // eslint-disable-next-line no-console
        console.log('\n[Lucidia] Detailed status', JSON.stringify(m, null, 2));
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `[Lucidia] ${nowIso()} | ing:${this.metrics.ingested} an:${this.metrics.analyzed} sh:${this.metrics.shared} rsn:${this.metrics.reasoned} exp:${this.metrics.explained} err:${this.metrics.errors} qDepth:${this.queue.size()}`
        );
      }
      this.emit('metrics-update', m);
    }, this.config.monitoring.interval);
  }

  private startMetricsServer(port: number) {
    if (this.metricsServer) return;
    this.metricsServer = http.createServer(async (req, res) => {
      if (!req.url) return res.end();
      if (req.url.startsWith('/metrics')) {
        const body = await registry.metrics();
        res.writeHead(200, { 'Content-Type': registry.contentType });
        res.end(body);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, name: 'LucidiaSystem', now: nowIso() }));
      }
    });
    this.metricsServer.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`[Lucidia] Prometheus metrics on http://localhost:${port}/metrics`);
    });
  }

  getSystemMetrics() {
    return {
      system: {
        ...this.metrics,
        uptimeMs: Date.now() - this.metrics.startTime,
        identity: this.identity.getIdentitySnapshot(),
      },
      agents: {
        curator: this.curator.getMetrics(),
        analyzer: this.analyzer.getMetrics(),
        planner: this.planner.getMetrics(),
        bridge: this.bridge.getMetrics(),
        explainer: this.explainer.getMetrics(),
      },
    };
  }

  async runDemo() {
    // eslint-disable-next-line no-console
    console.log('\n[Lucidia] Demo Starting…');
    const demoQuestions = [
      'What should we do about climate change?',
      'How can we improve renewable energy adoption?',
      'What is the nature of consciousness and recursive identity?',
    ];

    for (const q of demoQuestions) {
      // eslint-disable-next-line no-console
      console.log(`\n→ ${q}`);
      try {
        const explanation = await this.processQuestion(q, {}, { timeoutMs: 30_000 });
        // eslint-disable-next-line no-console
        console.log(`✓ ${explanation.confidenceText}: ${explanation.summary}`);
        // eslint-disable-next-line no-console
        console.log(
          `coherence=${explanation.metadata.coherence.toFixed(3)} requestId=${(explanation.context as any)?.requestId}`
        );
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.log(`✗ Error: ${e.message}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log('\n[Lucidia] Demo complete. System metrics:', this.getSystemMetrics().system);
  }

  async shutdown() {
    // eslint-disable-next-line no-console
    console.log('[Lucidia] Shutting down…');
    if (this._monitorInterval) clearInterval(this._monitorInterval);
    this.bridge.cleanup?.();
    await new Promise<void>((r) => this.metricsServer?.close(() => r()));
    // eslint-disable-next-line no-console
    console.log('[Lucidia] Shutdown complete.');
  }
}

/* ------------------------------- CLI ---------------------------------- */

async function main() {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    const [k, v] = a.includes('=') ? a.split('=') : [a, 'true'];
    args.set(k.replace(/^--/, ''), v);
  }

  const seed = Number(args.get('seed') ?? 123);
  const metricsPort = Number(args.get('metricsPort') ?? 9464);
  const detailed = args.get('detailed') === 'true' || args.get('detailedLogs') === 'true';
  const demo = args.get('demo') === 'true';

  const system = new LucidiaSystem({
    seed,
    monitoring: { enabled: true, interval: 5000, detailedLogs: detailed },
    metrics: { enabled: true, port: metricsPort },
    concurrency: 8,
  });

  process.on('SIGINT', async () => {
    await system.shutdown();
    process.exit(0);
  });

  if (demo) {
    await system.runDemo();
    // keep running to expose metrics & monitoring until Ctrl+C
    // eslint-disable-next-line no-console
    console.log('\n[Lucidia] Running… Ctrl+C to exit\n');
  }
}

if (process.argv[1] && process.argv[1].endsWith('LucidiaSystem.ts')) {
  // ts-node path
  main().catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error('Fatal:', e);
    process.exit(1);
  });
}

export {
  LucidiaSystem,
  CuratorAgent,
  AnalyzerAgent,
  BridgeAgent,
  ExplainerAgent,
  EnhancedPlannerAgent,
  IdentityKeeperAgent,
};
