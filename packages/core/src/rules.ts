import { instantiateTask } from "./tasks.js";
import {
  LicenseTrack,
  PlannedTask,
  ReinstatementRule,
  RuleEvaluationResult,
  Rulebook,
  TaskTemplateKey,
  TransitionRule,
} from "./types.js";

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function selectTransition(rule: ReinstatementRule, status: LicenseTrack["status"], daysSinceExpiration?: number): TransitionRule | undefined {
  const applicable = rule.transitions.filter((transition) => transition.from === status);
  if (applicable.length === 0 && status === "Expired") {
    // Some rules may use Unknown for catch-all; include them.
    return rule.transitions.find((transition) => transition.from === "Unknown");
  }

  if (status === "Expired" && typeof daysSinceExpiration === "number") {
    const withinWindow =
      typeof rule.reinstatementWindowDays === "number" &&
      daysSinceExpiration <= rule.reinstatementWindowDays;

    const beyondRequalify =
      typeof rule.reinstatementWindowDays === "number" &&
      daysSinceExpiration > rule.reinstatementWindowDays;

    if (withinWindow) {
      return applicable.find((transition) => transition.to === "Active") ?? applicable[0];
    }
    if (beyondRequalify) {
      return (
        applicable.find((transition) => transition.to === "Requalify") ??
        rule.transitions.find((transition) => transition.to === "Requalify")
      );
    }
  }

  return applicable[0];
}

function ensureDueDate(expiration: Date | undefined, fallbackDays = 30): Date | undefined {
  if (!expiration) {
    return undefined;
  }
  const due = new Date(expiration.getTime());
  due.setDate(due.getDate() - fallbackDays);
  return due;
}

function mapFormToTasks(form: string): TaskTemplateKey[] {
  switch (form) {
    case "U4":
      return ["FILE_U4"];
    case "ADV":
      return ["ADV_FILE_FIRM"];
    case "Sircon":
    case "NIPR":
    case "StateApp":
      return ["SUBMIT_STATE_APPLICATION"];
    case "RealEstateApp":
      return ["REAL_ESTATE_REINSTATE"];
    default:
      return [];
  }
}

export function evaluateRulebook(params: {
  personId: string;
  licenseTrack: LicenseTrack;
  rulebook: Rulebook;
  now?: Date;
}): RuleEvaluationResult {
  const { personId, licenseTrack, rulebook } = params;
  const now = params.now ?? new Date();
  const rule = rulebook.rules;
  const tasks: PlannedTask[] = [];
  const blockers: string[] = [];
  const notes: string[] = [];

  let daysSinceExpiration: number | undefined;

  if (licenseTrack.expiration) {
    daysSinceExpiration = daysBetween(now, licenseTrack.expiration);
  } else {
    tasks.push(
      instantiateTask({
        template: "VERIFY_LICENSE_EXPIRATION",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
        payload: { reason: "Expiration date missing" },
      })
    );
    blockers.push("Expiration date unknown");
  }

  const transition = selectTransition(rule, licenseTrack.status, daysSinceExpiration);
  if (!transition) {
    blockers.push("No reinstatement transition available in rulebook");
    return {
      target: "Requalify",
      tasks,
      blockers,
      fees: rule.fees ?? null,
      notes,
    };
  }

  for (const templateKey of transition.tasks) {
    tasks.push(
      instantiateTask({
        template: templateKey,
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
      })
    );
  }

  if (rule.sponsorRequired) {
    tasks.push(
      instantiateTask({
        template: "SECURE_BD_SPONSOR",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
      })
    );
    blockers.push("Sponsor required");
  }

  if (rule.backgroundCheck?.fingerprints) {
    tasks.push(
      instantiateTask({
        template: "FINGERPRINTS",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
      })
    );
    tasks.push(
      instantiateTask({
        template: "COMPLETE_BACKGROUND_CHECK",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
      })
    );
  }

  if (rule.ce && (licenseTrack.ceHoursEarned ?? 0) < rule.ce.requiredHours) {
    const due = ensureDueDate(licenseTrack.expiration ?? undefined, 30);
    tasks.push(
      instantiateTask({
        template: "UPLOAD_CE_CERTS",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
        due,
        payload: { requiredHours: rule.ce.requiredHours },
      })
    );
    blockers.push("Continuing education incomplete");
  }

  if (rule.appointmentsResetOnReinstatement) {
    tasks.push(
      instantiateTask({
        template: "APPOINTMENTS_REAPPLY",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
      })
    );
    notes.push("Carrier appointments reset on reinstatement");
  }

  for (const form of rule.formSet) {
    const formTasks = mapFormToTasks(form);
    for (const template of formTasks) {
      tasks.push(
        instantiateTask({
          template,
          personId,
          stateCode: licenseTrack.stateCode,
          track: licenseTrack.track,
          licenseType: licenseTrack.licenseType,
        })
      );
    }
  }

  if (rule.docsNeeded.includes("Bond")) {
    notes.push("Bond documentation required");
  }

  if (
    typeof rule.requiresExamRetakeIfBeyondDays === "number" &&
    typeof daysSinceExpiration === "number" &&
    daysSinceExpiration > rule.requiresExamRetakeIfBeyondDays
  ) {
    tasks.push(
      instantiateTask({
        template: "SCHEDULE_INSURANCE_EXAM",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
      })
    );
    notes.push("Exam retake triggered by time elapsed");
  }

  if (
    typeof rule.requiresPrelicensingIfBeyondDays === "number" &&
    typeof daysSinceExpiration === "number" &&
    daysSinceExpiration > rule.requiresPrelicensingIfBeyondDays
  ) {
    tasks.push(
      instantiateTask({
        template: "PRELICENSING_COURSE",
        personId,
        stateCode: licenseTrack.stateCode,
        track: licenseTrack.track,
        licenseType: licenseTrack.licenseType,
      })
    );
    notes.push("Pre-licensing required before reinstatement");
  }

  const uniqueTasks = dedupeTasks(tasks);

  return {
    target: transition.to,
    tasks: uniqueTasks,
    blockers,
    fees: rule.fees ?? null,
    notes,
  };
}

function dedupeTasks(tasks: PlannedTask[]): PlannedTask[] {
  const seen = new Map<string, PlannedTask>();
  for (const task of tasks) {
    if (!seen.has(task.id)) {
      seen.set(task.id, task);
    }
  }
  return Array.from(seen.values());
}
