import csv
from pathlib import Path

import yaml


def plan(cycle_id: str, demographics_csv: Path, policy_yaml: Path, out_dir: Path) -> Path:
    people = list(csv.DictReader(demographics_csv.open()))
    policy = yaml.safe_load(policy_yaml.read_text())
    merit_pct = policy.get("merit_pct", {})
    grid_lines = ["employee_id,level,salary,new_salary"]
    budget = 0.0
    for p in people:
        level = p["level"]
        salary = float(p["salary"])
        pct = float(merit_pct.get(level, 0.03))
        new_salary = salary * (1 + pct)
        budget += new_salary - salary
        grid_lines.append(f"{p['employee_id']},{level},{salary},{new_salary}")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "comp_grid.csv").write_text("\n".join(grid_lines))
    (out_dir / "budget.md").write_text(f"total_budget: {budget:.2f}")
    return out_dir


def letters(cycle_dir: Path) -> None:
    grid = list(csv.DictReader((cycle_dir / "comp_grid.csv").open()))
    letters_dir = cycle_dir / "letters"
    letters_dir.mkdir(exist_ok=True)
    for row in grid:
        emp = row["employee_id"]
        new_salary = row["new_salary"]
        (letters_dir / f"{emp}.md").write_text(
            f"# Comp Letter for {emp}\n\nYour new salary is {new_salary}"
        )
    return None
