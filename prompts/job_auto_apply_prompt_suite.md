# Job Auto-Apply Prompt Suite

This document codifies the human-in-the-loop job application automation flow tailored for the BlackRoad profile. It captures the candidate anchors, automation architecture, prompt library, and operational runbook for delivering high-volume, high-quality submissions without violating platform ToS.

## Candidate Truth Source

Use the following résumé-backed proof points as the authoritative source for personalization and claims:

- **Sales & Finance:** $9.9M–$23M annuity sales, 33.3% MoM advisor case growth, 92–93% allocations to principal-protected strategies, 200+ advisor trainings, conference presenter (LPL, Securian).
- **Ameriprise:** Surfaced $18.4M AUM, reduced ~$3.1M at-risk, #1 in qualified appointments, 97% CSAT (alt résumé).
- **Real Estate:** 1,000+ cold calls with 80% conversion to leads, 20+ transactions closed, DTI/PITI analysis and loan guidance.
- **AI / Agents / Automation:** Founder of BlackRoad; shipped AI tooling and agent workflows (Python, Flask, WebGL, Salesforce), prompt/orchestration work, Lucidia empathetic agent, multi-agent productivity suite, operational scripts.
- **Licenses:** SIE, 7, 63, 65; Life & Health; MN Real Estate; CFP candidate (in progress).

## No-Code First Architecture

1. **Intake:** Job alerts via email/RSS into Zapier or Make.
2. **Parse:** Fetch JD HTML, extract text, summarize requirements, and flag gaps.
3. **Tailor:** Map must-haves to résumé snap-ins, generate summary, cover letter, and Q&A.
4. **Assemble:** Populate Google Docs résumé template, export PDF, attach to Airtable task.
5. **Track:** Airtable handles Jobs + Submissions tables and review reminders.
6. **Human Loop:** Candidate reviews and clicks submit in ATS portals (LinkedIn, Workday, Greenhouse, Lever, etc.).

### Airtable Schema

- **Jobs:** `(id, title, company, link, source, jd_text, must_haves[], nice_to_haves[], seniority, location, salary, flagged_gaps[], created_at)`
- **Submissions:** `(job_id, status{Queued/Drafted/Applied/Interviewed/Rejected/Offer}, resume_version_url, cover_letter_url, qna_json, date_applied, follow_up_date, notes)`

## Prompt Stack

### 1. JD → Must-Haves Extractor

**System Prompt**

> You are a precise job-description analyst. Return structured JSON only. No prose. When requirements are vague, infer likely terms (APIs, webhooks, Zapier/Make, prompt design, agent orchestration, RAG, Salesforce).

**User Prompt**

```text
JOB_DESCRIPTION = """{{raw_jd_text}}"""
Return:
{
  "role_title": "...",
  "company": "...",
  "seniority": "...",
  "must_haves": ["..."],
  "nice_to_haves": ["..."],
  "screen_outs": ["hard blockers like 'TS/SCI'"],
  "keywords": ["exact JD phrasing for ATS"],
  "question_bank": ["common app questions this JD implies"]
}
```

### 2. Must-Haves → Tailored Bullets

**System Prompt**

> You map job must_haves to my bullet "snap-ins". If no match, propose a new, concise bullet that sounds like the rest. My voice: outcome-first, numbers if true, tools after results, no fluff. Known proof anchors (verifiable):
>
> - Annuity sales $9.9M–$23M; 33.3% MoM case growth; 200+ advisor trainings; 97% CSAT.
> - Ameriprise: $18.4M AUM surfaced; $3.1M at-risk reduced; #1 in qualified appointments.
> - Real estate: 1,000+ cold calls; 80% conversion; 20+ transactions.
> - AI: Founder BlackRoad; Python/Flask/WebGL; prompt/agent workflows; Lucidia agent; Salesforce automations.
> Licenses: SIE, 7, 63, 65; Life & Health; MN RE; CFP candidate.
> If a claim isn’t listed above or in SNAP-INs, ask for confirmation via a boolean flag in JSON.

**User Prompt**

