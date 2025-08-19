# <!-- FILE: /srv/blackroads/elt/pipelines/ingest_nyc_taxi.py -->
from pathlib import Path

import dlt
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path("data/raw")
FULL_DIR = DATA_DIR / "full"


def read_csvs() -> pd.DataFrame:
    files = [DATA_DIR / "yellow_tripdata_sample.csv"]
    files.extend(sorted(FULL_DIR.glob("*.csv")))
    frames = []
    for file in files:
        if file.exists():
            df = pd.read_csv(file)
            df["tpep_pickup_datetime"] = pd.to_datetime(df["tpep_pickup_datetime"])
            df["tpep_dropoff_datetime"] = pd.to_datetime(df["tpep_dropoff_datetime"])
            frames.append(df)
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


def main() -> None:
    df = read_csvs()
    if df.empty:
        print("No data files found")
        return
    pipeline = dlt.pipeline(pipeline_name="nyc_taxi", destination="postgres", dataset_name="raw")
    load_info = pipeline.run(df, table_name="trips_raw", write_disposition="append")
    print(f"Loaded {load_info.metrics.get('loaded_rows', 0)} rows into raw.trips_raw")


if __name__ == "__main__":
    main()
