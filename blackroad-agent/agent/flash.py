"""Imaging and configuration helpers for BlackRoad agents."""


def flash_device(target: str):
    """Flash an operating system image to the target device.

    Args:
        target: Identifier for the device to flash.
    """
    raise NotImplementedError("Flashing workflow not yet implemented")


def patch_config(target: str, config: dict):
    """Apply configuration updates to a device.

    Args:
        target: Identifier for the device receiving the configuration.
        config: Mapping of configuration values to apply.
    """
    raise NotImplementedError("Configuration patching not yet implemented")
