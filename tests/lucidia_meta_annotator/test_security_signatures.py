import hashlib
import pytest
from lucidia_meta_annotator.config_schema import load_config
from lucidia_meta_annotator.security import SignatureError


def test_signature_verification(tmp_path):
    cfg_path = tmp_path / "cfg.yaml"
    cfg_path.write_text("Attributes: []")
    sig_path = tmp_path / "cfg.sig"
    digest = hashlib.sha256(cfg_path.read_bytes()).hexdigest()
    sig_path.write_text(digest)
    load_config(cfg_path, verify_signature=True, signature_path=sig_path)
    sig_path.write_text("deadbeef")
    with pytest.raises(SignatureError):
        load_config(cfg_path, verify_signature=True, signature_path=sig_path)
