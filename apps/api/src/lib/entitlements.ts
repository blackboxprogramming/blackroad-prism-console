import fs from 'node:fs';

type Plan = { features?: string[]; base_quota?: Record<string, unknown> };
type Catalog = { plans: Record<string, Plan> };

const catalogUrl = new URL('../../../../pricing/catalog.json', import.meta.url);
let cachedCatalog: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (!cachedCatalog) {
    if (!fs.existsSync(catalogUrl)) {
      cachedCatalog = { plans: {} };
    } else {
      const raw = fs.readFileSync(catalogUrl, 'utf-8');
      cachedCatalog = JSON.parse(raw) as Catalog;
    }
  }
  return cachedCatalog;
}
export function featuresFor(plan='STARTER'): string[] {
  const cat = loadCatalog(); return cat.plans?.[plan]?.features || [];
}
export function hasFeature(plan:string, feature:string): boolean {
  const feats = featuresFor(plan);
  return feats.includes('all') || feats.includes(feature);
}
export function requireEntitlement(feature:string) {
  return (req:any, res:any, next:any) => {
    const plan = (req.apiKey?.plan) || 'STARTER';
    if (!hasFeature(plan, feature)) return res.status(402).json({ error:'payment_required', feature });
    next();
  };
}
