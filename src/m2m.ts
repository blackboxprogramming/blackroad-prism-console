// Advanced Machine-to-Machine Communication & Auto-Repair System (TypeScript refactor)
// - Strong typing, enums, retries with jitter, circuit breaker
// - EWMA smoothing + hysteresis to avoid thrash
// - Idempotent repairs, structured logs, open/closed repair registry
// - Deterministic demo with safe stubs for missing infra

// ----------------------------- Types & Enums ------------------------------

export type NodeId = string;

export enum NodeStatus {
  ACTIVE = 'ACTIVE',
  DEGRADED = 'DEGRADED',
  QUIESCED = 'QUIESCED',
  OFFLINE = 'OFFLINE',
}

export enum ConnStatus {
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  CLOSED = 'CLOSED',
}

export type Proto = 'TCP' | 'UDP' | 'WebSocket' | 'MQTT' | 'CoAP';

export interface HealthMetrics {
  cpu: number;            // 0..100 %
  memory: number;         // 0..100 %
  network: number;        // synthetic utilization 0..100
  storage: number;        // 0..100 %
  temperature: number;    // °C
  powerLevel: number;     // 0..100 %
  timestamp: number;
}

export interface NetMetrics {
  latency: number;        // ms
  bandwidth: number;      // Mbps
  packetLoss: number;     // 0..1
  reliability: number;    // 0..1  (NOTE: reliability = 1 - packetLoss)
}

export interface Diagnostic {
  timestamp: number;
  nodeId: NodeId;
  level: 'QUICK' | 'FULL';
  results: Record<string, unknown>;
  error?: string;
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Issue {
  type: 'HIGH_CPU' | 'HIGH_MEMORY' | 'PACKET_LOSS' | 'NETWORK_FAILURE' | string;
  severity: Severity;
  value?: number;
}

export interface RepairAction {
  type:
    | 'PROTOCOL_RESET'
    | 'CONNECTION_REBUILD'
    | 'MEMORY_CLEANUP'
    | 'CACHE_FLUSH'
    | 'CONFIG_RESTORE'
    | 'SERVICE_RESTART'
    | 'ADAPTIVE_TUNING'
    | 'MANUAL_INTERVENTION'
    | string;
  canAutoRepair: boolean;
  estimatedTime: number;          // ms
  successProbability: number;     // 0..1
  parameters?: Record<string, unknown>;
  rollbackPlan?: string;
  serviceName?: string;
  backupId?: string;
}

export interface WireMessage<V = unknown> {
  id: string;
  type: 'DIAG' | 'REPAIR_REQ' | 'REPAIR_ACK' | 'HEALTH' | 'DATA' | string;
  schema: 'm2m.v1';
  ts: number;
  src: NodeId;
  dst: NodeId;
  body: V;
  // signatures/nonce could be added here later
}

// ----------------------------- Utilities ----------------------------------

declare const process: { argv: string[] };

function uuidv7like(): string {
  // Prefer runtime uuid if available; else simple fallback
  const u = (globalThis as any).crypto?.randomUUID?.();
  if (u) return u;
  return 'u' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function log(node: NodeId, type: string, data: unknown, span?: string) {
  // structured JSON logs for ingestion
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: Date.now(), node, type, span, data }));
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts = { retries: 5, baseMs: 100, maxMs: 5000, jitter: true }
): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > opts.retries) throw err;
      const backoff = Math.min(opts.baseMs * 2 ** (attempt - 1), opts.maxMs);
      const sleep = opts.jitter ? backoff * (0.5 + Math.random()) : backoff;
      await new Promise((r) => setTimeout(r, sleep));
    }
  }
}

export class CircuitBreaker {
  private failures = 0;
  private lastOpenedAt = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF' = 'CLOSED';
  constructor(private threshold = 5, private coolMs = 15000) {}
  canPass(): boolean {
    if (this.state === 'OPEN' && Date.now() - this.lastOpenedAt > this.coolMs) {
      this.state = 'HALF';
    }
    return this.state !== 'OPEN';
  }
  onSuccess() {
    this.failures = 0;
    if (this.state !== 'CLOSED') this.state = 'CLOSED';
  }
  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.lastOpenedAt = Date.now();
    }
  }
}

