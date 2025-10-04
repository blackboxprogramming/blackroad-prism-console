import { findRulebook } from "./rulebook.js";
import { evaluateRulebook } from "./rules.js";
import { Person, LicenseTrack, GateResult, Rulebook } from "./types.js";

interface GateContext {
  person: Person;
  licenseTracks: LicenseTrack[];
  rulebooks: Rulebook[];
  now?: Date;
}

function findTrack(tracks: LicenseTrack[], predicate: (track: LicenseTrack) => boolean): LicenseTrack | undefined {
  return tracks.find(predicate);
}

export function canAdviseIn(state: string, context: GateContext): GateResult {
  const track = findTrack(
    context.licenseTracks,
    (candidate) => candidate.stateCode === state && candidate.track === "securities" && /IAR/i.test(candidate.licenseType)
  );

  if (!track) {
    return { allowed: false, reason: "No IAR track found" };
  }

  if (track.status !== "Active") {
    const rulebook = findRulebook(context.rulebooks, state, track.track, track.licenseType);
    if (rulebook) {
      const evaluation = evaluateRulebook({
        personId: context.person.id,
        licenseTrack: track,
        rulebook,
        now: context.now,
      });
      return {
        allowed: false,
        reason: `Inactive license. Next step: ${evaluation.tasks.map((task) => task.title).join(", ")}`,
      };
    }
    return { allowed: false, reason: `License status ${track.status}` };
  }

  return { allowed: true };
}

export function canSellInsuranceIn(state: string, line: string, context: GateContext): GateResult {
  const track = findTrack(
    context.licenseTracks,
    (candidate) =>
      candidate.stateCode === state &&
      candidate.track === "insurance" &&
      candidate.licenseType.toLowerCase().includes(line.toLowerCase())
  );

  if (!track) {
    return { allowed: false, reason: `No insurance license for ${line}` };
  }

  if (track.status !== "Active") {
    const rulebook = findRulebook(context.rulebooks, state, track.track, track.licenseType);
    const reason = rulebook ? "Reinstatement required" : `Status ${track.status}`;
    return { allowed: false, reason };
  }

  return { allowed: true };
}

export function canTradeBDIn(state: string, context: GateContext): GateResult {
  const track = findTrack(
    context.licenseTracks,
    (candidate) => candidate.stateCode === state && candidate.track === "securities" && /BD/i.test(candidate.licenseType)
  );

  if (!track) {
    return { allowed: false, reason: "No broker-dealer registration" };
  }

  const hasSponsor = Boolean(track.metadata && track.metadata["hasSponsor"]);

  if (!hasSponsor) {
    return { allowed: false, reason: "Broker-dealer sponsor not on file" };
  }

  if (track.status !== "Active") {
    return { allowed: false, reason: `Status ${track.status}` };
  }

  return { allowed: true };
}
