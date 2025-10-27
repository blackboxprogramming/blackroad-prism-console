import json

from event_mesh import github_webhook_to_event


def test_delete_event_maps_to_branch_deleted():
    payload = json.dumps(
        {
            "event": "delete",
            "ref": "feature/cleanup",
            "ref_type": "branch",
            "repository": {"full_name": "blackroad/prism-console", "default_branch": "main"},
            "sender": {"login": "octocat"},
            "pusher_type": "user",
        }
    )

    evt = github_webhook_to_event(payload)

    assert evt.type == "github.branch.deleted"
    assert evt.payload["branch"] == "feature/cleanup"
    assert evt.payload["actor"] == "octocat"
