declare module '@blackroad/ot-engine' {
  export type DensityField = {
    width: number;
    height: number;
    data: Float64Array | Float32Array | number[];
    cellArea?: number;
  };

  export type Site = { x: number; y: number };

  export type SemiDiscreteResult = {
    weights: Float64Array;
    masses: Float64Array;
    areas: Float64Array;
    owner: Uint32Array;
    iterations: number;
    converged: boolean;
  };

  export type DynamicResult = {
    frames: { width: number; height: number; data: Float64Array }[];
    flows: {
      width: number;
      height: number;
      vx: Float64Array;
      vy: Float64Array;
      rhoAvg: Float64Array;
    }[];
    costs: number[];
    totalCost: number;
    continuityResidual: number;
  };

  export function solveWeights(params: {
    density: DensityField;
    sites: Site[];
    targetMasses: number[];
    options?: Record<string, unknown>;
  }): SemiDiscreteResult;

  export function rasterizePowerDiagram(
    sites: Site[],
    weights: number[],
    density: DensityField,
    options?: { includeMass?: boolean }
  ): { owner: Uint32Array; areas: Float64Array; masses?: Float64Array };

  export function buildDynamicInterpolation(params: {
    rho0: DensityField;
    rho1: DensityField;
    steps?: number;
    options?: Record<string, unknown>;
  }): DynamicResult;
}
