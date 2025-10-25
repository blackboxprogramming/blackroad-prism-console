import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function bfs(residual, source, sink) {
  const n = residual.length;
  const queue = [source];
  const parent = Array(n).fill(-1);
  parent[source] = -2;
  const bottleneck = Array(n).fill(0);
  bottleneck[source] = Infinity;

  while (queue.length) {
    const u = queue.shift();
    for (let v = 0; v < n; v += 1) {
      if (parent[v] !== -1 || residual[u][v] <= 1e-9) continue;
      parent[v] = u;
      bottleneck[v] = Math.min(bottleneck[u], residual[u][v]);
      if (v === sink) {
        return { parent, flow: bottleneck[v] };
      }
      queue.push(v);
    }
  }

  return { parent, flow: 0 };
}

function edmondsKarp(capacity, source, sink) {
  const n = capacity.length;
  const residual = capacity.map((row) => row.slice());
  let flow = 0;
  const paths = [];

  while (true) {
    const { parent, flow: augFlow } = bfs(residual, source, sink);
    if (augFlow <= 0) break;
    flow += augFlow;
    paths.push({ parent: parent.slice(), flow: augFlow });

    let v = sink;
    while (v !== source) {
      const u = parent[v];
      residual[u][v] -= augFlow;
      residual[v][u] += augFlow;
      v = u;
    }
  }

  const reachable = Array(n).fill(false);
  const stack = [source];
  reachable[source] = true;
  while (stack.length) {
    const u = stack.pop();
    for (let v = 0; v < n; v += 1) {
      if (!reachable[v] && residual[u][v] > 1e-9) {
        reachable[v] = true;
        stack.push(v);
      }
    }
  }

  return {
    flow,
    cutLeft: reachable,
    cutRight: reachable.map((x) => !x),
    paths,
  };
}

const INITIAL_NODES = [
  { x: 100, y: 200, label: "s" },
  { x: 260, y: 100, label: "1" },
  { x: 260, y: 300, label: "2" },
  { x: 420, y: 100, label: "3" },
  { x: 420, y: 300, label: "4" },
  { x: 580, y: 200, label: "t" },
];

const INITIAL_EDGES = [
  [0, 1, 8],
  [0, 2, 10],
  [1, 3, 4],
  [1, 2, 2],
  [2, 4, 8],
  [3, 5, 10],
  [4, 5, 8],
  [3, 4, 2],
];

