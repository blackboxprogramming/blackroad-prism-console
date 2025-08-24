from scripts.blackroad_codex import COMMAND_MAP


def test_command_map_keys():
    expected = {
        "push latest to blackroad.io",
        "refresh working copy and redeploy",
        "rebase branch and update site",
        "sync salesforce -> airtable -> droplet",
    }
    assert expected <= set(COMMAND_MAP)
