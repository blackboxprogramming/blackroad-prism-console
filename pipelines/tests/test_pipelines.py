from __future__ import annotations

import csv
import json
from pathlib import Path

import pytest

from pipelines import finance_margin_pipeline, reliability_pipeline


def _write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    with path.open('w', newline='') as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def _finance_samples(tmp_path: Path) -> tuple[Path, int]:
    fixture = Path('fixtures/finance/tb_2025-09.csv')
    with fixture.open() as fh:
        raw = list(csv.DictReader(fh))

    selected = raw[:3]
    pricing_rows: list[dict[str, object]] = []
    cogs_rows: list[dict[str, object]] = []
    volume_rows: list[dict[str, object]] = []

    for idx, row in enumerate(selected):
        ident = f"{row['account']}-{idx}"
        amount = abs(float(row['amount']))
        pricing_rows.append({'id': ident, 'price': f"{amount:.2f}"})
        cogs_rows.append({'id': ident, 'cogs': f"{amount * 0.6:.2f}"})
        volume_rows.append({'id': ident, 'volume': str(idx + 1)})

    sample_dir = tmp_path / 'finance'
    sample_dir.mkdir()
    _write_csv(sample_dir / 'pricing.csv', pricing_rows)
    _write_csv(sample_dir / 'cogs.csv', cogs_rows)
    _write_csv(sample_dir / 'volume.csv', volume_rows)
    return sample_dir, len(pricing_rows)


def _reliability_samples(tmp_path: Path) -> tuple[Path, int, int]:
    incidents_fixture = Path('fixtures/servicenow/incidents.json')
    incidents = json.loads(incidents_fixture.read_text())
    incident_rows = [
        {
            'id': entry['Id'],
            'service': entry.get('Service', ''),
            'opened_at': entry.get('OpenedAt', ''),
        }
        for entry in incidents
    ]

    changes_fixture = Path('fixtures/policy/drift_spike.series.json')
    series = json.loads(changes_fixture.read_text()).get('series', [])
    change_rows = [
        {
            'id': f"chg-{idx}",
            'policy_version': item.get('policy_version', ''),
            'outcome': item.get('outcome', ''),
        }
        for idx, item in enumerate(series[:3])
    ]

    sample_dir = tmp_path / 'ops'
    sample_dir.mkdir()
    _write_csv(sample_dir / 'incidents.csv', incident_rows)
    _write_csv(sample_dir / 'changes.csv', change_rows)
    return sample_dir, len(incident_rows), len(change_rows)


@pytest.mark.usefixtures('tmp_path')
def test_finance_margin_pipeline(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    sample_dir, expected_rows = _finance_samples(tmp_path)
    artifacts_dir = tmp_path / 'artifacts'
    monkeypatch.setattr(finance_margin_pipeline, 'BASE', artifacts_dir)

    result = finance_margin_pipeline.run({'sample_dir': str(sample_dir)})

    assert result['rows'] == expected_rows
    output = Path(result['output'])
    assert output.exists()
    with output.open() as fh:
        written = list(csv.DictReader(fh))
    assert len(written) == expected_rows
    assert set(written[0].keys()) == {'id', 'price', 'cogs', 'volume', 'margin'}


@pytest.mark.usefixtures('tmp_path')
def test_reliability_pipeline(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    sample_dir, incident_count, change_count = _reliability_samples(tmp_path)
    artifacts_dir = tmp_path / 'rel_artifacts'
    monkeypatch.setattr(reliability_pipeline, 'BASE', artifacts_dir)

    result = reliability_pipeline.run({'sample_dir': str(sample_dir)})

    assert result['incidents'] == incident_count
    assert result['changes'] == change_count
    output = Path(result['output'])
    assert output.exists()
    summary = json.loads(output.read_text())
    assert summary['incidents'] == incident_count
    assert summary['changes'] == change_count
    assert 'burn_rate' in summary and 'risk_flag' in summary
