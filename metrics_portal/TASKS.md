# Metrics Portal Task List

This document tracks development and infrastructure tasks for the Lucidia/BlackRoad metrics portal. Agents should consult this list when continuing work. If the list drops below thirty items, add new tasks to maintain at least thirty. Feel free to append ideas at the end.

## Current Tasks

1. **Refactor Core API** – Modularize the Node `server_full.js` into separate routers for auth, projects, chat, and health. Introduce middleware for request validation and rate limiting.
2. **Implement Persistent Storage** – Replace the in-memory maps with a PostgreSQL schema (`Users`, `Projects`, `Conversations`). Add an ORM layer and migrations.
3. **Add Redis-Based Memory Store** – Abstract the context-memory system into a Redis-backed cache to persist conversation context across server restarts.
4. **Dockerize Services** – Create Dockerfiles and a docker-compose configuration to run the API, bridge, and mini service with proper isolation and environment variables.
5. **CI/CD Pipeline** – Set up GitHub Actions that lint, test, and build Docker images on every PR; integrate with deployment targets.
6. **Write Unit Tests** – Cover API endpoints with Jest or Mocha + Chai, mocking external calls. Aim for 80% coverage.
7. **Integration Tests** – Build Cypress or Playwright tests that spin up the stack locally and test login, project creation, chat-to-code flows, and deployment.
8. **Implement WebSocket Auth** – Secure Socket.IO connections using JWT tokens. Reject unauthenticated connections and force re-authentication on expiry.
9. **Enforce Rate Limiting** – Use `express-rate-limit` to prevent abuse of generate endpoints and large code generation loops.
10. **Enhance LLM Bridge** – Swap the stub with a real AI provider (OpenAI/Anthropic) using environment variables. Add fallback and caching logic.
11. **Security Hardening** – Add input sanitization for prompts, escape user data in generated HTML, and enforce CSP headers in Nginx.
12. **Add Session Management** – Move away from cookie-only auth and implement secure refresh tokens. Rotate JWT secrets via environment variables.
13. **File System Watcher** – Build a service that syncs changes to `/srv/blackroad-workspace` with the browser preview without manual reload.
14. **Nginx Rewrite Rules** – Consolidate the `/api/mini` proxy logic and add robust error pages. Remove conflicting rules that cause 502s.
15. **Deploy Subdomain Generator** – Write a deployment engine that takes a project ID and configures Nginx to serve `project-id.blackroad.io` with SSL.
16. **Add Billing Service** – Integrate Stripe for subscription tiers (Free, Creator, Team). Implement webhooks and a simple UI for upgrading/downgrading.
17. **Project Template Library** – Build a repository of starter templates (landing page, blog, portfolio) with UI selection.
18. **Analytics Dashboard** – Track usage metrics, failed API calls, and time to first deploy. Use Grafana or a custom UI.
19. **Team Collaboration** – Extend the data model to support multiple users per project. Add role-based permissions and real-time cursor presence.
20. **In-App Onboarding** – Build a guided walkthrough for new users: creating a project, sending the first prompt, and deploying the result.
21. **Internationalization** – Localize UI strings and allow prompts in multiple languages, passing locale to the LLM.
22. **Accessibility Audit** – Run WCAG AA compliance checks, adding ARIA labels and contrast adjustments across pages.
23. **Implement Logging Middleware** – Produce structured JSON logs for API requests/responses with log rotation.
24. **Secret Management** – Switch from hard-coded secrets to a secret manager (e.g., HashiCorp Vault or AWS Secrets Manager).
25. **Monitoring & Alerts** – Install Prometheus Node Exporter and configure Grafana dashboards with alerts for CPU, memory, and error rates.
26. **Optimize Build Pipeline** – Split vendor bundles, enable HTTP/2 push, compress assets with Brotli, and set long cache headers for static assets.
27. **Offline Mode** – Add service workers to allow editing projects offline and sync back changes when connectivity returns.
28. **User Settings Page** – Let users change email, password, and notification preferences; provide a delete-account option.
29. **Automated Backups** – Schedule daily backups of project files and database snapshots stored in encrypted S3 buckets.
30. **Product Documentation Site** – Generate a static docs site (with JSDoc or Docusaurus) explaining the API, deployment details, and usage guides.
31. **Automate Task Sync** – Create a script or service that exposes tasks from this file through the metrics portal so agents always see the latest list.

