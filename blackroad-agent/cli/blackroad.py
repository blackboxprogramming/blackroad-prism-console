#!/usr/bin/env python3
import click
from agent import jobs


@click.group()
def cli():
    """BlackRoad CLI"""
    pass


@cli.command()
@click.argument("command", nargs=-1)
def run(command):
    """Run a command on the Jetson"""
    jobs.run_remote("jetson.local", " ".join(command))


if __name__ == "__main__":
    cli()
