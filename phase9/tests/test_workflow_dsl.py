import yaml
from workflows import dsl


def test_workflow(tmp_path):
    wf_file = tmp_path / "wf.yml"
    wf_file.write_text(
        yaml.dump(
            {
                "version": 1,
                "steps": [
                    {
                        "bot": "RevOps-BOT",
                        "intent": "forecast_check",
                        "inputs": {"quarter": "Q3"},
                    },
                    {
                        "bot": "SRE-BOT",
                        "intent": "error_budget",
                        "when": "{{ steps[0]['ok'] }}",
                    },
                    {"gather": "ExecutiveSummary"},
                ],
            }
        )
    )
    out = dsl.run_workflow(str(wf_file))
    assert out["steps"][0]["ok"]
    assert out["steps"][1]["ok"]
    summary_path = dsl.write_summary("wf1", "done")
    assert summary_path.exists()
