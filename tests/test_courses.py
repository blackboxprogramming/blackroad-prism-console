import pytest

from enablement import courses
from enablement.utils import ROOT


def test_load_courses_and_cycle(tmp_path):
    dir_path = ROOT / "configs/enablement/courses"
    loaded = courses.load_courses(str(dir_path))
    assert len(loaded) == 2

    a = tmp_path / "a.yaml"
    b = tmp_path / "b.yaml"
    a.write_text("id: A\ntitle: A\nrole_track: X\nprereqs: [B]\nmodules: []\nversion: '1'\n")
    b.write_text("id: B\ntitle: B\nrole_track: X\nprereqs: [A]\nmodules: []\nversion: '1'\n")
    with pytest.raises(ValueError):
        courses.load_courses(str(tmp_path))
