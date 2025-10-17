"""BlackRoad CLI entrypoint."""
from __future__ import annotations

import click

from agent import jobs, telemetry


@click.group()
def cli() -> None:
    """BlackRoad CLI."""


@cli.command()
@click.argument("command", nargs=-1)
def run(command: tuple[str, ...]) -> None:
    """Run a command on the Jetson."""
    jobs.run_remote("jetson.local", " ".join(command))


@cli.command()
def status() -> None:
    """Show telemetry for the local device and the Jetson."""
    pi = telemetry.collect_local()
    jetson = telemetry.collect_remote("jetson.local")
    click.echo("== Pi ==")
    for key, value in pi.items():
        click.echo(f"{key}: {value}")
    click.echo("\n== Jetson ==")
    for key, value in jetson.items():
        click.echo(f"{key}: {value}")


if __name__ == "__main__":
    cli()
