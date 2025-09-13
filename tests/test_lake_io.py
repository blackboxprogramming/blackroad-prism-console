import pytest

from lake import io


def test_lake_validation():
    with pytest.raises(ValueError):
        io.write("inventory", {"sku": "x"})
