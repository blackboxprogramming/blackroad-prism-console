"""Bindings between contract names and concrete agent implementations."""
from __future__ import annotations

import logging
import subprocess
from typing import Any, Dict, MutableMapping

from agents.build_blackroad_site_agent import build_site
from agents.cleanup_bot import CleanupBot
from agents.website_bot import WebsiteBot

LOGGER = logging.getLogger(__name__)


class AgentExecutionError(RuntimeError):
    """Wrap low-level exceptions with a contract failure identifier."""

    def __init__(self, failure_mode: str, message: str, *, cause: Exception | None = None) -> None:
        super().__init__(message)
        self.failure_mode = failure_mode
        self.__cause__ = cause


def cleanup_git_branches_executor(context: MutableMapping[str, Any]) -> Dict[str, Any]:
    """Execute the cleanup bot using either explicit branches or discovery."""

    dry_run = bool(context.get("dry_run", False))
    branches = context.get("branches")
    base_branch = context.get("base_branch", "main")

    try:
        if branches:
            bot = CleanupBot(branches=list(branches), dry_run=dry_run)
        else:
            bot = CleanupBot.from_merged(base=base_branch, dry_run=dry_run)
    except RuntimeError as exc:  # discovery failed
        raise AgentExecutionError("DISCOVERY_FAILED", str(exc), cause=exc) from exc

    results = bot.cleanup()
    if not all(results.values()):
        LOGGER.warning("Some branches failed to delete", extra={"results": results})
    return {"cleanup_report": results}


def build_blackroad_site_executor(context: MutableMapping[str, Any]) -> Dict[str, Any]:
    """Run the npm build and capture the exit code."""

    exit_code = build_site()
    if exit_code != 0:
        LOGGER.error("Site build returned non-zero exit code", extra={"code": exit_code})
    return {"build_exit_code": exit_code}


def deploy_blackroad_site_executor(context: MutableMapping[str, Any]) -> Dict[str, Any]:
    """Deploy the website and optionally manage cache."""

    deploy_command = context.get("deploy_command") or ["/deploy", "blackroad", "pages"]
    purge_cache = context.get("purge_cache", True)
    warm_cache = context.get("warm_cache", True)
    build_exit_code = context.get("build_exit_code")

    if build_exit_code is None or build_exit_code != 0:
        raise AgentExecutionError(
            "BUILD_NOT_READY",
            "Deployment requires a successful build exit code of 0",
        )

    bot = WebsiteBot(
        deploy_cmd=list(deploy_command),
    )

    summary: Dict[str, Any] = {"deployed": False, "cache_purged": False, "cache_warmed": False}

    try:
        bot.deploy()
        summary["deployed"] = True
    except subprocess.CalledProcessError as exc:
        raise AgentExecutionError("DEPLOY_FAILED", "Website deploy failed", cause=exc) from exc

    if purge_cache:
        try:
            bot.purge_cache()
            summary["cache_purged"] = True
        except subprocess.CalledProcessError as exc:
            raise AgentExecutionError("CACHE_PURGE_FAILED", "Cache purge failed", cause=exc) from exc

    if warm_cache:
        try:
            bot.warm_cache()
            summary["cache_warmed"] = True
        except subprocess.CalledProcessError as exc:
            raise AgentExecutionError("CACHE_WARM_FAILED", "Cache warm failed", cause=exc) from exc

    return {"deployment_summary": summary}


EXECUTOR_MAP = {
    "cleanup_git_branches": cleanup_git_branches_executor,
    "build_blackroad_site": build_blackroad_site_executor,
    "deploy_blackroad_site": deploy_blackroad_site_executor,
}


__all__ = [
    "AgentExecutionError",
    "EXECUTOR_MAP",
    "build_blackroad_site_executor",
    "cleanup_git_branches_executor",
    "deploy_blackroad_site_executor",
]
