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
# <!-- FILE: /srv/blackroads/elt/pipelines/validate.py -->
from great_expectations.data_context import get_context


def main() -> None:
    context = get_context()
    batch_request = {
        "datasource_name": "postgres_default",
        "data_connector_name": "default_runtime_data_connector_name",
        "data_asset_name": "raw_trips",
        "runtime_parameters": {"query": "select * from raw.trips_raw"},
        "batch_identifiers": {"default_identifier_name": "default_identifier"},
    }
    validator = context.get_validator(batch_request=batch_request, expectation_suite_name="raw_trips_suite")
    results = validator.validate()
    if not results.success:
        raise SystemExit(1)
    print("Validation passed")


if __name__ == "__main__":
    main()
