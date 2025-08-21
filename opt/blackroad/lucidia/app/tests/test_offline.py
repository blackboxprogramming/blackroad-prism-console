# /opt/blackroad/lucidia/app/tests/test_offline.py
import os
import socket
import pytest

@pytest.mark.skipif(os.environ.get("OFFLINE_TEST") != "1", reason="offline check")
def test_no_network():
    s = socket.socket()
    with pytest.raises(OSError):
        s.settimeout(1)
        s.connect(("example.com", 80))
