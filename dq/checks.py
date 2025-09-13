from typing import Dict, Iterable, List


def _to_rows(df) -> List[Dict]:
    if isinstance(df, list):
        return df
    try:
        return df.to_dict("records")  # type: ignore[call-arg]
    except AttributeError:
        raise TypeError("Unsupported dataframe type")


def check_missing_values(df) -> Dict[str, int]:
    rows = _to_rows(df)
    counts: Dict[str, int] = {}
    for row in rows:
        for k, v in row.items():
            if v in (None, ""):
                counts[k] = counts.get(k, 0) + 1
    return counts


def check_outliers(df, cols: Iterable[str], threshold: float = 3.0) -> Dict[str, List[int]]:
    rows = _to_rows(df)
    outliers: Dict[str, List[int]] = {c: [] for c in cols}
    for c in cols:
        values = [float(r[c]) for r in rows if r.get(c) is not None]
        if not values:
            continue
        mean = sum(values) / len(values)
        var = sum((v - mean) ** 2 for v in values) / len(values)
        sd = var ** 0.5
        for idx, v in enumerate(values):
            if sd and abs(v - mean) / sd > threshold:
                outliers[c].append(idx)
    return {k: v for k, v in outliers.items() if v}


def check_schema(df, spec: Dict[str, type]) -> List[str]:
    rows = _to_rows(df)
    errors = []
    for row in rows:
        for col, typ in spec.items():
            if col not in row or not isinstance(row[col], typ):
                errors.append(col)
    return sorted(set(errors))
