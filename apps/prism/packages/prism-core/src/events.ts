import {PrismEvent} from './types';

export type EventListener = (event: PrismEvent) => void | Promise<void>;

export interface EventBus {
  publish(event: PrismEvent): Promise<void>;
  subscribe(listener: EventListener): () => void;
  history(): PrismEvent[];
  drain(): PrismEvent[];
  clear(): void;
  size(): number;
}

export interface EventBusOptions {
  initial?: PrismEvent[];
  onPublish?: EventListener;
}

/**
 * Lightweight in-memory event bus that records every event while allowing
 * subscribers to react to future publications. Designed so tests can assert on
 * event order without needing an external queueing system.
 */
export function createEventBus(options: EventBusOptions = {}): EventBus {
  const events: PrismEvent[] = [...(options.initial ?? [])];
  const listeners = new Set<EventListener>();

  const dispatch = async (event: PrismEvent) => {
    const errors: unknown[] = [];
    if (options.onPublish) {
      try {
        await options.onPublish(event);
      } catch (err) {
        errors.push(err);
      }
    }
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (err) {
        errors.push(err);
      }
    }
    if (errors.length) {
      throw new AggregateError(errors, 'One or more event listeners failed');
    }
  };

  return {
    async publish(event) {
      events.push(event);
      await dispatch(event);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    history() {
      return [...events];
    },
    drain() {
      const snapshot = [...events];
      events.length = 0;
      return snapshot;
    },
    clear() {
      events.length = 0;
    },
    size() {
      return events.length;
    },
  };
}

export interface WaitForOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Resolves with the first event that matches the predicate. If a timeout is
 * provided the promise rejects once it elapses. Previously recorded events are
 * checked before listening for new ones so callers can await immediately after
 * triggering a side effect.
 */
export function waitForEvent(
  bus: EventBus,
  predicate: (event: PrismEvent) => boolean,
  options: WaitForOptions = {}
): Promise<PrismEvent> {
  const {timeoutMs, signal} = options;
  return new Promise<PrismEvent>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const maybeResolve = (event: PrismEvent) => {
      if (settled || !predicate(event)) {
        return false;
      }
      settled = true;
      cleanup();
      resolve(event);
      return true;
    };

    const cleanup = () => {
      unsubscribe();
      if (timer) {
        clearTimeout(timer);
      }
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('waitForEvent aborted'));
    };

    const unsubscribe = bus.subscribe((event) => {
      maybeResolve(event);
    });

    for (const event of bus.history()) {
      if (maybeResolve(event)) {
        return;
      }
    }

    if (timeoutMs != null) {
      timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Timed out waiting for event after ${timeoutMs}ms`));
      }, timeoutMs);
    }

    if (signal) {
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort);
      }
    }
  });
}

export function pipeEvents(source: EventBus, target: EventBus): () => void {
  return source.subscribe((event) => target.publish(event));
}