export class Ewma {
  private v: number | null = null;
  constructor(private alpha = 0.3) {}
  push(x: number) {
    this.v = this.v === null ? x : this.alpha * x + (1 - this.alpha) * this.v;
    return this.v;
  }
  value() {
    return this.v ?? 0;
  }
}

// Tiny TTL set for idempotency (message dedupe)
class TTLSet {
  private map = new Map<string, number>();
  constructor(private ttlMs: number, private max = 5000) {}
  has(id: string) {
    this.gc();
    return this.map.has(id);
  }
  add(id: string) {
    this.gc();
    this.map.set(id, Date.now() + this.ttlMs);
  }
  private gc() {
    const now = Date.now();
    for (const [k, exp] of this.map) if (exp <= now) this.map.delete(k);
    // simple size cap
    if (this.map.size > this.max) {
      const keys = Array.from(this.map.keys()).slice(0, this.map.size - this.max);
      keys.forEach((k) => this.map.delete(k));
    }
  }
}

// -------------------------- Protocol Selection ----------------------------

const PROTOS: Proto[] = ['TCP', 'UDP', 'WebSocket', 'MQTT', 'CoAP'];

function scoreProtocol(
  p: Proto,
  r: { latency: number; bandwidth: number; packetLoss: number; reliability: number }
) {
  // Normalize to 0..1 (lower latency/loss better; higher bandwidth/reliability better)
  const lat = Math.max(0, 1 - r.latency / 200);       // 0 at 200ms+
  const bw = Math.min(1, r.bandwidth / 10000);        // cap at 10Gbps
  const rel = Math.min(1, r.reliability);
  const loss = Math.max(0, 1 - r.packetLoss);         // 1 means no loss
  const base = lat * 0.35 + bw * 0.25 + rel * 0.30 + loss * 0.10;

  // Simple priors per protocol
  const prior: Record<Proto, number> = { TCP: 0.9, UDP: 0.8, WebSocket: 0.85, MQTT: 0.8, CoAP: 0.7 };
  return base * prior[p];
}

function selectOptimalProtocol(req: {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  reliability: number;
}): Proto {
  return PROTOS.map((p) => [p, scoreProtocol(p, req)] as const).sort((a, b) => b[1] - a[1])[0][0];
}

// ------------------------------ Repairs -----------------------------------

type Strategy = (issue: Issue) => RepairAction | null;

class RepairRegistry {
  private strategies: Record<string, Strategy[]> = {};
  register(issueType: string, fn: Strategy) {
    (this.strategies[issueType] ??= []).push(fn);
  }
  plan(issue: Issue): RepairAction {
    const fns = this.strategies[issue.type] ?? [];
    for (const fn of fns) {
      const plan = fn(issue);
      if (plan) return plan;
    }
    return {
      type: 'MANUAL_INTERVENTION',
      canAutoRepair: false,
      estimatedTime: 0,
      successProbability: 0,
    };
  }
}

// ---------------------------- Core Classes --------------------------------

export class M2MConnection {
  status: ConnStatus = ConnStatus.INITIALIZING;
  metrics: NetMetrics = { latency: 0, bandwidth: 0, packetLoss: 0, reliability: 1 };
  lastProtocolSwitch = 0;

  constructor(
    public readonly sourceNode: M2MNode,
    public readonly targetNode: M2MNode,
    public protocol: Proto
  ) {}

  async initialize() {
    // Simulate connection establishment
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.status = ConnStatus.ACTIVE;
  }
}

export class ProtocolStack {
  // hysteresis: require N better decisions before switching to avoid flapping
  private consecutiveBetter = 0;
  private lastChoice: Proto | null = null;
  private readonly HYSTERESIS = 3;

  select(req: { latency: number; bandwidth: number; packetLoss: number; reliability: number }): Proto {
    const choice = selectOptimalProtocol(req);
    if (this.lastChoice === choice) {
      this.consecutiveBetter = 0;
      return choice;
    }
    // only switch if repeated better recommendation occurs
    this.consecutiveBetter++;
    if (this.consecutiveBetter >= this.HYSTERESIS) {
      this.lastChoice = choice;
      this.consecutiveBetter = 0;
      return choice;
    }
    return this.lastChoice ?? choice;
  }

