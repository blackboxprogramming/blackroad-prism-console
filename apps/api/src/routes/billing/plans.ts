import { Router } from 'express';
import fs from 'node:fs';

const catalogUrl = new URL('../../../../../pricing/catalog.json', import.meta.url);
let cachedCatalog: Record<string, unknown> | null = null;

function loadCatalog() {
  if (process.env.NODE_ENV !== 'production') {
    const raw = fs.readFileSync(catalogUrl, 'utf-8');
    return JSON.parse(raw);
  }

  if (!cachedCatalog) {
    const raw = fs.readFileSync(catalogUrl, 'utf-8');
    cachedCatalog = JSON.parse(raw);
  }

  return cachedCatalog;
}

const router = Router();

router.get('/', (_req, res) => {
  res.json(loadCatalog());
});

export default router;
