const templates = {
  "Symbolic Core": `prompt: |
  Implement a modular symbolic math engine for the Prism Console.
  - Parse LaTeX, SymPy, and natural language.
  - Output JSON ASTs and real-time visualization feeds.
  agent: Lucidia`,
  "Quantum Geometry": `prompt: |
  Extend the symbolic engine with Clifford algebra, tensor fields, and Bloch-sphere visualizations.
  - Implement Hamiltonian dynamics and SU(3) operations.
  agent: Helix`,
  "Fractal Dynamics": `prompt: |
  Build a fractal and chaos simulator integrated with the math engine.
  - Support Lorenz and Mandelbrot sets with real-time WebGL output.
  agent: Orion`,
  "Information Geometry": `prompt: |
  Create an information-geometry toolkit for probabilistic manifolds.
  - Fisher metrics, entropy fields, and loss-surface visualizations.
  agent: Silas`,
  "Language Bridge": `prompt: |
  Develop a math-to-language transcriber for narrative explanations.
  - Bidirectional translation between symbols and prose.
  agent: Myra`,
  "Verification & Ethics": `prompt: |
  Implement formal verification for mathematical proofs and derivations.
  - Constraint solvers, policy enforcement, and bias detection.
  agent: Vera`
};

export default templates;
