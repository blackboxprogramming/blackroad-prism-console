# Human-in-the-Loop Auto-Apply Blueprint

The goal is to automate 90% of the application workflow while keeping a human final review to comply with platform terms and maintain quality.

## Architecture Overview

1. **Intake Form** (Airtable, Notion Form, or Tally) collects:
   - Job URL, role title, company, salary range, location.
   - Required skills/tools, seniority, contact info (if known).
   - Priority score (High/Med/Low) and deadline.
2. **Job Description Fetcher** retrieves and cleans the job posting content via API (SerpAPI, Jina Reader, or manual paste).
3. **Profile Library** stores resume bullets, project summaries, metrics, and Loom demo links tagged by skill/industry.
4. **LLM Tailor Agent** matches job requirements to bullet bank, drafts resume updates, and prepares cover letter copy.
5. **Document Composer** assembles a PDF resume using a template (Google Docs API, Canva, or Markdown → PDF pipeline).
6. **Application Task Generator** creates a task with pre-filled answers in a Kanban tool (Airtable, Asana, Trello) for final review and submission.
7. **Human Review Gate** confirms accuracy, adjusts tone, and clicks submit on the employer portal.

## Recommended Stack

- **Database**: Airtable base with tables for `Jobs`, `Companies`, `Bullets`, `Projects`, and `Applications`.
- **Automation Platform**: Make (Integromat) or Zapier for orchestrating triggers and actions.
- **LLM Service**: OpenAI GPT-4o or Anthropic Claude via API for tailoring content.
- **Document Generation**: Google Docs API with pre-styled resume template or Documint for structured PDFs.
- **Storage**: Google Drive folder to store generated PDFs and cover letters.

## Airtable Schema

### Jobs Table
- `Job URL` (URL)
- `Company` (Single line)
- `Role Title`
- `Status` (Single select: New, Drafting, Review, Submitted, Interview, Closed)
- `Priority` (Single select: High, Medium, Low)
- `Deadline` (Date)
- `Salary` (Currency)
- `Location`
- `Source` (Single select: LinkedIn, Indeed, Referral, Other)
- `JD Text` (Long text)
- `Attachments` (File) for saved PDFs/screenshots

### Bullets Table
- `Skill Tag` (Multi select)
- `Bullet Text` (Long text)
- `Metric` (Number)
- `Project Link` (URL)
- `Notes`

### Projects Table
- `Project Name`
- `Problem Statement`
- `Solution Summary`
- `Outcome Metric`
- `Demo Link`
- `Tags`

### Applications Table
- Linked record to `Jobs`
- `Resume Version` (Attachment)
- `Cover Letter` (Attachment)
- `Question Responses` (Long text)
- `Submission Date`
- `Follow-Up Date`
- `Notes`

## Make Scenario Outline

1. **Trigger**: New record in Airtable `Jobs` with Status = `New`.
2. **Module**: HTTP > Get job description text (use Make's HTTP module with the job URL + scraper if allowed, or require manual JD paste).
3. **Module**: Update `JD Text` field in Airtable.
4. **Module**: OpenAI > Create prompt summarizing the JD into top responsibilities, required tools, and keywords.
5. **Module**: Airtable Search > Find matching bullets by tags and metrics.
6. **Module**: OpenAI > Draft tailored bullet suggestions and a summary paragraph referencing JD keywords; require neutral tone and measurable outcomes.
7. **Module**: Google Docs > Create document from template, injecting header info, summary, tailored bullets, and relevant projects.
8. **Module**: Google Docs > Export file as PDF; save to Drive folder named `Applications/<Company>/<Role>/`.
9. **Module**: Airtable > Attach generated PDF and AI cover letter text to the `Applications` linked record; set Status to `Review`.
10. **Module**: Task Manager (e.g., Asana/Trello) > Create card titled `Review + Submit: <Company> - <Role>` with attachments and summary of key answers.
11. **Module**: Slack/Email > Notify you with link to task and due date reminder.

## Review Checklist (Human Step)

Before submitting:
- Validate company name, role title, and salary expectation.
- Confirm metrics and achievements are accurate and permissioned.
- Read the generated summary/bullets for tone alignment and remove hallucinations.
- Fill portal-specific questions (eligibility, location, work authorization) manually.
- Click submit yourself to comply with site policies.

## Safeguards & Compliance

- Respect job board Terms of Service—no credential sharing or automated form submissions.
- Log all generated content with timestamps for auditability.
- Keep API keys secret and rotate regularly.
- Store sensitive personal data encrypted at rest.
- Set manual overrides so nothing is sent without human approval.

## Extension Ideas

- Add analytics dashboard to track conversion rates (applications → interviews → offers).
- Incorporate follow-up sequence templates triggered 3 days after submission.
- Maintain library of interview prep notes linked to each job.
- Capture rejection feedback to refine future bullet suggestions.

This blueprint keeps you compliant while dramatically cutting time-to-apply.
