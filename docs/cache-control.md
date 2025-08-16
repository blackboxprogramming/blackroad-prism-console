# Cache-Control for Static Sites

- HTML: `Cache-Control: no-cache`
- Static assets (hashed): `Cache-Control: public, max-age=31536000, immutable`
- Images: `public, max-age=2592000`

On GitHub Pages, hashed assets produced by Vite are safe to cache long-term.
