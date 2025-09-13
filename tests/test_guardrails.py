import pytest

from tools import web_search


def test_web_search_stub():
    with pytest.raises(NotImplementedError):
        web_search.search("test")
