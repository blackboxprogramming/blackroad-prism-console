export type TestPrediction = {
  file: string;
  reason: string;
  weight: number;
};

export type DiffIntel = {
  path: string;
  summary: string;
  functionsChanged?: string[];
  testsPredicted: TestPrediction[];
};

export type GraphNode = {
  id: string;
  kind: 'file' | 'process' | 'service' | 'endpoint' | 'env' | 'container';
  label: string;
  attrs?: Record<string, any>;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: 'writes' | 'reads' | 'spawns' | 'deploys' | 'exposes' | 'depends';
  attrs?: Record<string, any>;
};

export type PrismDiff = {
  path: string;
  patch: string;
};
