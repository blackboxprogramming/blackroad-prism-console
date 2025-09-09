const graph = {
  a: { b: 1, c: 1 },
  b: { a: 1, c: 1 },
  c: { a: 1, b: 1 },
};

function computeCurvature(g) {
  const edges = [];
  const nodes = Object.keys(g);
  nodes.forEach((u) => {
    Object.keys(g[u]).forEach((v) => {
      if (u < v) {
        const Nu = Object.keys(g[u]);
        const Nv = Object.keys(g[v]);
        const inter = Nu.filter((x) => Nv.includes(x)).length;
        const maxDeg = Math.max(Nu.length, Nv.length) || 1;
        const W1 = 1 - inter / maxDeg;
        const kappa = 1 - W1;
        edges.push({ u, v, kappa: Number(kappa.toFixed(3)) });
      }
    });
  });
  return edges;
}

module.exports = function attachCurvature({ app }) {
  app.get('/api/trust/curvature', (_req, res) => {
    const results = computeCurvature(graph);
    res.json(results);
  });
};
