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