  reset() {
    this.lastChoice = null;
    this.consecutiveBetter = 0;
  }
}

export class AutoRepairAgent {
  constructor(private readonly registry: RepairRegistry) {}
  generateRepairPlan(issue: Issue): RepairAction {
    return this.registry.plan(issue);
  }
}

export class M2MNode {
  status: NodeStatus = NodeStatus.ACTIVE;
  capabilities: Record<string, unknown>;
  healthMetrics: HealthMetrics;
  connections = new Map<NodeId, M2MConnection>();
  diagnosticHistory: Diagnostic[] = [];
  eventHistory: Array<{ ts: number; node: NodeId; type: string; data: unknown }> = [];
  protocolStack = new ProtocolStack();
  private registry = new RepairRegistry();
  repairAgent = new AutoRepairAgent(this.registry);
  private inflightRepairs = new Set<string>();
  private breaker = new CircuitBreaker(4, 8000);
  private _healthStop?: () => void;
  private ewma = {
    cpu: new Ewma(0.25),
    memory: new Ewma(0.25),
    temperature: new Ewma(0.2),
  };
  private msgDedupe = new TTLSet(60_000);
  private routeBlacklist = new Set<string>();

  constructor(public readonly nodeId: NodeId, capabilities: Record<string, unknown> = {}) {
    this.capabilities = {
      diagnostics: true,
      selfRepair: true,
      remoteRepair: true,
      dataSync: true,
      protocolAdaptation: true,
      ...capabilities,
    };
    this.healthMetrics = {
      cpu: 0,
      memory: 0,
      network: 0,
      storage: 0,
      temperature: 25,
      powerLevel: 100,
      timestamp: Date.now(),
    };
    this.registerDefaultRepairs();
    this.startHealthMonitoring();
  }

  // --------------------------- Connections --------------------------------

  async establishConnection(targetNode: M2MNode, protocol: Proto = 'TCP'): Promise<M2MConnection> {
    const span = `conn-${this.nodeId}->${targetNode.nodeId}`;
    if (!this.breaker.canPass()) throw new Error('Circuit open: refusing to establish connection');

    return await retry(async () => {
      try {
        const conn = new M2MConnection(this, targetNode, protocol);
        await conn.initialize();
        this.connections.set(targetNode.nodeId, conn);
        this.logEvent('CONNECTION_ESTABLISHED', { target: targetNode.nodeId, protocol }, span);
        await this.performCapabilityHandshake();
        return conn;
      } catch (error: any) {
        this.logEvent('CONNECTION_FAILED', { target: targetNode.nodeId, error: error?.message }, span);
        // Auto-retry with different protocols
        if (protocol === 'TCP') return this.establishConnection(targetNode, 'UDP');
        if (protocol === 'UDP') return this.establishConnection(targetNode, 'WebSocket');
        this.breaker.onFailure();
        throw new Error(`Failed all protocols: ${error?.message ?? String(error)}`);
      }
    });
  }

  // ----------------------------- Diagnostics ------------------------------

  async performDiagnostics(level: 'QUICK' | 'FULL' = 'FULL'): Promise<Diagnostic> {
    const diagnostic: Diagnostic = {
      timestamp: Date.now(),
      nodeId: this.nodeId,
      level,
      results: {},
    };
    try {
      diagnostic.results.systemHealth = await this.checkSystemHealth();
      diagnostic.results.networkHealth = await this.testNetworkConnectivity();
      diagnostic.results.protocolHealth = await this.validateProtocolStack();
      if (level === 'FULL') {
        diagnostic.results.performance = await this.runPerformanceBenchmarks();
      }
      diagnostic.results.security = await this.performSecurityAudit();
      diagnostic.results.predictive = await this.analyzeTrends();

      this.diagnosticHistory.push(diagnostic);
      await this.analyzeAndRepair(diagnostic);
      return diagnostic;
    } catch (error: any) {
      diagnostic.error = error?.message ?? String(error);
      this.logEvent('DIAGNOSTIC_FAILED', diagnostic);
      return diagnostic;
    }
  }

