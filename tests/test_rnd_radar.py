import shutil
from rnd import radar


def _clean():
    shutil.rmtree(radar.CONFIGS, ignore_errors=True)
    radar.CONFIGS.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(radar.ARTIFACTS, ignore_errors=True)
    radar.ARTIFACTS.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(radar.LAKE, ignore_errors=True)
    radar.LAKE.mkdir(parents=True, exist_ok=True)


def test_radar_build():
    _clean()
    radar.add("Rust", "Adopt", "Languages", "fast")
    radar.build()
    assert (radar.ARTIFACTS / "radar.md").exists()
    lst = radar.list("Languages")
    assert any(e.tech == "Rust" for e in lst)
