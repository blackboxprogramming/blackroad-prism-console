from __future__ import annotations

import inspect
import os
from pathlib import Path
import re

DOCS_DIR = Path('docs')
BOTS_DIR = Path('bots')
MKDOCS_YML = Path('mkdocs.yml')


def _parse_bot(bot_path: Path) -> tuple[str, dict]:
    module_name = bot_path.stem
    spec = {}
    src = bot_path.read_text()
    m = re.search(r'"""(.*)"""', src, re.S)
    doc = inspect.cleandoc(m.group(1)) if m else ''
    for line in doc.splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            spec[k.strip().lower()] = v.strip()
    name = spec.get('bot name', module_name)
    return name, spec


def generate() -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    bots_dir = DOCS_DIR / 'bots'
    bots_dir.mkdir(exist_ok=True)

    for bot in sorted(BOTS_DIR.glob('*_bot.py')):
        name, spec = _parse_bot(bot)
        slug = bot.stem.replace('_', '-')
        content = f"# {name}\n\n" + '\n'.join(f"**{k.title()}**: {v}" for k, v in spec.items())
        (bots_dir / f"{slug}.md").write_text(content)

    # index
    readme = Path('README.md').read_text().splitlines()
    intro = '\n'.join(readme[: min(20, len(readme))])
    (DOCS_DIR / 'index.md').write_text(intro)

    nav = ['site_name: Prism Console', 'nav:', '  - Home: index.md', '  - Bots:']
    for bot in sorted(BOTS_DIR.glob('*_bot.py')):
        slug = bot.stem.replace('_', '-')
        nav.append(f'    - {slug}: bots/{slug}.md')
    MKDOCS_YML.write_text('\n'.join(nav))


def main() -> None:
    generate()


if __name__ == '__main__':
    main()
