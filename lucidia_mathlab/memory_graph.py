"""
Lucidia Math Memory Graph
Tracks relations between agents, equations, and generated artifacts.
"""

import json
import os
from datetime import datetime

import matplotlib.pyplot as plt
import networkx as nx


class MathMemoryGraph:
    def __init__(self, path="codex_logs"):
        self.path = path
        self.graph = nx.MultiDiGraph(name="LucidiaMathGraph")

    def load_logs(self):
        for file in os.listdir(self.path):
            if file.endswith(".json"):
                with open(os.path.join(self.path, file)) as f:
                    data = json.load(f)
                    self._ingest_log(file, data)

    def _ingest_log(self, file, data):
        agent = data.get("agent")
        prompt = data.get("prompt", "")[:80]
        node_id = f"{file}_{agent}"
        self.graph.add_node(node_id, label=agent, prompt=prompt, ts=file[:19])
        self.graph.add_edge(agent, node_id, relation="produced")

    def render(self, out_path="codex_logs/math_graph.png"):
        plt.figure(figsize=(12, 8))
        pos = nx.spring_layout(self.graph, k=0.4)
        nx.draw_networkx_nodes(self.graph, pos, node_size=500, node_color="#77aaff")
        nx.draw_networkx_edges(self.graph, pos, arrowstyle="->", arrowsize=12)
        nx.draw_networkx_labels(self.graph, pos, font_size=9)
        plt.axis("off")
        plt.tight_layout()
        plt.savefig(out_path)
        print(f"[✓] Graph rendered → {out_path}")


if __name__ == "__main__":
    graph = MathMemoryGraph()
    graph.load_logs()
    graph.render()
