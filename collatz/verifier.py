import argparse

from .db import connect


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="./campaign.sqlite")
    args = ap.parse_args()
    db = connect(args.db)
    cur = db.cursor()
    jobs, checked, max_stop, max_exc = cur.execute(
        "SELECT COUNT(), SUM(checked_count), MAX(max_stopping_time), MAX(max_excursion) FROM results"
    ).fetchone()
    print(
        f"Jobs: {jobs}  Integers checked: {checked or 0}  Record stopping time: {max_stop or 0}  Record excursion: {max_exc or 0}"
    )
    anomalies = cur.execute("SELECT COUNT() FROM anomalies").fetchone()[0]
    print(f"Anomalies (need audit): {anomalies}")


if __name__ == "__main__":
    main()
