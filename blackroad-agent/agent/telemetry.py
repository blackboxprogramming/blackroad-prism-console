"""Telemetry collection utilities for BlackRoad agents."""


def collect_local():
    """Collect metrics from the local device.

    This is a stub implementation for the initial scaffold.
    """
    return {}


def collect_remote(hostname: str):
    """Collect metrics from a remote host.

    Args:
        hostname: Hostname of the remote agent.

    Returns:
        Mapping of telemetry values retrieved from the remote device.
    """
    raise NotImplementedError("Remote telemetry collection not yet implemented")
