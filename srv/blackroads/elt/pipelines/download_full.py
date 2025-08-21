import argparse
import os
from pathlib import Path

import requests

BASE_URL = "https://s3.amazonaws.com/nyc-tlc/trip+data/yellow_tripdata_{year}-{month}.csv"


def download(year: int, month: int) -> Path:
    month_str = f"{month:02d}"
    url = BASE_URL.format(year=year, month=month_str)
    target = Path("data/raw/full") / f"yellow_tripdata_{year}-{month_str}.csv"
    target.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(target, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    print(f"Downloaded {url} to {target}")
    return target


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--month", type=int, required=True)
    args = parser.parse_args()
    download(args.year, args.month)


if __name__ == "__main__":
    main()
