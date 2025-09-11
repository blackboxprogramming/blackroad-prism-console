# BlackRoad Static Site

This directory contains the static site served at **blackroad.io** via GitHub Pages.

## Contents

- `index.html` – Landing page with links to the AI chat and Composer Playground.
- `login.html` – Development login form accepting any non-empty credentials.
- `chat.html` – Placeholder for the Lucidia public-facing AI chat and terminal.
- `composer.html` – Placeholder for the Composer Playground.
- `status.html` – Manual system status page.
- `style.css` – Shared styling for all pages.
- `script.js` – Client-side login handler.
- `CNAME` – Configures the custom domain `blackroad.io` for GitHub Pages.

## Development

1. Clone the repository and ensure these files remain inside the `BlackRoad/` directory.
2. From this folder you can serve the site locally:

   ```bash
   cd BlackRoad
   python3 -m http.server 8000
   ```

   Then visit `http://localhost:8000` in your browser.

3. The `lucidia-agent.py` watcher automatically pushes changes in this directory to the `blackroad.io` repository. Ensure new files are added here so they are deployed.

## Deployment

The site is deployed on GitHub Pages. Pushing to the `blackroad.io` repository publishes the contents of this directory. The `CNAME` file tells GitHub Pages to serve the site at **blackroad.io**.

## Next Steps

- Replace the development login with real authentication.
- Implement the AI chat and terminal functionality.
- Build out the Composer Playground.
- Automate updates to the status page.

_Last updated on 2025-09-11_
