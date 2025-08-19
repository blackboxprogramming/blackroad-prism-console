from lucidia_meta_annotator import annotate_dataset


def test_deterministic_application():
    meta = {"a": 1}
    cfg = {"Attributes": [{"Name": "a", "Value": 1}, {"Name": "b", "Value": 2}]}
    first, removed_first = annotate_dataset(meta, cfg)
    second, removed_second = annotate_dataset(meta, cfg)
    assert first == second
    assert removed_first == removed_second
