declare module 'node:events' {
  class EventEmitter {
    constructor(options?: { captureRejections?: boolean });
    on(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
    emit(event: string, ...args: unknown[]): boolean;
    setMaxListeners(count: number): this;
  }
  export { EventEmitter };
}

declare module 'node:assert' {
  export const strict: {
    (value: unknown, message?: string): asserts value;
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    match(value: string, regExp: RegExp, message?: string): void;
    ok(value: unknown, message?: string): asserts value;
  };
}

declare module 'node:assert/strict' {
  import { strict } from 'node:assert';
  export default strict;
}

declare module 'node:test' {
  type TestFn = () => void | Promise<void>;
  function test(name: string, fn: TestFn): Promise<void>;
  export default test;
}

declare module 'node:fs' {
  export const promises: {
    readFile(path: string, encoding: string): Promise<string>;
    writeFile(path: string, data: string): Promise<void>;
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  };
}

declare module 'node:path' {
  export function dirname(path: string): string;
}

declare namespace NodeJS {
  interface ErrnoException extends Error {
    code?: string;
  }
}

declare module 'node:http' {
  export class ServerResponse {
    writeHead(status: number, headers: Record<string, string>): void;
    write(chunk: string): void;
    end(): void;
  }
}

declare module 'graphql' {
  export interface ExecutionResult<TData = unknown> {
    data?: TData;
    errors?: { message: string }[];
  }

  export class GraphQLSchema {
    constructor(config: unknown);
  }

  export class GraphQLObjectType<T = unknown> {
    constructor(config: unknown);
  }

  export class GraphQLScalarType {
    constructor(config: unknown);
  }

  export class GraphQLInputObjectType {
    constructor(config: unknown);
  }

  export class GraphQLList<T = unknown> {
    constructor(type: T);
  }

  export class GraphQLNonNull<T = unknown> {
    constructor(type: T);
  }

  export const GraphQLString: unknown;

  export function graphql(args: {
    schema: GraphQLSchema;
    source: string;
    variableValues?: Record<string, unknown>;
    rootValue?: unknown;
  }): Promise<ExecutionResult>;
}
