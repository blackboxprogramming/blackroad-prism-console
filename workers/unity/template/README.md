# Unity Template

This directory contains the files that seed each exported Unity project. The exporter
performs simple token replacement using `{{PROJECT_NAME}}` and `{{SCENE_NAME}}` before
archiving the template into a downloadable zip.

Real builds should replace these placeholders with scenes, prefabs, and project assets
assembled by the Unity automation pipeline.
