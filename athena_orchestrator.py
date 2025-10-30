"""Athena orchestrator for coordinating agents and updating workboard."""

from __future__ import annotations

import argparse
import os
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterable, Sequence

import yaml

WORKBOARD = Path(__file__).resolve().parent / "AGENT_WORKBOARD.md"
DEFAULT_MANIFEST = Path(__file__).resolve().with_name("athena_manifest.yaml")


@dataclass(slots=True)
class CommandSpec:
    """Shell command definition extracted from the manifest."""

    run: Sequence[str]
    cwd: Path | None = None


@dataclass(slots=True)
class AgentSpec:
    """Specification describing how Athena should coordinate an agent."""

    name: str
    task: str
    commands: list[CommandSpec]
    branch: str | None = None
    base_branch: str | None = None
    artifacts: list[Path] = field(default_factory=list)
    env: dict[str, str] = field(default_factory=dict)
    prompt: str | None = None


@dataclass(slots=True)
class SprintSpec:
    """Manifest-derived sprint configuration."""

    name: str
    agents: list[AgentSpec]
    base_branch: str
    shared_artifacts: list[Path]


def update_workboard(section: str, task: str, status: str = "") -> None:
    """Move a task between workboard sections and append status."""

    lines = WORKBOARD.read_text().splitlines(keepends=True)
    sections = {"To Do": [], "In Progress": [], "Blocked": [], "Done": []}
    current = None
    for line in lines:
        if line.startswith("## "):
            current = line[3:].strip()
        elif current in sections and line.strip().startswith("- ["):
            sections[current].append(line)

    for key in sections:
        sections[key] = [line for line in sections[key] if task not in line]

    if section in sections:
        status_str = f" ({status})" if status else ""
        prefix = "- [ ]" if section != "Done" else "- [x]"
        sections[section].append(f"{prefix} {task}{status_str}\n")

    out = ["# Agent Workboard\n\n"]
    for sec in ["To Do", "In Progress", "Blocked", "Done"]:
        out.append(f"## {sec}\n")
        out.extend(sections[sec])
        out.append("\n")
    out.append("## Last Status Report\n")
    out.append(f"- {datetime.utcnow()} {task} moved to {section} {status}\n")
    WORKBOARD.write_text("".join(out))


def notify(message: str) -> None:
    """Placeholder for notification hub."""

    print(f"[ATHENA] {message}")


def _ensure_directories(paths: Iterable[Path]) -> None:
    for path in paths:
        path.mkdir(parents=True, exist_ok=True)


def _prepare_branch(branch: str, base_branch: str | None) -> None:
    """Ensure a working branch exists for the agent."""

    base = base_branch or "main"
    notify(f"Ensuring branch '{branch}' from base '{base}'")
    subprocess.run(["git", "fetch", "--all"], check=False)
    subprocess.run(["git", "checkout", base], check=True)
    subprocess.run(["git", "checkout", "-B", branch, base], check=True)


def _run_command(command: CommandSpec, env: dict[str, str]) -> None:
    merged_env = os.environ.copy()
    merged_env.update(env)
    subprocess.run(command.run, check=True, cwd=command.cwd, env=merged_env)


def run_agent(spec: AgentSpec, manifest: SprintSpec) -> None:
    """Run the commands for an agent from the manifest."""

    update_workboard("In Progress", spec.task, spec.name)
    notify(f"Starting {spec.name}: {spec.task}")
    try:
        if spec.branch:
            _prepare_branch(spec.branch, spec.base_branch or manifest.base_branch)

        artifact_paths = manifest.shared_artifacts + spec.artifacts
        _ensure_directories(artifact_paths)

        if spec.prompt:
            notify(f"Prompt for {spec.name}: {spec.prompt}")

        for command in spec.commands:
            notify(f"Running command for {spec.name}: {' '.join(command.run)}")
            _run_command(command, spec.env)

        update_workboard("Done", spec.task, "Success")
        notify(f"Completed {spec.name}")
    except subprocess.CalledProcessError as exc:
        update_workboard("Blocked", spec.task, f"Failed: {exc}")
        notify(f"Failed {spec.name}: {exc}")


def suggest_strategy(manifest: SprintSpec) -> None:
    """Emit a strategy suggestion informed by the manifest."""

    agent_names = ", ".join(spec.name for spec in manifest.agents)
    notify(
        "Sprint '%s' coordinated agents (%s). Ensure test artifacts are attached and CI is enabled."
        % (manifest.name, agent_names)
    )


def _coerce_command(entry: object) -> CommandSpec:
    if isinstance(entry, dict):
        run = entry.get("run")
        if run is None:
            raise ValueError("Command entry missing 'run'")
        cwd = entry.get("cwd")
        return CommandSpec(run=tuple(run), cwd=Path(cwd) if cwd else None)
    if isinstance(entry, (list, tuple)):
        return CommandSpec(run=tuple(entry))
    raise TypeError(f"Unsupported command entry: {entry!r}")


def load_manifest(path: Path) -> SprintSpec:
    """Load and validate the Athena YAML manifest."""

    data = yaml.safe_load(path.read_text())
    if not data:
        raise ValueError("Manifest is empty")

    sprint_data = data.get("sprint", data)
    agents = []
    base_branch = sprint_data.get("base_branch", "main")
    shared_artifacts = [Path(p) for p in sprint_data.get("shared_artifacts", [])]

    for raw_agent in sprint_data.get("agents", []):
        commands = [_coerce_command(entry) for entry in raw_agent.get("commands", [])]
        if not commands:
            raise ValueError(f"Agent {raw_agent.get('name')} has no commands defined")

        agent = AgentSpec(
            name=raw_agent["name"],
            task=raw_agent.get("task", raw_agent["name"]),
            commands=commands,
            branch=raw_agent.get("branch"),
            base_branch=raw_agent.get("base_branch"),
            artifacts=[Path(p) for p in raw_agent.get("artifacts", [])],
            env={str(k): str(v) for k, v in raw_agent.get("env", {}).items()},
            prompt=raw_agent.get("prompt"),
        )
        agents.append(agent)

    if not agents:
        raise ValueError("Manifest defines no agents")

    return SprintSpec(
        name=sprint_data.get("name", "Unnamed Sprint"),
        agents=agents,
        base_branch=base_branch,
        shared_artifacts=shared_artifacts,
    )


def main(argv: Sequence[str] | None = None) -> None:
    """Orchestrate agents as defined in the manifest."""

    parser = argparse.ArgumentParser(description="Run Athena multi-agent orchestration")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="Path to the Athena manifest YAML file.",
    )
    args = parser.parse_args(argv)

    manifest_path = args.manifest
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")

    manifest = load_manifest(manifest_path)

    for agent in manifest.agents:
        run_agent(agent, manifest)

    suggest_strategy(manifest)


if __name__ == "__main__":
    main()
