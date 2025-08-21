import pytest
from lucidia_meta_annotator.config_schema import load_config, ConfigError


def test_schema_validation_rejects_unknown_field(tmp_path):
    p = tmp_path / "cfg.yaml"
    p.write_text("Unknown: 1\nAttributes: []")
    with pytest.raises(ConfigError):
        load_config(p)
