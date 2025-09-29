# One-shot Orchestrator Superprompt Quickstart

## Overview
The "chef's kiss" orchestrator block introduces a speed-focused, single-call workflow. By sending a single message that includes your candidate seed, SnapIns JSON, and the raw job description (JD), the orchestrator returns an entire application enablement pack as JSON.

## Downloadable Assets
- **One-shot Orchestrator Superprompt** – paste this into the LLM of your choice to run the flow as a single message.
- **Dummy JD (Remote U.S.)** – synthetic JD for validating the chain without exposing real requisitions.
- **Sample Output Pack** – reference output demonstrating every field returned by the orchestrator:
  - 55-word summary
  - Six tailored bullets (JSON array)
  - Cover letter micro-note
  - Application Q&A (JSON)
  - Resume template variables (JSON)

Keep the sample output handy so you can validate field names and shapes when wiring downstream automations.

## Usage
1. **Paste the Superprompt:** Load the OneShot_Orchestrator_Superprompt into your LLM.
2. **Provide the Inputs:** Supply the candidate seed, SnapIns configuration JSON, and the raw JD text.
3. **Receive the Pack:** The orchestrator returns a single JSON payload containing:
   - Meta information
   - 55-word summary
   - Six tailored bullets
   - Cover letter micro-note
   - Application Q&A
   - Identified gaps
   - Resume template variables
4. **Automate:** Feed the JSON directly into Google Docs and Airtable modules. The shape is designed to flow into existing document and database automations without post-processing.

## Live JD Runs
Ready to test on a live JD? Drop the requisition into the orchestrator to receive the full pack instantly. For automation walkthroughs, request the Make or Zapier module configurations to get step-by-step wiring instructions.

## Next Steps
When you have a new JD to process, reply with `next` to initiate the orchestrator run. This keeps the flow ready for rapid iteration with real requisitions.
