"""Lucidia meta annotator package."""
from .config_schema import load_config
from .annotate import annotate_file, annotate_dataset
__all__ = ["load_config", "annotate_file", "annotate_dataset"]
