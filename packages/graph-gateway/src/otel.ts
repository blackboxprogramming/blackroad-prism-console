export interface Span {
  name: string;
  start: number;
  end(): void;
}

export function createSpan(name: string): Span {
  const start = Date.now();
  return {
    name,
    start,
    end() {
      const duration = Date.now() - start;
      if (process.env.GRAPH_LABS_DEBUG) {
        console.log(`[otel] ${name} duration=${duration}ms`);
      }
    }
  };
import type { YogaServerInstance } from '@graphql-yoga/node';
import EventEmitter from 'eventemitter3';

export const events = new EventEmitter();

export function instrumentYoga(yoga: YogaServerInstance<any, any>) {
  yoga.use(({ request }, next) => {
    const spanId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    events.emit('span:start', { spanId, operationName: request.headers.get('operation-name') });
    return next().then((result) => {
      events.emit('span:end', { spanId });
      return result;
    });
  });
}
