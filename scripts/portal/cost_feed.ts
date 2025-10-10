import fs from "fs";
import path from "path";

type CostRecord = {
  Keys?: string[];
  Metrics?: Record<string, { Amount?: string; Unit?: string }>;
  system?: string;
  actual?: number;
  forecast?: number;
  value?: number;
};

type ForecastRecord = {
  MeanValue?: string;
  PredictionIntervalLowerBound?: string;
  PredictionIntervalUpperBound?: string;
};

const SOURCE = process.env.COST_FEED_SOURCE ?? "portal/logs/cost_explorer.json";
const FORECAST_SOURCE = process.env.COST_FORECAST_SOURCE ?? "portal/logs/cost_explorer_forecast.json";
const OUTPUT = process.env.COST_FEED_OUTPUT ?? "portal/reports/cost_feed.json";

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

function normalizeKey(raw: string | undefined) {
  if (!raw) return "unknown";
  const parts = raw.split("$");
  return parts[parts.length - 1].toLowerCase();
}

function accumulate(records: CostRecord[] | undefined | null) {
  const map = new Map<string, number>();
  if (!records) return map;
  for (const record of records) {
    if (record.system) {
      map.set(record.system, (map.get(record.system) ?? 0) + Number(record.actual ?? record.value ?? 0));
      continue;
    }
    const key = normalizeKey(record.Keys?.[0]);
    const amount = Number(record.Metrics?.AmortizedCost?.Amount ?? record.Metrics?.UnblendedCost?.Amount ?? record.value ?? 0);
    map.set(key, (map.get(key) ?? 0) + amount);
  }
  return map;
}

function accumulateForecast(records: ForecastRecord[] | undefined | null) {
  const map = new Map<string, number>();
  if (!records) return map;
  for (const record of records) {
    const value = Number(record.MeanValue ?? 0);
    if (Number.isFinite(value)) {
      map.set("forecast", (map.get("forecast") ?? 0) + value);
    }
  }
  return map;
}

function main() {
  const actualSource = readJson(SOURCE);
  const forecastSource = readJson(FORECAST_SOURCE);

  const actualGroups: CostRecord[] | undefined = actualSource?.ResultsByTime?.flatMap((entry: any) => entry.Groups) ?? actualSource?.groups;
  const forecastGroups: ForecastRecord[] | undefined = forecastSource?.ForecastResultsByTime ?? forecastSource?.forecast;

  const actualMap = accumulate(actualGroups ?? actualSource);
  const forecastMap = new Map<string, number>();

  if (Array.isArray(actualSource)) {
    for (const entry of actualSource as CostRecord[]) {
      if (entry.system) {
        forecastMap.set(entry.system, Number(entry.forecast ?? 0));
      }
    }
  }

  if (!forecastMap.size) {
    const forecastTotal = accumulateForecast(forecastGroups);
    const totalActual = Array.from(actualMap.values()).reduce((acc, value) => acc + value, 0);
    if (forecastTotal.size && totalActual > 0) {
      const totalForecast = forecastTotal.get("forecast") ?? 0;
      const ratio = totalForecast / totalActual;
      for (const [key, value] of actualMap.entries()) {
        forecastMap.set(key, value * ratio);
      }
    }
  }

  const result: Record<string, { actual: number; forecast: number }> = {};
  for (const [key, value] of actualMap.entries()) {
    const forecast = forecastMap.get(key) ?? 0;
    result[key] = {
      actual: Number(value.toFixed(2)),
      forecast: Number(forecast.toFixed(2)),
    };
  }

  ensureDir(OUTPUT);
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`cost feed written to ${OUTPUT}`);
}

if (require.main === module) {
  main();
}
