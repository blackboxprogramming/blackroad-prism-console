"""Minimal FastAPI stub for Lucidia Memory StoryWalk."""
from __future__ import annotations

from typing import Dict, List, Optional, Sequence

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .storywalk import Beat, Edge, Scene, StoryWalker


app = FastAPI(title="Lucidia Memory", version="0.1.0")


class ScenePayload(BaseModel):
    """Incoming memory scene payload."""

    id: str
    timestamp: str
    title: Optional[str] = None
    content: Optional[str] = None
    entities: Sequence[str] = Field(default_factory=list)
    topics: Sequence[str] = Field(default_factory=list)
    motifs: Sequence[str] = Field(default_factory=list)
    pathos: Optional[Sequence[float]] = None
    tones: Sequence[str] = Field(default_factory=list)
    context: Dict[str, str] = Field(default_factory=dict)
    embeddings: Dict[str, Sequence[float]] = Field(default_factory=dict)

    def to_scene(self) -> Scene:
        pathos_tuple = None
        if self.pathos and len(self.pathos) >= 2:
            pathos_tuple = (float(self.pathos[0]), float(self.pathos[1]))
        return Scene(
            id=self.id,
            timestamp=self.timestamp,
            title=self.title,
            content=self.content,
            entities=tuple(self.entities),
            topics=tuple(self.topics),
            motifs=tuple(self.motifs),
            pathos=pathos_tuple,
            tones=tuple(self.tones),
            context=dict(self.context),
            embeddings={key: tuple(value) for key, value in self.embeddings.items()},
        )


class EdgePayload(BaseModel):
    """Incoming edge payload."""

    source: str
    target: str
    relation: str
    layer: str
    weight: float = Field(ge=0.0, le=1.0)

    def to_edge(self) -> Edge:
        return Edge(
            source=self.source,
            target=self.target,
            relation=self.relation,
            layer=self.layer,
            weight=self.weight,
        )


class StoryRequest(BaseModel):
    """Story recall request body."""

    query_embedding: Optional[Sequence[float]] = None
    vibe_embedding: Optional[Sequence[float]] = None
    context_hints: Dict[str, str] = Field(default_factory=dict)
    motif_hints: Sequence[str] = Field(default_factory=list)
    seed_count: int = Field(default=3, ge=1)
    max_beats: int = Field(default=10, ge=1, le=25)
    allow_mood_jumps: bool = False


class BeatResponse(BaseModel):
    """Response payload for a single beat."""

    scene_id: str
    when: str
    where: Optional[str]
    who: Sequence[str]
    what: Optional[str]
    feeling: Optional[str]
    reason: Sequence[str]

    @classmethod
    def from_beat(cls, beat: Beat) -> "BeatResponse":
        return cls(
            scene_id=beat.scene_id,
            when=beat.when,
            where=beat.where,
            who=list(beat.who),
            what=beat.what,
            feeling=beat.feeling,
            reason=list(beat.reason),
        )


class StoryResponse(BaseModel):
    """Response wrapper for StoryWalk results."""

    beats: List[BeatResponse]


memory_scenes: Dict[str, Scene] = {}
memory_edges: List[Edge] = []
walker = StoryWalker(memory_scenes.values(), memory_edges)


@app.post("/memories", status_code=201)
def create_memory(scene: ScenePayload) -> Dict[str, str]:
    """Create or update a memory scene."""

    memory_scenes[scene.id] = scene.to_scene()
    _refresh_walker()
    return {"status": "ok", "id": scene.id}


@app.post("/edges", status_code=201)
def create_edge(edge: EdgePayload) -> Dict[str, str]:
    """Create a typed edge between two scenes."""

    memory_edges.append(edge.to_edge())
    _refresh_walker()
    return {"status": "ok"}


@app.post("/recall/story", response_model=StoryResponse)
def recall_story(request: StoryRequest) -> StoryResponse:
    """Run the StoryWalk algorithm and return narrative beats."""

    beats = walker.story_walk(
        query_embedding=request.query_embedding,
        vibe_embedding=request.vibe_embedding,
        context_hints=request.context_hints,
        motif_hints=request.motif_hints,
        seed_count=request.seed_count,
        max_beats=request.max_beats,
        allow_mood_jumps=request.allow_mood_jumps,
    )
    return StoryResponse(beats=[BeatResponse.from_beat(beat) for beat in beats])


@app.post("/motifs", status_code=202)
def register_motif(motif: Dict[str, str]) -> Dict[str, str]:
    """Register a motif placeholder (stub)."""

    return {"status": "accepted", "name": motif.get("name", "unknown")}


@app.post("/feedback", status_code=202)
def submit_feedback(payload: Dict[str, float]) -> Dict[str, str]:
    """Record a reinforcement signal (stub)."""

    return {"status": "accepted", "signal": str(payload.get("signal", 0.0))}


def _refresh_walker() -> None:
    """Rebuild the StoryWalker with the current in-memory graph."""

    global walker
    walker = StoryWalker(memory_scenes.values(), memory_edges)


__all__ = [
    "app",
    "create_memory",
    "create_edge",
    "recall_story",
    "register_motif",
    "submit_feedback",
]
