import json
import os

import great_expectations as ge
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()


def main() -> None:
    password = open(os.environ["POSTGRES_PASSWORD_FILE"]).read().strip()
    conn_str = (
        f"postgresql+psycopg2://{os.environ['POSTGRES_USER']}:{password}"
        f"@{os.environ['POSTGRES_HOST']}:{os.environ.get('POSTGRES_PORT', '5432')}"
        f"/{os.environ['POSTGRES_DB']}"
    )
    engine = create_engine(conn_str)
    dataset = ge.dataset.SqlAlchemyDataset("trips_raw", schema="raw", engine=engine)
    with open("great_expectations/expectations/raw_trips_suite.json") as f:
        suite_dict = json.load(f)
    suite = ge.core.ExpectationSuite(**suite_dict)
    results = dataset.validate(expectation_suite=suite)
    if not results["success"]:
        print(results)
        raise SystemExit(1)
    print("Great Expectations validation passed")


if __name__ == "__main__":
    main()
