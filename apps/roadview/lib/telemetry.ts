export type TelemetryEvent = {
  type: 'search' | 'filter_change';
  payload: Record<string, unknown>;
  timestamp: string;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

type TelemetryOptions = {
  storage?: StorageLike | null;
  flushInterval?: number;
  maxBatchSize?: number;
  logger?: (events: TelemetryEvent[]) => void;
  now?: () => number;
};

const STORAGE_KEY = 'roadview.telemetry.queue';

function defaultLogger(events: TelemetryEvent[]) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[roadview][telemetry]', events);
  }
}

export class TelemetryBuffer {
  private queue: TelemetryEvent[] = [];
  private storage: StorageLike | null;
  private flushInterval: number;
  private maxBatchSize: number;
  private logger: (events: TelemetryEvent[]) => void;
  private now: () => number;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: TelemetryOptions = {}) {
    this.storage = options.storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    this.flushInterval = options.flushInterval ?? 5000;
    this.maxBatchSize = options.maxBatchSize ?? 10;
    this.logger = options.logger ?? defaultLogger;
    this.now = options.now ?? (() => Date.now());
    this.queue = this.readFromStorage();
  }

  private readFromStorage(): TelemetryEvent[] {
    if (!this.storage) return [];
    try {
      const stored = this.storage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as TelemetryEvent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to load telemetry queue', error);
      return [];
    }
  }

  private persist() {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to persist telemetry queue', error);
    }
  }

  private scheduleFlush() {
    if (this.timeout) return;
    this.timeout = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }

  track(type: TelemetryEvent['type'], payload: Record<string, unknown>) {
    const event: TelemetryEvent = {
      type,
      payload,
      timestamp: new Date(this.now()).toISOString()
    };
    this.queue.push(event);
    this.persist();
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
      return;
    }
    this.scheduleFlush();
  }

  flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.queue.length === 0) return;
    const events = [...this.queue];
    this.queue = [];
    this.persist();
    this.logger(events);
  }
}

const telemetryInstance = new TelemetryBuffer();

export function track(type: TelemetryEvent['type'], payload: Record<string, unknown>) {
  telemetryInstance.track(type, payload);
}

export function flushTelemetry() {
  telemetryInstance.flush();
}

export function createTelemetryBuffer(options: TelemetryOptions = {}) {
  return new TelemetryBuffer(options);
}
