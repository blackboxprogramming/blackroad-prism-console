import { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import clsx from "clsx";

type Trend = "up" | "down" | "flat" | undefined;

const trendIconMap: Record<Exclude<Trend, undefined>, ReactNode> = {
  up: <ArrowUpRight className="h-4 w-4" />,
  down: <ArrowDownRight className="h-4 w-4" />,
  flat: <ArrowRight className="h-4 w-4" />
};

const trendColorMap: Record<Exclude<Trend, undefined>, string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  flat: "text-slate-300"
};

interface MetricCardProps {
  label: string;
  value: string;
  trend?: Trend;
  change?: number;
  helperText?: string;
}

export function MetricCard({ label, value, trend, change, helperText }: MetricCardProps) {
  const TrendIcon = trend ? trendIconMap[trend] : null;
  const trendColor = trend ? trendColorMap[trend] : "text-slate-300";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/30">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-3xl font-semibold text-white">{value}</div>
        {TrendIcon && <span className={clsx("flex items-center gap-1 text-sm", trendColor)}>{TrendIcon}</span>}
      </div>
      {typeof change === "number" && (
        <div className={clsx("mt-1 text-sm", change >= 0 ? "text-emerald-400" : "text-rose-400")}>{`${change.toFixed(1)}%`}</div>
      )}
      {helperText && <p className="mt-3 text-sm text-slate-400">{helperText}</p>}
    </div>
  );
}
