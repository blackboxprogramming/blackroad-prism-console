# AI Agent Orchestration Lead (No/Low-Code)

## About the Role
You’ll conduct the AI “band”: design multi-agent workflows, write and iterate prompts, and stitch agents into business systems—without demanding heavy custom code. You own reliability, evaluation, and documentation so teams can trust and scale what they ship.

## Responsibilities
- Orchestrate agents (planning ↔ tools ↔ retrieval) with human-in-the-loop review gates.
- Build prompt libraries, regression tests, and guardrails; track failure taxonomies and fix-loops.
- Integrate with CRMs/Asana/Jira/Sheets/Airtable via Zapier/Make/n8n and light scripting.
- Instrument everything: logs, metrics, A/Bs, red-team checks.
- Ship fast, document clearly, and leave an audit trail others can maintain.

## Signals You’re Great
- Delivered outcomes in live domains (finance, sales ops, support) using agents and automation.
- Can explain where AI fails (hallucinations, context loss, tool misuse) and how you prevent it.
- Comfortable with APIs/webhooks and “glue code,” but you don’t worship boilerplate.
- Portfolio includes Looms, prompt sheets, eval tables, and runbooks.

## Why This Role Exists Now
Prompt-only jobs are morphing into orchestration plus process automation. Employers still want results and reliability, not just clever prompts—so this role centers evaluation, integration, and ops. Use this copy on [blackroad.io](https://blackroad.io) or [blackroadinc.us](https://blackroadinc.us) as a “What I Do” section and link to proof (Looms, projects, repo).

---

# Codex-Style Prompt Kit

Paste the prompts below into your LLM of choice. They assume single-column resumes with no images or tables so ATS parsers cleanly capture your keywords and experience.

## 0. Profile Seed
```json
CANDIDATE = {
  "name": "Alexa Louise",
  "locations_ok": ["Remote (U.S.)", "Remote (Minnesota)"],
  "links": {
    "site": "https://blackroad.io",
    "site_alt": "https://blackroadinc.us",
    "linkedin": "<your_link>",
    "github_or_notion": "<your_repo_or_hub>"
  },
  "proof": {
    "finance_sales": ["$23M annuity sales", "33.3% MoM case growth", "200+ advisor trainings"],
    "ameriprise": ["$18.4M AUM surfaced", "$3.1M at-risk reduced", "#1 in qualified appointments"],
    "real_estate": ["1,000+ live leads", "80% lead-to-oppty", "20+ transactions"],
    "ai_ops": ["BlackRoad agent workflows", "Lucidia empathetic agent", "Salesforce automations", "Python/Flask/JS glue"]
  },
  "licenses": ["SIE, 7, 63, 65", "Life & Health", "MN RE", "CFP candidate"]
}
```

## 1. JD → Must-Haves JSON
**System**

Be a strict JD parser. Return JSON only. Extract: `role_title`, `company`, `location`, `remote_policy`, `must_haves[]`, `nice_to_haves[]`, `screen_outs[]`, `salary_text`, `keywords[]`.
Remote policy must be one of: `["Remote U.S.", "Remote MN", "Hybrid", "Onsite", "Unknown"]`.

**User**

```
JD = """{{paste job description}}"""
```

## 2. Remote Filter (U.S./Minnesota Only)
**System**

Gatekeep. If `remote_policy ∉ {"Remote U.S.", "Remote MN"}` → `{"drop": true, "reason": "Not fully remote U.S./MN"}` else `{"drop": false}`.

## 3. Must-Haves → Tailored Bullets (Uses Your Proof)
**System**

Map `must_haves` to outcome-first bullets from `CANDIDATE.proof`. If none exist, propose a new bullet that is plausible and non-hyped. Keep 1–2 lines each.
Return `{"bullets": [], "risks": ["claims needing confirmation"]}`.

## 4. 55-Word Summary (ATS-Clean)
**System**

Write a 2–3 line summary (<55 words) tuned to the JD. Lead with quantified proof; name tools last. No emojis, no tables, no special characters beyond ASCII. Single-column resume assumptions apply.

## 5. Cover Micro-Note (150–180 Words)
**System**

Draft an application note with three parts: (1) two numeric proofs, (2) a 30-day plan tied to stack/domain, (3) link to portfolio on blackroad.io. Plain text only.

## 6. App Q&A Autofill
**System**

Produce JSON for Workday/Greenhouse short answers. Keys: `eligibility`, `sponsorship`, `notice_period`, `salary_min`, `salary_pref`, `timezone`, `locations_ok`, `linkedin`, `portfolio`, `certs`, `eeo_optional{}`, `disability_optional{}`. Never contradict `CANDIDATE`.

## 7. Gap Flags + Micro-Project Idea
**System**

List gaps from `must_haves`. For each, give a one-liner remedy and a 1–2 hour micro-project to prove it publicly.
Return `[{"gap": "", "remedy": "", "proof_task": ""}]`.

## 8. Resume Template Vars
**System**

Output:

```json
{
  "SUMMARY": "...",
  "BULLETS": ["...", "...", "..."],
  "SKILLS": ["LLM orchestration", "Zapier/Make/n8n", "Airtable/Sheets", "APIs/webhooks", "Eval & guardrails"],
  "CERTS": [...],
  "LINKS": [...],
  "TITLE_LINE": "AI Agent Orchestration Lead — Remote (U.S./MN)"
}
```

---

## Workflow Blueprint (Volume Without Bans)
1. **Intake:** Indeed/LinkedIn/boards → email/RSS → Zapier/Make fetch JD text.
2. **Parse & Tailor:** Run Prompts 1–4 → create Google Doc from template → export PDF.
3. **Q&A:** Run Prompt 6 → store JSON with the job record.
4. **Queue:** Airtable “Submissions: Drafted” with links to PDF resume + micro-note + Q&A answers.
5. **You Click Submit:** Deep-link the JD (LinkedIn/Greenhouse/Lever/Workday). Paste approved text and attach the PDF.
6. **Follow-Up:** Auto set +5 business days reminder; log status.

## Guardrails
- LinkedIn and Workday prohibit bot-driven submissions and scraping, so keep a human in the loop to avoid account bans.
- Resumes stay single-column with standard headers, no images or tables, and clean date formats (e.g., `Jan 2023–Aug 2025`) to avoid ATS parsing errors.

## Search Filters for Remote U.S./MN
- **Indeed:** Use “United States (Remote)” or “Remote” location plus keywords; save searches and pipe alerts to Gmail (label “Job alert”). Only queue postings explicitly stating “Remote U.S.” or “Anywhere in U.S.” and reject hybrid roles.

## Automation Notes
If desired, wire Zapier/Make steps and an Airtable schema to automate this flow. Or drop a JD and run the prompt chain to produce a ready-to-submit application pack on demand.
