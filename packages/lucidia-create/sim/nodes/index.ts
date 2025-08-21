import { NodeHandler } from "../engine.js";
import { source } from "./source.js";
import { belt } from "./belt.js";
import { gearSplitter } from "./gearSplitter.js";
import { gearRatio } from "./gearRatio.js";
import { clutchGate } from "./clutchGate.js";
import { sequencer } from "./sequencer.js";
import { filterSorter } from "./filterSorter.js";
import { deployerRunner } from "./deployerRunner.js";
import { depot } from "./depot.js";
import { meter } from "./meter.js";

export const handlers: Record<string, NodeHandler> = {
  Source: source,
  Belt: belt,
  GearSplitter: gearSplitter,
  GearRatio: gearRatio,
  ClutchGate: clutchGate,
  Sequencer: sequencer,
  FilterSorter: filterSorter,
  DeployerRunner: deployerRunner,
  Depot: depot,
  Meter: meter
};
