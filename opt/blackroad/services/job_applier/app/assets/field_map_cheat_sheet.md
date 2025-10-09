# Field-Map Cheat Sheet

Use this map to push structured answers into common applicant tracking systems. Pair it with the `application_qa_schema.json` keys and the resume + note placeholders.

| Placeholder | Description | Greenhouse Field | Lever Field | Workday Field |
| --- | --- | --- | --- | --- |
| `{{CANDIDATE_NAME}}` | Resume header name | Candidate First/Last Name | Name | Legal Name |
| `{{PREFERRED_NAME}}` | Display name for note/email | Preferred Name | Preferred Name | Preferred Name |
| `{{CANDIDATE_LOCATION}}` | City + State/Region | Location | Location | Home Address (City, State) |
| `{{WORK_AUTHORIZATION}}` | Work eligibility | “Are you legally authorized to work…” | Work Authorization | Work Eligibility |
| `{{SPONSORSHIP_REQUIRED}}` | Future visa requirement | “Will you now or in the future require sponsorship?” | Sponsorship | Require Sponsorship |
| `{{REMOTE_PREFERENCE}}` | Remote/Hybrid/Onsite | Remote Preference custom field | Workstyle | Work Arrangement Preference |
| `{{SALARY_MIN}}` / `{{SALARY_MAX}}` | Base salary expectation (range) | Salary Expectations (min/max) | Compensation Expectations | Desired Compensation |
| `{{COMP_STRUCTURE}}` | Salary vs OTE note | Compensation Notes | Additional Compensation Info | Compensation Comments |
| `{{AVAILABLE_START_DATE}}` | Start date or availability | Earliest Start Date | Start Date | Available Start Date |
| `{{NOTICE_PERIOD}}` | Notice period detail | Notice Period | Notice Period | Notice Period |
| `{{REFERRAL_NAME}}` | Referral contact | Source Details | Referral Name | Referral Source |
| `{{EEO_RESPONSE}}` | EEO optional response | Voluntary EEO Survey | Diversity Survey | Self-ID Survey |
| `{{LINKEDIN_URL}}` | LinkedIn link | Links > LinkedIn | Links | External Profile URL |
| `{{PORTFOLIO_URL}}` | Portfolio or case study | Links > Portfolio | Website | External Portfolio |
| `{{GITHUB_URL}}` | Code samples | Links > GitHub | GitHub | External Profile |
| `{{ADDITIONAL_CONTEXT}}` | Freeform context | Additional Information | Additional Notes | Additional Comments |

**Tips**

- Keep values synced with the resume template so Zap/Make can fill once and reuse everywhere.
- For systems that require dropdown choices, convert free text to the expected slug before submitting.
- Store the completed schema in Airtable so each application pulls the latest approved responses.
