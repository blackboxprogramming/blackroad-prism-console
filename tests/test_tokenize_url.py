import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "codex_multi_repo_loader",
    Path(__file__).resolve().parent.parent / "tools" / "codex_multi_repo_loader.py",
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
tokenize_url = module.tokenize_url


def test_tokenize_url_with_token():
    original = "https://github.com/org/repo.git"
    expected = "https://TOKEN@github.com/org/repo.git"
    assert tokenize_url(original, "TOKEN") == expected


def test_tokenize_url_empty_token_returns_original():
    original = "https://github.com/org/repo.git"
    assert tokenize_url(original, "") == original


def test_tokenize_url_non_https_unchanged():
    ssh_url = "git@github.com:org/repo.git"
    assert tokenize_url(ssh_url, "TOKEN") == ssh_url


def test_tokenize_url_existing_credentials_unchanged():
    url = "https://user@github.com/org/repo.git"
    assert tokenize_url(url, "TOKEN") == url
