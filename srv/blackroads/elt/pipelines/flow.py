from prefect import flow
from prefect.tasks import task_input_hash
from prefect.server.schemas.schedules import CronSchedule
from datetime import timedelta

from download_full import download
from ingest_nyc_taxi import main as ingest
from validate import main as validate


@flow(name="elt-flow")
def elt_flow(download_year: int | None = None, download_month: int | None = None) -> None:
    if download_year and download_month:
        download(download_year, download_month)
    ingest()
    validate()


if __name__ == "__main__":
    deployment = elt_flow.to_deployment(
        name="daily",
        schedule=CronSchedule(cron="0 2 * * *", timezone="America/Chicago"),
        tags=["blackroads"],
    )
    deployment.apply()
