import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canAdviseIn, canSellInsuranceIn, canTradeBDIn } from "@blackroad/core";
import { loadSeedRulebooks } from "@blackroad/db";
import { loadLicenseTracks, loadPerson } from "../storage.js";

interface GateOptions {
  action: string;
  state: string;
  line?: string;
}

export function gateCommand(options: GateOptions): void {
  const person = loadPerson();
  if (!person) {
    throw new Error("Person not initialized");
  }
  const licenseTracks = loadLicenseTracks();
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dbDir = resolve(__dirname, "..", "..", "..", "packages", "db");
  const rulebooks = loadSeedRulebooks(dbDir);

  const state = options.state.toUpperCase();
  const context = { person, licenseTracks, rulebooks };

  let result;
  switch (options.action) {
    case "advise":
      result = canAdviseIn(state, context);
      break;
    case "sell-insurance":
      if (!options.line) {
        throw new Error("--line is required for sell-insurance action");
      }
      result = canSellInsuranceIn(state, options.line, context);
      break;
    case "trade-bd":
      result = canTradeBDIn(state, context);
      break;
    default:
      throw new Error(`Unsupported action: ${options.action}`);
  }

  if (result.allowed) {
    // eslint-disable-next-line no-console
    console.log(`Allowed: ${options.action} in ${state}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Blocked: ${result.reason ?? "Unknown reason"}`);
  }
}