```text
MUST_HAVES = {{array}}
Return:
{
  "chosen_bullets": ["..."],
  "net_new_bullets": ["..."],
  "risky_claims": ["..."]
}
```

### 3. Résumé Summary Generator

**System Prompt**

> Write a 2–3 line professional summary tuned to the JD. Lead with the most relevant proof. No buzzword salads. Keep < 55 words.

**User Prompt**

```text
ROLE="{{role_title}}", COMPANY="{{company}}", MUST_HAVES={{must_haves}}, PROOF={{my_anchor_facts}}
```

### 4. Cover Letter Micro-Note (150–180 words)

**System Prompt**

> Draft a short note I can paste into an application box. No fluff. 3 parts:
> 1) 1–2 proof points with numbers.
> 2) 30-day plan tailored to stack/domain.
> 3) Offer a 2-min Loom.

**User Prompt**

```text
JD_SNIPPET="{{snippet}}", BULLETS={{chosen_bullets}}, COMPANY="{{company}}"
```

### 5. Application Q&A Autofill

**System Prompt**

> Generate JSON answers for common application questions. Use "N/A" when unknown. Keep answers consistent with résumé. Keys:
>   "work_eligibility", "requires_sponsorship", "salary_expectation",
>   "notice_period", "remote_ok", "location", "linkedin_url",
>   "portfolio_url", "certs", "eeo_optional": {...}, "voluntary_disability": {...}

**User Prompt**

```text
CANDIDATE_PROFILE = {{my_profile_json}}, JD="{{title}} @ {{company}}", LOCATION="{{loc}}"
```

### 6. Gap Flagger

**System Prompt**

> Given JD must_haves and profile, list GAPS with 1-line quick remedies (e.g., "no Snowflake" → "take a 1-hr lab; add 'basic SQL + Snowflake familiarity'"). Return JSON: {"gaps": [{"item":"...","remedy":"...","proof_task":"micro-project idea"}]}

### 7. PDF Assembler (Google Docs Template Vars)

**System Prompt**

> You output a key/value map for template substitution. Keys: SUMMARY, BULLETS[], SKILLS[], CERTS[], LINKS[], TITLE_LINE.

**User Prompt**

```text
SUMMARY="{{summary}}", BULLETS={{chosen_bullets + net_new}}, SKILLS={{skills}}, CERTS={{certs}}, LINKS={{links}}
```

## Zapier / Make Scenario

1. Trigger: New RSS item or Gmail "Job alert" label.
2. HTTP GET: Fetch JD, strip HTML.
3. OpenAI Prompt 1: Extract must-haves/keywords.
4. OpenAI Prompt 2 & 3: Map bullets and write summary.
5. OpenAI Prompt 4 & 5: Cover note and Q&A JSON.
6. Google Docs: Fill résumé template and export PDF.
7. Airtable: Create Jobs and Submissions (Queued); attach PDFs and Q&A JSON.
8. Slack/Email: Send one card per job with Apply button (deep-link to JD).
9. Post-apply: On status change to "Applied" auto-set follow-up date (+5 business days) and attach thank-you template.

## Volume Strategy with Quality Guardrails

- Batch 20–40 JDs daily across AI Ops, agent orchestration, sales-ops-with-AI, and fintech ops niches.
- Auto-archive JDs with >2 hard blockers or salary below threshold before running prompts.
- Use the extractor to flag clearance requirements or strict degrees before spending tokens.

## Bullet Snap-In Library

- Drove $23M annuity sales in 10 months; lifted advisor case growth 33.3% MoM with compliant, data-driven outreach.
- Surfaced $18.4M AUM and reduced $3.1M at-risk assets via structured reallocations and Salesforce analytics.
- Built and shipped AI workflows (Python/Flask, Salesforce automations, prompt/agent orchestration) as founder of BlackRoad, plus an empathetic agent (Lucidia) prototype.
- Converted 80% of 1,000+ live leads; closed 20+ real-estate transactions with DTI/PITI analysis.

## Next Step

Provide a live JD that fits the target bands. The automation flow will run prompts 1–7, assemble tailored collateral, and queue the application package in Airtable for final human review.
