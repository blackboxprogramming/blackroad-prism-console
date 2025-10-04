import { FilingArtifactKind, PlannedTask, TaskStatus, TaskTemplate, TaskTemplateKey } from "./types.js";

const taskTemplates: Record<TaskTemplateKey, TaskTemplate> = {
  FETCH_CRD_HISTORY: {
    key: "FETCH_CRD_HISTORY",
    title: "Fetch CRD history",
    description: "Pull the latest CRD registration history for the representative.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  PARSE_BROKERCHECK_PDF: {
    key: "PARSE_BROKERCHECK_PDF",
    title: "Parse BrokerCheck PDF",
    description: "Extract registrations, exams, and disclosures from BrokerCheck PDF.",
    blocking: false,
    requiredArtifacts: ["Form"],
  },
  VERIFY_DISCLOSURES: {
    key: "VERIFY_DISCLOSURES",
    title: "Verify disclosures",
    description: "Confirm all required disclosures are up to date and acknowledged.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  SCHEDULE_SERIES65_EXAM: {
    key: "SCHEDULE_SERIES65_EXAM",
    title: "Schedule Series 65 exam",
    description: "Book the Series 65 exam or confirm waiver eligibility.",
    blocking: true,
    requiredArtifacts: ["ExamPass"],
  },
  FILE_U4: {
    key: "FILE_U4",
    title: "File Form U4",
    description: "Submit Form U4 via the appropriate portal.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  ADV_FILE_FIRM: {
    key: "ADV_FILE_FIRM",
    title: "Update Form ADV",
    description: "Ensure the firm Form ADV filings are current.",
    blocking: false,
    requiredArtifacts: ["Form"],
  },
  INSURANCE_REINSTATE_VIA_SIRCON: {
    key: "INSURANCE_REINSTATE_VIA_SIRCON",
    title: "Reinstate insurance license via Sircon",
    description: "Complete the Sircon reinstatement workflow for the producer license.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  UPLOAD_CE_CERTS: {
    key: "UPLOAD_CE_CERTS",
    title: "Upload CE certificates",
    description: "Collect and upload continuing education certificates.",
    blocking: true,
    requiredArtifacts: ["ProofCE"],
  },
  PAY_REINSTATEMENT_FEE: {
    key: "PAY_REINSTATEMENT_FEE",
    title: "Pay reinstatement fee",
    description: "Submit required reinstatement payments.",
    blocking: true,
    requiredArtifacts: ["Fee"],
  },
  REAL_ESTATE_REINSTATE: {
    key: "REAL_ESTATE_REINSTATE",
    title: "Reinstate real estate license",
    description: "File reinstatement application for real estate credential.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  FINGERPRINTS: {
    key: "FINGERPRINTS",
    title: "Submit fingerprints",
    description: "Complete fingerprints for background check.",
    blocking: true,
    requiredArtifacts: ["Fingerprint"],
  },
  APPOINTMENTS_REAPPLY: {
    key: "APPOINTMENTS_REAPPLY",
    title: "Reapply insurance appointments",
    description: "Re-establish carrier appointments after reinstatement.",
    blocking: false,
    requiredArtifacts: ["Appointment"],
  },
  SECURE_BD_SPONSOR: {
    key: "SECURE_BD_SPONSOR",
    title: "Secure BD sponsorship",
    description: "Obtain broker-dealer sponsorship required for registration.",
    blocking: true,
    requiredArtifacts: ["Affidavit"],
  },
  VERIFY_LICENSE_EXPIRATION: {
    key: "VERIFY_LICENSE_EXPIRATION",
    title: "Verify license expiration date",
    description: "Confirm the official expiration date with the state regulator.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  COMPLETE_BACKGROUND_CHECK: {
    key: "COMPLETE_BACKGROUND_CHECK",
    title: "Complete background check",
    description: "Finalize background check requirements for reinstatement.",
    blocking: true,
    requiredArtifacts: ["Background"],
  },
  SUBMIT_STATE_APPLICATION: {
    key: "SUBMIT_STATE_APPLICATION",
    title: "Submit state application",
    description: "File state-specific reinstatement application.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  PAY_STATE_FEES: {
    key: "PAY_STATE_FEES",
    title: "Pay state fees",
    description: "Record payments required by the state.",
    blocking: true,
    requiredArtifacts: ["Fee"],
  },
  PRELICENSING_COURSE: {
    key: "PRELICENSING_COURSE",
    title: "Complete pre-licensing course",
    description: "Complete state-mandated pre-licensing education.",
    blocking: true,
    requiredArtifacts: ["ProofCE"],
  },
  SCHEDULE_INSURANCE_EXAM: {
    key: "SCHEDULE_INSURANCE_EXAM",
    title: "Schedule insurance exam",
    description: "Schedule the insurance licensing exam.",
    blocking: true,
    requiredArtifacts: ["ExamPass"],
  },
  NEW_APPLICATION: {
    key: "NEW_APPLICATION",
    title: "Submit new application",
    description: "Prepare a new application when reinstatement window has passed.",
    blocking: true,
    requiredArtifacts: ["Form"],
  },
  SCHEDULE_REAL_ESTATE_EXAM: {
    key: "SCHEDULE_REAL_ESTATE_EXAM",
    title: "Schedule real estate exam",
    description: "Book the required real estate exam before requalification.",
    blocking: true,
    requiredArtifacts: ["ExamPass"],
  },
};

export function getTaskTemplate(key: TaskTemplateKey): TaskTemplate {
  const template = taskTemplates[key];
  if (!template) {
    throw new Error(`Unknown task template: ${key}`);
  }
  return template;
}

export function instantiateTask(params: {
  template: TaskTemplateKey;
  personId: string;
  stateCode: string;
  track: string;
  licenseType: string;
  due?: Date | null;
  payload?: Record<string, unknown>;
}): PlannedTask {
  const template = getTaskTemplate(params.template);
  return {
    id: buildTaskId({
      personId: params.personId,
      stateCode: params.stateCode,
      track: params.track,
      template: params.template,
      licenseType: params.licenseType,
    }),
    personId: params.personId,
    stateCode: params.stateCode,
    track: params.track as PlannedTask["track"],
    licenseType: params.licenseType,
    template: params.template,
    title: template.title,
    status: "Open" satisfies TaskStatus,
    blocking: template.blocking,
    due: params.due ?? null,
    payload: params.payload,
    requiredArtifacts: template.requiredArtifacts,
  };
}

export function buildTaskId(input: {
  personId: string;
  stateCode: string;
  track: string;
  template: TaskTemplateKey;
  licenseType: string;
}): string {
  return [input.personId, input.stateCode, input.track, input.licenseType, input.template]
    .map((segment) => segment.replace(/[^A-Za-z0-9:_-]/g, ""))
    .join(":");
}

export function validateTaskCompletion(
  templateKey: TaskTemplateKey,
  artifacts: Array<{ kind: FilingArtifactKind; path: string }>
): void {
  const template = getTaskTemplate(templateKey);
  if (template.requiredArtifacts.length === 0) {
    return;
  }

  const hasRequired = artifacts.some((artifact) =>
    template.requiredArtifacts.includes(artifact.kind)
  );

  if (!hasRequired) {
    throw new Error(
      `Task ${templateKey} cannot be completed without at least one artifact of types: ${template.requiredArtifacts.join(", ")}`
    );
  }
}

export function listTaskTemplates(): TaskTemplate[] {
  return Object.values(taskTemplates);
}
