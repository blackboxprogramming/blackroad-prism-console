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