  async analyzeAndRepair(diagnostic: Diagnostic) {
    const issues = this.identifyIssues(diagnostic);
    for (const issue of issues) {
      const repairAction = this.repairAgent.generateRepairPlan(issue);
      if (repairAction.canAutoRepair) {
        await this.executeRepair(repairAction);
      } else {
        await this.escalateToNetwork(issue, repairAction);
      }
    }
  }

  async executeRepair(action: RepairAction) {
    if (this.inflightRepairs.has(action.type)) return; // idempotent: already running
    this.inflightRepairs.add(action.type);
    const span = `repair-${action.type}-${uuidv7like()}`;
    try {
      this.logEvent('REPAIR_STARTED', action, span);
      switch (action.type) {
        case 'PROTOCOL_RESET':
          await this.resetProtocolStack();
          break;
        case 'CONNECTION_REBUILD':
          await this.rebuildConnections();
          break;
        case 'MEMORY_CLEANUP':
          await this.performMemoryCleanup();
          break;
        case 'CACHE_FLUSH':
          await this.flushCaches();
          break;
        case 'CONFIG_RESTORE':
          await this.restoreConfiguration(action.backupId ?? 'latest');
          break;
        case 'SERVICE_RESTART':
          await this.restartService(action.serviceName ?? 'm2m');
          break;
        case 'ADAPTIVE_TUNING':
          await this.performAdaptiveTuning(action.parameters ?? {});
          break;
        default:
          await this.executeCustomRepair(action);
      }
      const verification = await this.verifyRepair(action);
      if (verification.success) {
        this.logEvent('REPAIR_SUCCESSFUL', { action: action.type, metrics: verification.metrics }, span);
        this.breaker.onSuccess();
      } else {
        this.logEvent('REPAIR_FAILED', { action: action.type, reason: verification.reason }, span);
        await this.escalateRepair(action);
        this.breaker.onFailure();
      }
    } catch (error: any) {
      this.logEvent('REPAIR_ERROR', { action: action.type, error: error?.message ?? String(error) }, span);
      await this.escalateRepair(action);
      this.breaker.onFailure();
    } finally {
      this.inflightRepairs.delete(action.type);
    }
  }

  // --------------------------- Collaboration ------------------------------

  async escalateToNetwork(issue: Issue, suggested: RepairAction) {
    const peers = Array.from(this.connections.values())
      .filter((c) => c.status === ConnStatus.ACTIVE)
      .map((c) => c.targetNode);

    const request: WireMessage<{ issue: Issue; suggested: RepairAction }> = {
      id: uuidv7like(),
      type: 'REPAIR_REQ',
      schema: 'm2m.v1',
      ts: Date.now(),
      src: this.nodeId,
      dst: 'broadcast',
      body: { issue, suggested },
    };

    const responses = await Promise.allSettled(
      peers.map((node) => this.sendRepairRequest(node, request))
    );

    const ok = responses.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value);
    if (ok.length === 0) return;

