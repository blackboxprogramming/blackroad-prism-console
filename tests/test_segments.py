from marketing import segments


def test_build_segments():
    segs = segments.build_segments("configs/marketing/segments.yaml")
    assert set(segs["seg_us"]) == {"C1", "C3"}
    assert segs["seg_demo_recent"] == ["C1"]
