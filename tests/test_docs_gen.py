from __future__ import annotations

from pathlib import Path

from scripts import gen_docs


def test_generate(tmp_path, monkeypatch):
    bots = tmp_path / 'bots'
    bots.mkdir()
    for name in ['a', 'b', 'c']:
        (bots / f'{name}_bot.py').write_text('"""Bot Name: {0}\nMission: t\nSupported Tasks: x\nKPIs: y\nGuardrails: z"""'.format(name))
    docs_dir = tmp_path / 'docs'
    monkeypatch.setattr(gen_docs, 'BOTS_DIR', bots)
    monkeypatch.setattr(gen_docs, 'DOCS_DIR', docs_dir)
    monkeypatch.setattr(gen_docs, 'MKDOCS_YML', tmp_path / 'mkdocs.yml')
    (tmp_path / 'README.md').write_text('# Title\nIntro')
    monkeypatch.chdir(tmp_path)
    gen_docs.generate()
    for slug in ['a-bot', 'b-bot', 'c-bot']:
        assert (docs_dir / 'bots' / f'{slug}.md').exists()
    nav = (tmp_path / 'mkdocs.yml').read_text()
    assert 'a-bot' in nav and 'b-bot' in nav and 'c-bot' in nav
