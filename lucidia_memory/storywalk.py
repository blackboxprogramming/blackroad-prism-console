"""StoryWalk algorithm for Lucidia Memory.

This module implements a layered random walk that replays stored scenes as a
narrative. It follows the design described in the Lucidia Memory specification:
    1. Score candidate seed scenes with a blended similarity metric.
    2. Traverse layered edges with a bias toward the requested mood.
    3. Summarise each visited scene as a narrative beat.

The implementation is intentionally lightweight so that it can run in a local
prototype against a SQLite document store and an in-memory graph.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Tuple
import math
import random


LayerOrder = Sequence[str]


@dataclass
class Scene:
    """Represents a stored memory scene."""

    id: str
    timestamp: str
    title: Optional[str] = None
    content: Optional[str] = None
    entities: Sequence[str] = field(default_factory=tuple)
    topics: Sequence[str] = field(default_factory=tuple)
    motifs: Sequence[str] = field(default_factory=tuple)
    pathos: Optional[Tuple[float, float]] = None  # (valence, arousal)
    tones: Sequence[str] = field(default_factory=tuple)
    context: Dict[str, str] = field(default_factory=dict)
    embeddings: Dict[str, Sequence[float]] = field(default_factory=dict)


@dataclass
class Edge:
    """Typed connection between two scenes."""

    source: str
    target: str
    relation: str
    layer: str
    weight: float


@dataclass
class Beat:
    """Narrative beat produced by StoryWalk."""

    scene_id: str
    when: str
    where: Optional[str]
    who: Sequence[str]
    what: Optional[str]
    feeling: Optional[str]
    reason: Sequence[str]


def cosine_similarity(vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
    """Return cosine similarity between two vectors.

    Empty vectors are treated as zero similarity. No attempt is made to
    normalise the input; the caller should pre-process vectors as needed.
    """

    if not vec_a or not vec_b:
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class StoryWalker:
    """Generate narrative walks through a layered scene graph."""

    def __init__(self, scenes: Iterable[Scene], edges: Iterable[Edge]) -> None:
        self.scenes: Dict[str, Scene] = {scene.id: scene for scene in scenes}
        self.adjacency: Dict[str, List[Edge]] = {scene_id: [] for scene_id in self.scenes}
        for edge in edges:
            if edge.source in self.adjacency:
                self.adjacency[edge.source].append(edge)

    def story_walk(
        self,
        query_embedding: Optional[Sequence[float]] = None,
        vibe_embedding: Optional[Sequence[float]] = None,
        context_hints: Optional[Dict[str, str]] = None,
        motif_hints: Optional[Sequence[str]] = None,
        seed_count: int = 3,
        max_beats: int = 10,
        blend_weights: Optional[Dict[str, float]] = None,
        layer_bias: Optional[LayerOrder] = None,
        allow_mood_jumps: bool = False,
    ) -> List[Beat]:
        """Return a narrative as a list of beats.

        Args:
            query_embedding: Content query vector.
            vibe_embedding: Desired emotion vector.
            context_hints: Device/app/place filters to emphasise.
            motif_hints: Motifs that should receive a boost.
            seed_count: Number of seed scenes to start from.
            max_beats: Maximum number of beats to produce.
            blend_weights: Weights for blending similarities.
            layer_bias: Preferred traversal order across layers.
            allow_mood_jumps: If False, penalise sharp mood changes.
        """

        if not self.scenes:
            return []

        blend = self._normalise_weights(blend_weights)
        layer_order: LayerOrder = layer_bias or ("Pathos", "Chronos", "Logos", "Context")
        seeds = self._select_seeds(
            query_embedding,
            vibe_embedding,
            context_hints or {},
            motif_hints or (),
            blend,
            seed_count,
        )

        visited: set[str] = set()
        beats: List[Beat] = []
        for seed_id in seeds:
            if seed_id in visited:
                continue
            beats.extend(
                self._walk_from_seed(
                    seed_id,
                    layer_order,
                    vibe_embedding,
                    visited,
                    max_beats - len(beats),
                    allow_mood_jumps,
                )
            )
            if len(beats) >= max_beats:
                break
        return beats[:max_beats]

    def _normalise_weights(self, weights: Optional[Dict[str, float]]) -> Dict[str, float]:
        defaults = {"content": 0.3, "emotion": 0.4, "context": 0.2, "motif": 0.1}
        if not weights:
            return defaults
        total = sum(weights.values())
        if total <= 0:
            return defaults
        return {key: value / total for key, value in weights.items()}

    def _select_seeds(
        self,
        query_embedding: Optional[Sequence[float]],
        vibe_embedding: Optional[Sequence[float]],
        context_hints: Dict[str, str],
        motif_hints: Sequence[str],
        blend: Dict[str, float],
        seed_count: int,
    ) -> List[str]:
        scored: List[Tuple[float, str]] = []
        motif_hint_set = {hint.lower() for hint in motif_hints}
        for scene in self.scenes.values():
            content_sim = cosine_similarity(scene.embeddings.get("content", ()), query_embedding or ())
            emotion_sim = cosine_similarity(scene.embeddings.get("emotion", ()), vibe_embedding or ())
            context_bonus = self._context_overlap(scene.context, context_hints)
            motif_bonus = self._motif_bonus(scene.motifs, motif_hint_set)
            score = (
                blend.get("content", 0.0) * content_sim
                + blend.get("emotion", 0.0) * emotion_sim
                + blend.get("context", 0.0) * context_bonus
                + blend.get("motif", 0.0) * motif_bonus
            )
            scored.append((score, scene.id))
        scored.sort(reverse=True)
        return [scene_id for _, scene_id in scored[:seed_count]]

    def _context_overlap(self, context: Dict[str, str], hints: Dict[str, str]) -> float:
        if not hints:
            return 0.0
        matches = sum(1 for key, value in hints.items() if context.get(key) == value)
        return matches / max(len(hints), 1)

    def _motif_bonus(self, motifs: Sequence[str], hints: Iterable[str]) -> float:
        motif_set = {motif.lower() for motif in motifs}
        hint_set = set(hints)
        if not hint_set or not motif_set:
            return 0.0
        overlap = len(motif_set & hint_set)
        return overlap / len(hint_set)

    def _walk_from_seed(
        self,
        seed_id: str,
        layer_order: LayerOrder,
        vibe_embedding: Optional[Sequence[float]],
        visited: set[str],
        remaining: int,
        allow_mood_jumps: bool,
    ) -> List[Beat]:
        if remaining <= 0:
            return []

        path: List[str] = [seed_id]
        visited.add(seed_id)
        current_id = seed_id
        while len(path) < remaining:
            next_edge = self._next_edge(current_id, layer_order, visited, vibe_embedding, allow_mood_jumps)
            if not next_edge:
                break
            current_id = next_edge.target
            visited.add(current_id)
            path.append(current_id)

        return [self._make_beat(self.scenes[scene_id], path) for scene_id in path]

    def _next_edge(
        self,
        scene_id: str,
        layer_order: LayerOrder,
        visited: set[str],
        vibe_embedding: Optional[Sequence[float]],
        allow_mood_jumps: bool,
    ) -> Optional[Edge]:
        candidates = [edge for edge in self.adjacency.get(scene_id, []) if edge.target not in visited]
        if not candidates:
            return None

        ranked: List[Tuple[float, Edge]] = []
        for edge in candidates:
            layer_rank = self._layer_rank(edge.layer, layer_order)
            weight = edge.weight
            penalty = self._mood_penalty(scene_id, edge.target, vibe_embedding, allow_mood_jumps)
            score = (1.0 - layer_rank * 0.1) * weight * penalty
            ranked.append((score, edge))
        ranked.sort(reverse=True, key=lambda item: item[0])
        # Use weighted randomness to keep stories lively.
        top_scores = ranked[:5]
        total = sum(max(score, 0.0) for score, _ in top_scores)
        if total <= 0:
            return top_scores[0][1]
        pick = random.random() * total
        cumulative = 0.0
        for score, edge in top_scores:
            cumulative += max(score, 0.0)
            if pick <= cumulative:
                return edge
        return top_scores[-1][1]

    def _layer_rank(self, layer: str, order: LayerOrder) -> int:
        try:
            return order.index(layer)
        except ValueError:
            return len(order)

    def _mood_penalty(
        self,
        source_id: str,
        target_id: str,
        vibe_embedding: Optional[Sequence[float]],
        allow_mood_jumps: bool,
    ) -> float:
        if allow_mood_jumps or vibe_embedding is None:
            return 1.0
        source_scene = self.scenes[source_id]
        target_scene = self.scenes[target_id]
        source_vec = source_scene.embeddings.get("emotion", ())
        target_vec = target_scene.embeddings.get("emotion", ())
        if not source_vec or not target_vec:
            return 1.0
        current_alignment = cosine_similarity(source_vec, vibe_embedding)
        next_alignment = cosine_similarity(target_vec, vibe_embedding)
        if next_alignment >= current_alignment:
            return 1.0
        return max(0.1, next_alignment / max(current_alignment, 1e-6))

    def _make_beat(self, scene: Scene, path: Sequence[str]) -> Beat:
        location = scene.context.get("place") if scene.context else None
        feeling = self._render_feeling(scene)
        reason = self._edge_reasons(scene.id, path)
        return Beat(
            scene_id=scene.id,
            when=scene.timestamp,
            where=location,
            who=tuple(scene.entities),
            what=scene.title or scene.content,
            feeling=feeling,
            reason=tuple(reason),
        )

    def _render_feeling(self, scene: Scene) -> Optional[str]:
        if scene.pathos:
            valence, arousal = scene.pathos
            tones = ", ".join(scene.tones)
            return f"valence={valence:.2f}, arousal={arousal:.2f} ({tones})" if tones else f"valence={valence:.2f}, arousal={arousal:.2f}"
        if scene.tones:
            return ", ".join(scene.tones)
        return None

    def _edge_reasons(self, scene_id: str, path: Sequence[str]) -> List[str]:
        reasons: List[str] = []
        idx = path.index(scene_id)
        if idx == 0:
            reasons.append("seed")
        else:
            prev_id = path[idx - 1]
            for edge in self.adjacency.get(prev_id, []):
                if edge.target == scene_id:
                    reasons.append(f"{edge.layer}:{edge.relation}")
        return reasons


__all__ = ["Scene", "Edge", "Beat", "StoryWalker", "cosine_similarity"]
