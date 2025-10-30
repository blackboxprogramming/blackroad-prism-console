import { ScenarioContext, ScenarioDetector, SurveillanceAlert } from "../types.js";
import { detectWashTrades } from "./washTrade.js";
import { detectFrontRunning } from "./frontRun.js";
import { detectMixerProximity } from "./mixerProximity.js";

const defaultDetectors: ScenarioDetector[] = [
  { name: "WASH_TRADE", detect: detectWashTrades },
  { name: "FRONT_RUN", detect: detectFrontRunning },
  { name: "MIXER_PROXIMITY", detect: detectMixerProximity },
];

export class ScenarioEngine {
  constructor(private readonly detectors: ScenarioDetector[] = defaultDetectors) {}

  async run(context: ScenarioContext): Promise<SurveillanceAlert[]> {
    const alerts: SurveillanceAlert[] = [];
    for (const detector of this.detectors) {
      const output = await detector.detect(context);
      for (const alert of output) {
        if (!alerts.find((existing) => existing.scenario === alert.scenario && existing.key === alert.key)) {
          alerts.push(alert);
        }
      }
    }
    return alerts;
  }
}

export { detectWashTrades, detectFrontRunning, detectMixerProximity };
