from fastapi.testclient import TestClient

from services.handle_mint.app import app


client = TestClient(app)


def test_issue_handle_success():
    response = client.post(
        "/handles",
        json={
            "desired_handle": "Möss.Curator__",
            "did": "did:key:z6MkpQn9m5x4w3p8t7b2gV9hQWkY3u1rS8pZqEi1LxAbCdEf",
            "pgp_fingerprint": "9F1A2B3C4D5E6F708192A3B4C5D6E7F8091A2B3C",
            "want_alias_at_id": True,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["handle"] == "moss-curator"
    assert payload["skeleton"] == "mosscurator"
    assert payload["email_primary"] == "inbox@moss-curator.blackroad.mail"
    assert payload["aliases"] == ["moss-curator@blackroad.id"]
    assert payload["records"][0]["type"] == "MX"
    assert payload["records"][1]["type"] == "TXT"


def test_reserved_handle_rejected():
    response = client.post(
        "/handles",
        json={
            "desired_handle": "support",
            "did": "did:key:z6Mkreserved",
        },
    )
    assert response.status_code == 400
    payload = response.json()
    assert payload["error"]["code"] == "RESERVED"
    assert payload["error"]["reasons"][0] == "handle is reserved or conflicts with a protected role"


def test_collision_returns_unavailable():
    # First allocation should succeed
    first = client.post(
        "/handles",
        json={
            "desired_handle": "prism-builder",
            "did": "did:key:z6Mkcollision",
        },
    )
    assert first.status_code == 200

    # Second allocation with colliding skeleton should fail
    second = client.post(
        "/handles",
        json={
            "desired_handle": "prism_builder",
            "did": "did:key:z6Mkcollision2",
        },
    )
    assert second.status_code == 409
    payload = second.json()
    assert payload["error"]["code"] == "UNAVAILABLE"
