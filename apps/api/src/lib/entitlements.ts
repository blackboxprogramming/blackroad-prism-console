import fs from 'fs';
type Plan = { features?: string[]; base_quota?: any };
type Catalog = { plans: Record<string, Plan> };
let catalog: Catalog = { plans: {} };
export function loadCatalog(): Catalog {
  if (fs.existsSync('pricing/catalog.yaml')) {
    const yaml = require('yaml');
    catalog = yaml.parse(fs.readFileSync('pricing/catalog.yaml','utf-8'));
  }
  return catalog;
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