    const best = this.selectBestRepairSolution(ok);
    await this.executeCollaborativeRepair(best);
  }

  // --------------------------- Routing & Protocol -------------------------

  async adaptProtocol(conn: M2MConnection, current: NetMetrics) {
    const choice = this.protocolStack.select({
      latency: current.latency,
      bandwidth: current.bandwidth,
      packetLoss: current.packetLoss,
      reliability: current.reliability,
    });
    if (choice !== conn.protocol) {
      await this.switchProtocol(conn, choice);
    }
  }

  async routeMessage(
    message: WireMessage,
    targetNodeId: NodeId,
    options: { excludeRoute?: string } = {}
  ): Promise<{ ok: boolean }> {
    let route = await this.findOptimalRoute(targetNodeId, options);
    if (!route) {
      await this.discoverRoutes(targetNodeId);
      route = await this.findOptimalRoute(targetNodeId, options);
      if (!route) throw new Error(`No route available to ${targetNodeId}`);
    }

    try {
      const result = await this.transmitViaRoute(message, route);
      this.updateRouteMetrics(route, result);
      return result;
    } catch (error) {
      // Invalidate route and retry alternate
      this.invalidateRoute(route);
      return await this.routeMessage(message, targetNodeId, { ...options, excludeRoute: route });
    }
  }

  // ----------------------- Predictive & Monitoring ------------------------

  async performPredictiveAnalysis() {
    const trends = {
      performance: this.analyzePerformanceTrend(),
      reliability: this.analyzeReliabilityTrend(),
      capacity: this.analyzeCapacityTrend(),
      security: this.analyzeSecurityTrend(),
    };
    const predictions = {
      maintenanceNeeded: this.predictMaintenanceWindow(trends),
      failureProbability: this.calculateFailureProbability(trends),
      capacityExhaustion: this.predictCapacityExhaustion(trends),
      securityVulnerabilities: this.predictSecurityIssues(trends),
    };
    if (predictions.maintenanceNeeded.confidence > 0.8) {
      await this.scheduleProactiveMaintenance(predictions.maintenanceNeeded);
    }
    return predictions;
  }

  startHealthMonitoring() {
    this._healthStop?.();
    const handle = setInterval(async () => {
      this.healthMetrics = await this.collectHealthMetrics();
      // EWMA smoothing
      this.ewma.cpu.push(this.healthMetrics.cpu);
      this.ewma.memory.push(this.healthMetrics.memory);
      this.ewma.temperature.push(this.healthMetrics.temperature);

      // anomaly & hysteresis: only trigger if sustained for 3 samples
      if (this.detectAnomalies(this.healthMetrics)) {
        await this.performDiagnostics('QUICK');
      }

      // broadcast
      this.broadcastHealthStatus();
    }, 5000);
    this._healthStop = () => clearInterval(handle);
  }
  stopHealthMonitoring() {
    this._healthStop?.();
    this._healthStop = undefined;
  }

  // ------------------------------- Stubs ----------------------------------

  async performCapabilityHandshake() {
    return { ok: true, caps: this.capabilities };
  }
  async checkSystemHealth() {
    return { cpu: this.healthMetrics.cpu, memory: this.healthMetrics.memory, temperature: this.healthMetrics.temperature };
  }
  async testNetworkConnectivity() {
    const packetLoss = Math.random() * 0.05;
    const latency = 10 + Math.random() * 40;
    const bandwidth = 100 + Math.random() * 900; // Mbps
    return { packetLoss, latency, bandwidth };
  }
  async validateProtocolStack() {
    return { ok: true };
  }
  async runPerformanceBenchmarks() {
    return { tps: 1000 + Math.floor(Math.random() * 500) };
  }
  async performSecurityAudit() {
    return { ok: true, findings: [] as string[] };
  }
  async analyzeTrends() {
    return { drift: {} };
  }

  identifyIssues(diagnostic: Diagnostic): Issue[] {
    const issues: Issue[] = [];
    const sys = diagnostic.results.systemHealth as any;
    const net = diagnostic.results.networkHealth as any;

    if (sys?.cpu > 90) issues.push({ type: 'HIGH_CPU', severity: 'HIGH', value: sys.cpu });
    if (sys?.memory > 85) issues.push({ type: 'HIGH_MEMORY', severity: 'MEDIUM', value: sys.memory });
    if (net?.packetLoss > 0.05) issues.push({ type: 'PACKET_LOSS', severity: 'HIGH', value: net.packetLoss });

    // Simulated network failure: if all connections are failed
    const allFailed = Array.from(this.connections.values()).every((c) => c.status !== ConnStatus.ACTIVE);
    if (allFailed) issues.push({ type: 'NETWORK_FAILURE', severity: 'HIGH' });

    return issues;
  }

  // ------------- Repair primitives (safe no-ops for demo) -----------------

  async resetProtocolStack() {
    this.protocolStack.reset();
    this.logEvent('PROTOCOL_STACK_RESET', {});
    await new Promise((r) => setTimeout(r, 300));
  }
  async rebuildConnections() {
    for (const [id, conn] of this.connections) {
      try {
        await conn.initialize();
        conn.status = ConnStatus.ACTIVE;
        this.logEvent('CONNECTION_REBUILT', { peer: id });
      } catch {
        conn.status = ConnStatus.FAILED;
      }
    }
  }
  async performMemoryCleanup() {
    // simulate resource cleanup
    await new Promise((r) => setTimeout(r, 200));
  }
  async flushCaches() {
    await new Promise((r) => setTimeout(r, 150));
  }
  async restoreConfiguration(_backupId: string) {
    await new Promise((r) => setTimeout(r, 250));
  }
  async restartService(_name: string) {
    await new Promise((r) => setTimeout(r, 400));
  }
  async performAdaptiveTuning(_params: Record<string, unknown>) {
    // nudge metrics downwards as if tuning worked
    this.healthMetrics.cpu = Math.max(0, this.healthMetrics.cpu - 10);
    this.healthMetrics.memory = Math.max(0, this.healthMetrics.memory - 8);
    await new Promise((r) => setTimeout(r, 300));
  }
  async executeCustomRepair(_action: RepairAction) {
    await new Promise((r) => setTimeout(r, 300));
  }
  async verifyRepair(_action: RepairAction): Promise<{ success: boolean; metrics?: any; reason?: string }> {
    // naive: success if cpu/memory now below thresholds
    const ok = this.healthMetrics.cpu <= 90 && this.healthMetrics.memory <= 85;
    return ok
      ? { success: true, metrics: { cpu: this.healthMetrics.cpu, memory: this.healthMetrics.memory } }
      : { success: false, reason: 'post-metrics still above threshold' };
  }
  async escalateRepair(action: RepairAction) {
    this.logEvent('REPAIR_ESCALATED', { action });
  }

  // collaboration helpers
  async sendRepairRequest(
    node: M2MNode,
    request: WireMessage<{ issue: Issue; suggested: RepairAction }>
  ): Promise<{ plan: RepairAction; node: NodeId; reputation: number }> {
    // Deduplicate by message id
    if (this.msgDedupe.has(request.id)) return { plan: request.body.suggested, node: node.nodeId, reputation: 0.5 };
    this.msgDedupe.add(request.id);
    // Simulate the other node considering and replying with its plan & reputation score
    const plan = node.repairAgent.generateRepairPlan(request.body.issue);
    const reputation = Math.random() * 0.5 + 0.5; // 0.5..1.0
    return { plan, node: node.nodeId, reputation };
  }

  selectBestRepairSolution(
    responses: Array<{ plan: RepairAction; node: NodeId; reputation: number }>
  ): { plan: RepairAction; node: NodeId } {
    // expected value: successProbability * reputation / time
    let best = responses[0];
    let bestScore =
      (best.plan.successProbability * best.reputation) / Math.max(1, best.plan.estimatedTime);
    for (const r of responses.slice(1)) {
      const s = (r.plan.successProbability * r.reputation) / Math.max(1, r.plan.estimatedTime);
      if (s > bestScore) {
        best = r;
        bestScore = s;
      }
    }
    return { plan: best.plan, node: best.node };
  }

  async executeCollaborativeRepair(best: { plan: RepairAction; node: NodeId }) {
    this.logEvent('COLLAB_REPAIR_SELECTED', best);
    await this.executeRepair(best.plan);
  }

  async switchProtocol(conn: M2MConnection, proto: Proto) {
    // Simple guard to avoid rapid switching
    const now = Date.now();
    if (now - conn.lastProtocolSwitch < 2000) return;
    const old = conn.protocol;
    conn.protocol = proto;
    conn.lastProtocolSwitch = now;
    this.logEvent('PROTOCOL_SWITCH', { peer: conn.targetNode.nodeId, from: old, to: proto });
  }

  async findOptimalRoute(targetNodeId: NodeId, options: { excludeRoute?: string } = {}) {
    // For demo: direct route if connection active
    const c = this.connections.get(targetNodeId);
    const key = `${this.nodeId}->${targetNodeId}`;
    if (options.excludeRoute && key === options.excludeRoute) return null;
    if (this.routeBlacklist.has(key)) return null;
    if (c && c.status === ConnStatus.ACTIVE) return key;
    return null;
  }
  async discoverRoutes(_targetNodeId: NodeId) {
    // No-op in demo; in real system, run mesh discovery (KSP, gossip)
  }
  async transmitViaRoute(_msg: WireMessage, _route: string): Promise<{ ok: boolean }> {
    return { ok: true };
  }
  updateRouteMetrics(_route: string, _result: { ok: boolean }) {
    // update internal stats
  }
  invalidateRoute(route: string) {
    this.routeBlacklist.add(route);
  }

  async scheduleProactiveMaintenance(_info: any) {
    this.logEvent('MAINTENANCE_SCHEDULED', _info);
  }

  analyzePerformanceTrend() {
    return { slope: (Math.random() - 0.5) * 0.1 };
  }
  analyzeReliabilityTrend() {
    return { slope: (Math.random() - 0.5) * 0.05 };
  }
  analyzeCapacityTrend() {
    return { slope: (Math.random() - 0.5) * 0.1 };
  }
  analyzeSecurityTrend() {
    return { slope: (Math.random() - 0.5) * 0.02 };
  }

  predictMaintenanceWindow(_t: any) {
    return { windowStart: Date.now() + 60_000, windowEnd: Date.now() + 120_000, confidence: Math.random() };
  }
  calculateFailureProbability(_t: any) {
    return Math.random() * 0.2;
  }
  predictCapacityExhaustion(_t: any) {
    return { at: Date.now() + 3600_000, confidence: Math.random() * 0.7 };
  }
  predictSecurityIssues(_t: any) {
    return { count: Math.floor(Math.random() * 2), confidence: Math.random() * 0.4 };
  }

  broadcastHealthStatus() {
    const msg: WireMessage<HealthMetrics> = {
      id: uuidv7like(),
      type: 'HEALTH',
      schema: 'm2m.v1',
      ts: Date.now(),
      src: this.nodeId,
      dst: 'broadcast',
      body: this.healthMetrics,
    };
    // In real system, publish to bus; here, log only
    this.logEvent('HEALTH_BROADCAST', msg.body);
  }

  async collectHealthMetrics(): Promise<HealthMetrics> {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      network: Math.random() * 100,
      storage: Math.random() * 100,
      temperature: 25 + Math.random() * 15,
      powerLevel: 80 + Math.random() * 20,
      timestamp: Date.now(),
    };
  }

  private anomalyCounters = { cpu: 0, memory: 0, temp: 0 };
  detectAnomalies(m: HealthMetrics) {
    // thresholds
    const highCpu = this.ewma.cpu.value() > 90;
    const highMem = this.ewma.memory.value() > 85;
    const highTemp = this.ewma.temperature.value() > 75;

    if (highCpu) this.anomalyCounters.cpu++; else this.anomalyCounters.cpu = 0;
    if (highMem) this.anomalyCounters.memory++; else this.anomalyCounters.memory = 0;
    if (highTemp) this.anomalyCounters.temp++; else this.anomalyCounters.temp = 0;

    const sustained =
      this.anomalyCounters.cpu >= 3 ||
      this.anomalyCounters.memory >= 3 ||
      this.anomalyCounters.temp >= 3;

    if (sustained) {
      this.logEvent('ANOMALY_DETECTED', {
        cpu: this.ewma.cpu.value(),
        memory: this.ewma.memory.value(),
        temperature: this.ewma.temperature.value(),
      });
    }
    return sustained;
  }

  generateId() {
    return `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  logEvent(type: string, data: unknown, span?: string) {
    log(this.nodeId, type, data, span);
    this.eventHistory.push({ ts: Date.now(), node: this.nodeId, type, data });
  }

  // ------------------------ Default Strategies ----------------------------

  private registerDefaultRepairs() {
    // HIGH_CPU -> ADAPTIVE_TUNING
    this.registry.register('HIGH_CPU', (_issue) => ({
      type: 'ADAPTIVE_TUNING',
      canAutoRepair: true,
      estimatedTime: 30_000,
      successProbability: 0.85,
      parameters: { cpuThrottling: true, processOptimization: true },
      rollbackPlan: 'manual-review',
    }));
    // HIGH_MEMORY -> MEMORY_CLEANUP
    this.registry.register('HIGH_MEMORY', (_issue) => ({
      type: 'MEMORY_CLEANUP',
      canAutoRepair: true,
      estimatedTime: 15_000,
      successProbability: 0.9,
      rollbackPlan: 'n/a',
    }));
    // PACKET_LOSS -> PROTOCOL_RESET
    this.registry.register('PACKET_LOSS', (_issue) => ({
      type: 'PROTOCOL_RESET',
      canAutoRepair: true,
      estimatedTime: 10_000,
      successProbability: 0.75,
    }));
    // NETWORK_FAILURE -> CONNECTION_REBUILD
    this.registry.register('NETWORK_FAILURE', (_issue) => ({
      type: 'CONNECTION_REBUILD',
      canAutoRepair: true,
      estimatedTime: 20_000,
      successProbability: 0.7,
    }));
  }
}

// ------------------------------ Network -----------------------------------

export class M2MNetwork {
  nodes = new Map<NodeId, M2MNode>();
  addNode<T extends M2MNode>(node: T): T {
    this.nodes.set(node.nodeId, node);
    return node;
  }

  async createMesh() {
    const arr = Array.from(this.nodes.values());
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        try {
          await arr[i].establishConnection(arr[j]);
          await arr[j].establishConnection(arr[i]);
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.warn(`Failed to connect ${arr[i].nodeId} <-> ${arr[j].nodeId}:`, err?.message ?? String(err));
        }
      }
    }
  }

  async simulateNetworkIssue(nodeId: NodeId, issueType: 'HIGH_CPU' | 'HIGH_MEMORY' | 'NETWORK_FAILURE') {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    // eslint-disable-next-line no-console
    console.log(`\n🚨 Simulating ${issueType} on node ${nodeId}`);
    switch (issueType) {
      case 'HIGH_CPU':
        node.healthMetrics.cpu = 95;
        break;
      case 'HIGH_MEMORY':
        node.healthMetrics.memory = 90;
        break;
      case 'NETWORK_FAILURE':
        node.connections.forEach((c) => (c.status = ConnStatus.FAILED));
        break;
    }
    await node.performDiagnostics('FULL');
  }
}

// ------------------------------- Demo -------------------------------------

export async function demonstrateM2MSystem() {
  // eslint-disable-next-line no-console
  console.log('🚀 Initializing Advanced M2M Network with Auto-Repair…\n');

  const network = new M2MNetwork();

  const industrialController = new M2MNode('CTRL-001', {
    industrialProtocols: true,
    realTimeProcessing: true,
    environmentalSensors: true,
  });

  const edgeGateway = new M2MNode('EDGE-001', {
    protocolTranslation: true,
    dataAggregation: true,
    cloudConnectivity: true,
  });

  const sensorCluster = new M2MNode('SENS-001', {
    massDataCollection: true,
    lowPowerMode: true,
    wirelessMesh: true,
  });

  network.addNode(industrialController);
  network.addNode(edgeGateway);
  network.addNode(sensorCluster);

  await network.createMesh();
  // eslint-disable-next-line no-console
  console.log('✅ Network established successfully\n');

  setTimeout(() => network.simulateNetworkIssue('CTRL-001', 'HIGH_CPU'), 2000);
  setTimeout(() => network.simulateNetworkIssue('EDGE-001', 'HIGH_MEMORY'), 4000);
  setTimeout(() => network.simulateNetworkIssue('SENS-001', 'NETWORK_FAILURE'), 6000);

  setInterval(async () => {
    for (const node of network.nodes.values()) {
      const predictions = await node.performPredictiveAnalysis();
      if ((predictions as any).maintenanceNeeded.confidence > 0.5) {
        // eslint-disable-next-line no-console
        console.log(`🔮 Predictive: Node ${node.nodeId} may need maintenance soon`);
      }
    }
  }, 10_000);
}

// Execute when run directly (node --experimental-strip-types src/m2m.ts)
if (typeof process !== 'undefined' && import.meta.url.endsWith(process.argv[1])) {
  demonstrateM2MSystem().catch(console.error);
}

