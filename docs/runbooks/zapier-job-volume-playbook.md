# Zapier Job Volume Playbook

This runbook captures the full Zapier wiring needed to turn labeled job alert emails into ready-to-send application packets. Follow the steps below to stand the automation up in a fresh Zapier account and keep Airtable, Google Docs, and Slack in sync.

## Assets in this repository

| Asset | Description |
| --- | --- |
| `docs/imports/airtable_jobs_template.csv` | Airtable **Jobs** base import with the required headers. |
| `docs/imports/airtable_submissions_template.csv` | Airtable **Submissions** base import with the required headers. |

Download each CSV and import them into the target Airtable base before turning on the Zap.

## Zap outline

1. **Trigger — Email by Zapier (New Email in Gmail)**
   - Label selector: `Job alerts`.
   - Search string: `label:("Job alerts")` to scope the trigger.
2. **Action — Webhooks by Zapier (GET)**
   - URL: dynamic from the job description URL (pull from the email body or RSS item).
   - `Send as JSON`: **No**.
   - `Follow redirects`: **Yes** (ensures shortened links resolve).
3. **Action — Code by Zapier (Python)**
   - Goal: strip HTML down to text the models can consume.
   - Starter snippet:

     ```python
     from bs4 import BeautifulSoup

     body = input_data.get("html") or ""
     soup = BeautifulSoup(body, "html.parser")

     for tag in soup(["script", "style"]):
         tag.decompose()

     text = " ".join(soup.get_text(separator=" ").split())
     return {"jd_text": text}
     ```

   - If BeautifulSoup is unavailable, fall back to regex that removes tags and collapses whitespace.
     ```python
     import html
     import re

     raw = input_data.get("html") or ""
     text = re.sub(r"<[^>]+>", " ", raw)
     text = re.sub(r"\s+", " ", html.unescape(text)).strip()
     return {"jd_text": text}
     ```
4. **Action — OpenAI (Chat Completions)**
   - Purpose: convert the job description into the Step 1 `must_haves` JSON payload.
   - Model: GPT-4o Mini (or equivalent) with `temperature` **0.2**.
   - System prompt: `strict JD parser`.
   - User prompt: feed `{{jd_text}}` from the Python step.
5. **Filter by Zapier**
   - Continue only when `remote_policy` is either `Remote U.S.` or `Remote MN`.
   - Ensure `screen_outs` does **not** include clearance requirements, mandatory on-site expectations, or degree requirements you cannot satisfy.
   - Regex helpers for the Python step (if needed):
     - Remote detection: `r"\b(remote(?:\s+us|[-\s]*united\s+states| anywhere in the us)|remote\s+minnesota)\b", flags `re.I | re.M`.
     - Hybrid/on-site exclusion: `r"\b(hybrid|onsite|on-site|in[-\s]*office)\b", flags `re.I`.
6. **Action — OpenAI (Chat Completions)**
   - Input: validated JSON payload from Step 4.
   - Output: tailored bullets (Step 3) and a 55-word summary (Step 4).
7. **Action — OpenAI (Chat Completions)**
   - Input: same context plus Step 6 output.
   - Output: cover micro-note, interview Q&A JSON, and gaps analysis (Steps 5–7).
8. **Action — Google Docs (Create from Template)**
   - Template keys:
     - `TITLE_LINE`: `AI Agent Orchestration Lead — Remote (U.S./MN)`
     - `SUMMARY`: output from Step 6.
     - `BULLETS_1`..`BULLETS_6`: bullet strings from Step 6.
     - `SKILLS`: `LLM orchestration; Zapier/Make/n8n; Airtable/Sheets; APIs/Webhooks; Eval & guardrails`
     - `CERTS`: `SIE; 7; 63; 65; Life & Health; MN Real Estate`
     - `LINKS`: `blackroad.io • blackroadinc.us • LinkedIn`
   - Export the doc as PDF.
9. **Action — Google Drive (Export File)**
   - Retrieve the shareable PDF link for downstream systems.
10. **Action — Airtable (Create Record)**
    - Base: **Job Hunt** → Table: **Jobs**.
    - Map outputs to the headers supplied in `airtable_jobs_template.csv`.
11. **Action — Airtable (Create Record)**
    - Base: **Job Hunt** → Table: **Submissions**.
    - Set `status` = `Drafted` and attach `resume_pdf_url`, `cover_note_url`, and `qna_json`.
12. **Action — Slack (Send DM) or Email**
    - Include the JD link, 55-word summary, cover note (paste-ready), and a button-style “Apply” link pointed at the applicant tracking form.

## Airtable configuration

### Jobs table fields

| Field | Type | Notes |
| --- | --- | --- |
| `title` | Single line text | Job title from JD. |
| `company` | Single line text | Hiring company. |
| `link` | URL | JD source link. |
| `source` | Single select | e.g., `Job alerts`, `Referral`. |
| `jd_text` | Long text | Cleaned JD text. |
| `remote_policy` | Single select | `Remote U.S.`, `Remote MN`, `Hybrid`, `Onsite`, `Unknown`. |
| `must_haves` | Multiple select | Parsed from Step 4. |
| `nice_to_haves` | Multiple select | Parsed from Step 4. |
| `screen_outs` | Multiple select | Parsed from Step 4. |
| `salary_text` | Long text | Salary range or notes. |
| `keywords` | Long text | Model-suggested tags. |
| `location_text` | Single line text | City/state if present. |
| `seniority` | Single select | Align with internal leveling. |
| `created_at` | Created time | Auto-generated by Airtable. |

### Submissions table fields

| Field | Type | Notes |
| --- | --- | --- |
| `job_id` | Link to Jobs | Link each submission to the JD record. |
| `status` | Single select | Defaults to `Drafted`. |
| `resume_pdf_url` | URL | Link to exported resume PDF. |
| `cover_note_url` | URL | Link to cover note doc. |
| `qna_json` | Long text | Output from Step 7. |
| `date_applied` | Date | Fill when application is sent. |
| `follow_up_date` | Date | Next follow-up reminder. |
| `notes` | Long text | Status updates. |

Import the provided CSV templates to seed these tables with the correct schema.

## Quality gates

Before investing time in personalization, automatically archive any JD that:

- Requires security clearance or other hard blockers surfaced in `screen_outs`.
- Specifies mandatory on-site presence outside Remote U.S./MN coverage.
- Demands degrees or credentials you cannot meet.
- Offers compensation below your floor (tag as `Lowball` if you want to track it).

## Operating loop

1. Label incoming opportunities in Gmail with `Job alerts`.
2. The Zap runs end-to-end and drops drafts into Airtable plus a PDF package in Drive.
3. You receive a Slack DM/email containing the JD link, summary, cover note, and Q&A JSON.
4. Review, tweak if needed, and hit the “Apply” link from the message to submit.

Drop a fresh JD into the labeled inbox and reply "next" to trigger the chain on demand.
