<!-- FILE: /var/www/blackroad/README.md -->

# BlackRoad Single Page Application

This directory hosts the static assets for the BlackRoad front end. NGINX
serves `index.html` for all unknown paths so that client-side routing can
handle navigation.

## Development

- Format files with `npm run format:site` from the repository root.
- Keep additional HTML files for standalone pages as needed.

## Caching

- `index.html` should be served with short cache headers so clients receive
  updates quickly.
- Static assets (images, scripts) may be cached aggressively once referenced.

## Removed Assets


_Last updated on 2025-09-11_
The legacy `assets/brand` directory was moved to `/_trash/var/www/blackroad/assets`
because it is not used by the current SPA.
