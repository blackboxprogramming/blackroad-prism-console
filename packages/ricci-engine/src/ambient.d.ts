declare module '@blackroad/sb-engine/sinkhorn/logsinkhorn.js' {
  interface SinkhornIterate {
    iteration: number;
    marginalError: number;
    dualGap: number;
  }
  interface SinkhornOutputs {
    coupling: Float64Array;
    iterations: number;
    converged: boolean;
    history: SinkhornIterate[];
  }
  interface SinkhornConfig {
    epsilon: number;
    maxIterations?: number;
    tolerance?: number;
    checkInterval?: number;
  }
  export function logSinkhorn(
    mu: Float64Array,
    nu: Float64Array,
    cost: Float64Array,
    rows: number,
    cols: number,
    config: SinkhornConfig
  ): SinkhornOutputs;
}

type Buffer = any;
declare const Buffer: any;

declare module 'pngjs' {
  interface PngOptions {
    width: number;
    height: number;
  }
  export class PNG {
    width: number;
    height: number;
    data: Buffer;
    constructor(options: PngOptions);
    static sync: {
      write(png: PNG): Buffer;
      read(buffer: Buffer): PNG;
    };
  }
}

declare module 'fs' {
  export function mkdirSync(path: string, options?: unknown): void;
  export function writeFileSync(path: string, data: unknown, options?: unknown): void;
  export function readFileSync(path: string): Buffer;
  export function mkdtempSync(prefix: string): string;
  export function rmSync(path: string, options?: unknown): void;
}

declare module 'path' {
  export function join(...segments: string[]): string;
}

declare module 'zlib' {
  export function deflateSync(buffer: Buffer): Buffer;
}
