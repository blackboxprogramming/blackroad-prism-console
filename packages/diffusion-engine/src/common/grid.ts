export interface GridConfig {
  width: number;
  height: number;
  domain: number; // domain extends from -domain to +domain
}

export class RectGrid {
  readonly width: number;
  readonly height: number;
  readonly domain: number;
  readonly dx: number;
  readonly dy: number;
  readonly x: Float32Array;
  readonly y: Float32Array;

  constructor(cfg: GridConfig) {
    if (cfg.width <= 1 || cfg.height <= 1) {
      throw new Error('Grid must be at least 2x2');
    }
    this.width = cfg.width;
    this.height = cfg.height;
    this.domain = cfg.domain;
    this.dx = (2 * cfg.domain) / (cfg.width - 1);
    this.dy = (2 * cfg.domain) / (cfg.height - 1);
    this.x = new Float32Array(cfg.width);
    this.y = new Float32Array(cfg.height);
    for (let i = 0; i < cfg.width; i++) {
      this.x[i] = -cfg.domain + i * this.dx;
    }
    for (let j = 0; j < cfg.height; j++) {
      this.y[j] = -cfg.domain + j * this.dy;
    }
  }

  index(i: number, j: number): number {
    return j * this.width + i;
  }

  forEach(callback: (i: number, j: number, x: number, y: number) => void) {
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        callback(i, j, this.x[i], this.y[j]);
      }
    }
  }
}
