from pi_ops.app import Message, MessageStore


def create_store(tmp_path):
    db_path = tmp_path / "ops.db"
    store = MessageStore(db_path, max_messages=100)
    return store


def test_topic_stats_orders_by_last_seen(tmp_path):
    store = create_store(tmp_path)
    try:
        store.insert(Message(id=None, topic="alpha", payload="{}", created_at=100.0))
        store.insert(Message(id=None, topic="beta", payload="{}", created_at=200.0))
        store.insert(Message(id=None, topic="alpha", payload="{}", created_at=300.0))

        stats = store.topic_stats(limit=5)
        assert len(stats) == 2
        assert stats[0].topic == "alpha"
        assert stats[0].count == 2
        assert stats[0].last_seen == 300.0
        assert stats[1].topic == "beta"
        assert stats[1].count == 1
        assert stats[1].last_seen == 200.0
    finally:
        store.close()


def test_topic_stats_clamps_limit(tmp_path):
    store = create_store(tmp_path)
    try:
        store.insert(Message(id=None, topic="only", payload="{}", created_at=42.0))

        stats = store.topic_stats(limit=0)
        assert len(stats) == 1
        assert stats[0].topic == "only"
        assert stats[0].count == 1
    finally:
        store.close()
