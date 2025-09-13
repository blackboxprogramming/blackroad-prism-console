export type HealthInput = { usage30d:number; incidents30d:number; csat:number; arAgingDays:number; };
export function score(h: HealthInput){
  const usage = Math.min(1, h.usage30d/100);           // normalize
  const incidents = Math.max(0, 1 - h.incidents30d/5); // fewer incidents → higher
  const csat = Math.min(1, h.csat/5);                  // 1..5 → 0..1
  const ar = Math.max(0, 1 - h.arAgingDays/60);        // younger AR better
  const s = 0.4*usage + 0.25*csat + 0.2*incidents + 0.15*ar;
  return Math.round(s*100);
}
