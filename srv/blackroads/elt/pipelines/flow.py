
from download_full import download
from ingest_nyc_taxi import main as ingest
from prefect import flow
# <!-- FILE: /srv/blackroads/elt/pipelines/flow.py -->
from download_full import download
from ingest_nyc_taxi import main as ingest
from prefect import flow
from prefect.deployments import Deployment
from prefect.server.schemas.schedules import CronSchedule
from validate import main as validate


@flow(name="elt-flow")
def elt_flow(download_year: int | None = None, download_month: int | None = None) -> None:
    if download_year and download_month:
        download(download_year, download_month)
@flow
def etl_flow(year: int | None = None, month: int | None = None) -> None:
    if year and month:
        download(year, month)
    ingest()
    validate()


if __name__ == "__main__":
    deployment = elt_flow.to_deployment(
        name="daily",
        schedule=CronSchedule(cron="0 2 * * *", timezone="America/Chicago"),
        tags=["blackroads"],
    )
    deployment.apply()
def create_deployment() -> None:
    schedule = CronSchedule(cron="0 2 * * *", timezone="America/Chicago")
    Deployment.build_from_flow(flow=etl_flow, name="daily", schedule=schedule, work_queue_name="default").apply()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--deploy", action="store_true", help="Create Prefect deployment")
    parser.add_argument("--year", type=int, default=None)
    parser.add_argument("--month", type=int, default=None)
    args = parser.parse_args()

    if args.deploy:
        create_deployment()
    else:
        etl_flow(args.year, args.month)
