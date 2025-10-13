from pathlib import Path

from samples import gen
from pipelines import finance_margin_pipeline, reliability_pipeline


def test_pipelines_run(tmp_path):
    gen.GENERATED_DIR = tmp_path / "generated"  # override for isolation
    gen.main(overwrite=True)

    res = finance_margin_pipeline.run({"sample_dir": gen.GENERATED_DIR / "finance"})
    assert Path(res["output"]).exists()
    res2 = reliability_pipeline.run({"sample_dir": gen.GENERATED_DIR / "ops"})
    assert Path(res2["output"]).exists()
    assert "burn_rate" in res2
