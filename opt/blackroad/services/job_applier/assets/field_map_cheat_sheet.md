# Application Field Map Cheat Sheet

Use this map when loading Zapier/Make output into applicant tracking systems. Each row shows the source placeholder, what it represents, and the corresponding field or question to target.

| Placeholder | Meaning | Greenhouse | Lever | Workday |
|-------------|---------|------------|-------|---------|
| `{{FULL_NAME}}` | Candidate legal name | **Candidate Name** (Profile) | **Full name** | Job Application > Personal Information > *Legal Name* |
| `{{EMAIL}}` | Primary email | **Email** | **Email** | Personal Information > *Email Address* |
| `{{PHONE}}` | Best phone number | **Phone** | **Phone number** | Contact Information > *Primary Phone* |
| `{{CITY}}, {{STATE_OR_COUNTRY}}` | Location string | **Location** | **Location** (Profile field) | Personal Information > *Home Address* (City/State) |
| `{{LINKEDIN_OR_PORTFOLIO}}` | Public link | Application Question: "LinkedIn Profile" | Custom question "Online presence" | External Links > *Professional Profile* |
| `{{SUMMARY}}` | 55-word headline | Application Question: "Summary" (short answer) | Notes > "Candidate Summary" | Application Questions > *Professional Summary* |
| `{{BULLETS_1}}` … `{{BULLETS_6}}` | Impact bullets | Attach as Resume PDF or paste into "Key Achievements" | Opportunities > "Highlights" | Job History > *Key Achievements* |
| `{{SALARY_REQUIREMENT}}` | Compensation target | "Salary Expectations" (currency) | "Compensation expectations" custom field | Application Questions > *Desired Compensation* |
| `{{EARLIEST_START}}` | Availability date | "Available Start Date" | "Availability" | Application Questions > *When can you start?* |
| `{{THIRTY_DAY_PLAN}}` | First month focus | Interview Prep: attach to "Notes" | Opportunities > "Next steps" | Hiring Team Notes > *Ramp Plan* |
| `{{ADDITIONAL_CONTEXT}}` | Optional clarifications | Application Question: "Anything else?" | Notes > "Additional context" | Application Questions > *Additional Information* |

**Workflow tips**
- Export the resume template as PDF to retain formatting for ATS parsing.
- Keep the cover note in plaintext for pasting into portals; save a copy in Airtable for traceability.
- Mirror yes/no compliance answers (veteran, disability) exactly as surfaced in the JSON schema to avoid mismatches across systems.