export default function MaxFlowLab() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [result, setResult] = useState(null);
  const [lastAugIndex, setLastAugIndex] = useState(null);

  const capacity = useMemo(() => {
    const matrix = Array.from({ length: nodes.length }, () => Array(nodes.length).fill(0));
    edges.forEach(([u, v, c]) => {
      matrix[u][v] = c;
    });
    return matrix;
  }, [edges, nodes.length]);

  const recompute = () => {
    const summary = edmondsKarp(capacity, 0, nodes.length - 1);
    setResult(summary);
    setLastAugIndex(null);
  };

  const stepAugment = () => {
    const summary = edmondsKarp(capacity, 0, nodes.length - 1);
    setResult(summary);
    if (!summary.paths.length) {
      setLastAugIndex(null);
      return;
    }
    setLastAugIndex((prev) => {
      if (prev == null) return 0;
      return Math.min(prev + 1, summary.paths.length - 1);
    });
  };

  const onEdgeClick = (u, v) => {
    const current = capacity[u][v] ?? 0;
    const value = window.prompt(`Capacity for ${u}→${v}`, String(current));
    if (value == null) return;
    const numeric = Math.max(0, Number.parseFloat(value) || 0);
    setEdges((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((entry) => entry[0] === u && entry[1] === v);
      if (idx >= 0) {
        next[idx] = [u, v, numeric];
        return next;
      }
      next.push([u, v, numeric]);
      return next;
    });
  };

  const svgRef = useRef(null);
  const dragStateRef = useRef({ active: false, nodeId: null });
  const nodesRef = useRef(nodes);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleDown = (event) => {
      const { x, y } = clientToSvg(event, svg);
      const id = nodesRef.current.findIndex((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 18 ** 2);
      if (id >= 0) {
        dragStateRef.current = { active: true, nodeId: id };
      }
    };

    const handleMove = (event) => {
      const { active, nodeId } = dragStateRef.current;
      if (!active || nodeId == null) return;
      const { x, y } = clientToSvg(event, svg);
      setNodes((prev) => prev.map((node, index) => (index === nodeId ? { ...node, x, y } : node)));
    };

    const handleUp = () => {
      dragStateRef.current = { active: false, nodeId: null };
    };

    svg.addEventListener("mousedown", handleDown);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      svg.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Max-Flow / Min-Cut — Edmonds–Karp</h2>
      <Graph
        ref={svgRef}
        nodes={nodes}
        edges={edges}
        capacity={capacity}
        result={result}
        lastAugIndex={lastAugIndex}
        onEdgeClick={onEdgeClick}
      />
      <div className="grid" style={{ gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <section className="rounded-lg border border-white/10 bg-white/5 p-3">
          <button className="rounded bg-white/10 px-3 py-1" onClick={recompute} type="button">
            Run Max-Flow
          </button>
          <button className="ml-2 rounded bg-white/10 px-3 py-1" onClick={stepAugment} type="button">
            Step Augment Path
          </button>
          <p className="mt-2 text-sm">
            Max flow = <b>{result?.flow?.toFixed?.(2) ?? "-"}</b>
          </p>
          <p className="text-xs opacity-70">
            Tip: click an edge label to change capacity; drag nodes to reposition.
          </p>
        </section>
        <ActiveReflection
          title="Active Reflection — Max-Flow"
          storageKey="reflect_maxflow"
          prompts={[
            "Which edges saturate at optimum? Are they exactly the min-cut crossing?",
            "Do parallel routes help more than a single high-capacity edge?",
            "When you increase one capacity, where does the flow reroute?",
          ]}
        />
      </div>
    </div>
  );
}

const Graph = forwardRef(function Graph(
  { nodes, edges, capacity, result, lastAugIndex, onEdgeClick },
  ref
) {
  const width = 800;
  const height = 400;

  const highlighted = useMemo(() => {
    if (lastAugIndex == null || !result?.paths?.length) return new Set();
    const idx = Math.min(lastAugIndex, result.paths.length - 1);
    const { parent } = result.paths[idx] ?? {};
    if (!parent) return new Set();
    const sequence = new Set();
    let v = nodes.length - 1;
    while (parent[v] !== -2 && parent[v] !== -1) {
      const u = parent[v];
      sequence.add(`${u}->${v}`);
      v = u;
    }
    return sequence;
  }, [lastAugIndex, nodes.length, result]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-3">
      <svg ref={ref} width="100%" viewBox={`0 0 ${width} ${height}`}>
        <rect x="0" y="0" width={width} height={height} fill="none" />
        {edges.map(([u, v], index) => {
          const a = nodes[u];
          const b = nodes[v];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.hypot(dx, dy) || 1;
          const nx = dx / length;
          const ny = dy / length;
          const labelOffsetX = -ny * 8;
          const labelOffsetY = nx * 8;
          const mx = (a.x + b.x) / 2 + labelOffsetX;
          const my = (a.y + b.y) / 2 + labelOffsetY;
          const key = `${u}->${v}`;
          const isHighlighted = highlighted.has(key);

          return (
            <g key={index} opacity={1}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={isHighlighted ? 3 : 2}
              />
              <polygon
                points={`${b.x - 10 * nx - 4 * ny},${b.y - 10 * ny + 4 * nx} ${b.x},${b.y} ${
                  b.x - 10 * nx + 4 * ny
                },${b.y - 10 * ny - 4 * nx}`}
              />
              <text
                x={mx}
                y={my}
                fontSize="12"
                onClick={() => onEdgeClick(u, v)}
                style={{ cursor: "pointer" }}
              >
                {capacity[u][v].toFixed(1)}
              </text>
            </g>
          );
        })}
        {nodes.map((node, index) => (
          <g key={index}>
            <circle cx={node.x} cy={node.y} r="12" />
            <text x={node.x - 4} y={node.y + 4} fontSize="12">
              {node.label ?? index}
            </text>
          </g>
        ))}
        {result?.cutLeft &&
          nodes.map((node, index) =>
            result.cutLeft[index] ? (
              <circle key={`cut-${index}`} cx={node.x} cy={node.y} r="16" opacity="0.08" />
            ) : null
          )}
      </svg>
    </section>
  );
});

function clientToSvg(event, svg) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
  return { x: transformed.x, y: transformed.y };
}
