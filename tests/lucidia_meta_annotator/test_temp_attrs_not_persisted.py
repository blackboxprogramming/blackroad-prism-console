import json
from lucidia_meta_annotator import annotate_dataset


def test_temp_attrs_not_persisted():
    meta = {"a": 1, "_*temp": 2}
    cfg = {"Attributes": [{"Name": "b", "Value": 3}]}
    result, removed = annotate_dataset(meta, cfg)
    assert "_*temp" not in result
    assert "_*temp" in removed
    assert result["b"] == 3
