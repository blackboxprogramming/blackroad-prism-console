export default function CurvatureLegend() {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-3 text-xs text-slate-300">
      <p className="font-semibold mb-2">Curvature legend</p>
      <div className="flex items-center gap-2">
        <span className="w-20">κ &lt; 0</span>
        <div className="h-2 flex-1 bg-gradient-to-r from-sky-500 via-slate-200 to-rose-500 rounded-full" />
        <span className="w-20 text-right">κ &gt; 0</span>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Edge flow shifts mass away from bottlenecks. Negative curvature (blue) highlights bridges, positive (rose) marks dense
        communities.
      </p>
    </div>
  );
}
