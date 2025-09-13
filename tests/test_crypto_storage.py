from __future__ import annotations

from pathlib import Path

import pytest

from config import settings
from security import crypto
from tools import storage


def setup(tmp_path, monkeypatch):
    cfg = tmp_path / 'config'
    cfg.mkdir()
    data = tmp_path / 'data'
    data.mkdir()
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(crypto, 'KEY_PATH', cfg / 'ear_key.json')
    monkeypatch.setattr(crypto, 'NEW_KEY_PATH', cfg / 'ear_key.new.json')
    monkeypatch.setattr(storage, 'DATA_ROOT', data)
    settings.ENCRYPT_DATA_AT_REST = True
    return data


def test_round_trip(tmp_path, monkeypatch):
    data_root = setup(tmp_path, monkeypatch)
    crypto.generate_key()
    path = data_root / 'sample.json'
    storage.write_bytes(path, b'{}')
    assert storage.read_bytes(path) == b'{}'


def test_tamper_detection(tmp_path, monkeypatch):
    data_root = setup(tmp_path, monkeypatch)
    crypto.generate_key()
    path = data_root / 'sample.json'
    storage.write_bytes(path, b'hello')
    raw = path.read_bytes()
    tampered = raw[:-1] + bytes([raw[-1] ^ 1])
    path.write_bytes(tampered)
    with pytest.raises(Exception):
        storage.read_bytes(path)


def test_rotation(tmp_path, monkeypatch):
    data_root = setup(tmp_path, monkeypatch)
    crypto.generate_key()
    path = data_root / 'sample.json'
    storage.write_bytes(path, b'data')
    crypto.rotate_key()
    crypto.rotate_data(data_root)
    assert storage.read_bytes(path) == b'data'
