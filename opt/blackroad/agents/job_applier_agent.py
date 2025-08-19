#!/usr/bin/env python3
"""
Lucidia Agent: job_applier
- prepare + dispatch /apply payloads to the microservice
"""
import os, json, httpx

JOB_APPLIER_URL = os.environ.get("JOB_APPLIER_URL", "http://localhost:9301")

def apply(job_urls, resume_text=None, cover_template=None, profile=None, dry_run=None):
    payload = {
        "job_urls": job_urls,
        "resume_text": resume_text,
        "cover_template": cover_template,
        "profile": profile or {},
    }
    if dry_run is not None:
        payload["dry_run"] = bool(dry_run)
    r = httpx.post(f"{JOB_APPLIER_URL}/apply", json=payload, timeout=60)
    r.raise_for_status()
    return r.json()

def run_status(run_id):
    r = httpx.get(f"{JOB_APPLIER_URL}/runs/{run_id}", timeout=20)
    r.raise_for_status()
    return r.json()
