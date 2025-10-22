-- Lucidia Memory SQLite schema
-- Stores scenes, embeddings, and multi-layer edges for the temporal graph memory system.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'scene',
    timestamp TEXT NOT NULL,
    title TEXT,
    content_text TEXT,
    content_json TEXT,
    valence REAL,
    arousal REAL,
    mood_tones TEXT,
    context_device TEXT,
    context_place TEXT,
    context_app TEXT,
    context_project TEXT,
    pathos_vector BLOB,
    context_vector BLOB,
    content_vector BLOB,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scene_entities (
    scene_id TEXT NOT NULL,
    entity TEXT NOT NULL,
    PRIMARY KEY (scene_id, entity),
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scene_topics (
    scene_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    PRIMARY KEY (scene_id, topic),
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scene_motifs (
    scene_id TEXT NOT NULL,
    motif TEXT NOT NULL,
    PRIMARY KEY (scene_id, motif),
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    rel TEXT NOT NULL,
    layer TEXT NOT NULL,
    weight REAL NOT NULL CHECK (weight BETWEEN 0 AND 1),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (from_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_edges_from_layer ON edges(from_id, layer);
CREATE INDEX IF NOT EXISTS idx_edges_to_layer ON edges(to_id, layer);

CREATE TABLE IF NOT EXISTS motifs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    pattern TEXT
);

CREATE TABLE IF NOT EXISTS motif_mentions (
    motif_id INTEGER NOT NULL,
    scene_id TEXT NOT NULL,
    evidence TEXT,
    PRIMARY KEY (motif_id, scene_id),
    FOREIGN KEY (motif_id) REFERENCES motifs(id) ON DELETE CASCADE,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id TEXT,
    edge_id INTEGER,
    signal REAL NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE SET NULL,
    FOREIGN KEY (edge_id) REFERENCES edges(id) ON DELETE SET NULL
);

-- Trigger to keep updated_at fresh
CREATE TRIGGER IF NOT EXISTS trg_scenes_updated
AFTER UPDATE ON scenes
FOR EACH ROW
BEGIN
    UPDATE scenes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_edges_updated
AFTER UPDATE ON edges
FOR EACH ROW
BEGIN
    UPDATE edges SET updated_at = datetime('now') WHERE id = NEW.id;
END;
