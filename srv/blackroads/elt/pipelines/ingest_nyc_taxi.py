import glob
import os
from typing import Iterator, Dict, Any

import dlt
import pandas as pd
import psycopg2
from dotenv import load_dotenv

load_dotenv()

INT_COLUMNS = [
    "passenger_count",
    "RatecodeID",
    "PULocationID",
    "DOLocationID",
    "payment_type",
]
FLOAT_COLUMNS = [
    "trip_distance",
    "fare_amount",
    "extra",
    "mta_tax",
    "tip_amount",
    "tolls_amount",
    "improvement_surcharge",
    "total_amount",
    "congestion_surcharge",
]


def read_rows() -> Iterator[Dict[str, Any]]:
    files = ["data/raw/yellow_tripdata_sample.csv"] + sorted(glob.glob("data/raw/full/*.csv"))
    for file in files:
        if not os.path.exists(file):
            continue
        df = pd.read_csv(file)
        df["tpep_pickup_datetime"] = pd.to_datetime(df["tpep_pickup_datetime"])
        df["tpep_dropoff_datetime"] = pd.to_datetime(df["tpep_dropoff_datetime"])
        df[INT_COLUMNS] = df[INT_COLUMNS].fillna(0).astype("Int64")
        df[FLOAT_COLUMNS] = df[FLOAT_COLUMNS].fillna(0).astype(float)
        for row in df.to_dict(orient="records"):
            yield row


def main() -> None:
    pipeline = dlt.pipeline(destination="postgres", dataset_name="raw")
    load = pipeline.run(read_rows(), table_name="trips_raw", write_disposition="append")
    print(f"Loaded {load.metrics[0].row_count} rows into raw.trips_raw")

    conn = psycopg2.connect(
        host=os.environ["POSTGRES_HOST"],
        dbname=os.environ["POSTGRES_DB"],
        user=os.environ["POSTGRES_USER"],
        password=open(os.environ["POSTGRES_PASSWORD_FILE"]).read().strip(),
        port=int(os.environ.get("POSTGRES_PORT", 5432)),
    )
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM raw.trips_raw")
    count = cur.fetchone()[0]
    print(f"raw.trips_raw row count: {count}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
