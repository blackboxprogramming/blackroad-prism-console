# BlackRoad Website Plan

This document summarizes the architecture, design, and operational plan for building the public
website at [https://blackroadinc.us](https://blackroadinc.us).

## 1. Executive Overview
BlackRoad, Inc. requires a production-grade Next.js (App Router, TypeScript) site. Target audiences
include enterprise buyers, developers, partners, and candidates. Key journeys include discovering
BlackRoad's offerings, evaluating solutions and pricing, contacting sales, and reading insights.
Constraints include WCAG 2.2 AA accessibility, Core Web Vitals budgets (LCP ≤ 2.5s, INP < 200ms,
CLS < 0.1), strict security headers (HSTS, CSP, Referrer-Policy), and US privacy compliance (CCPA/
CPRA). Availability of an optional "Lucidia Terminal" feature remains **[NEEDS VERIFICATION]**.

## 2. Information Architecture
- Routes: `/`, `/solutions`, `/pricing`, `/blog`, `/blog/<slug>`, `/case-studies`,
  `/case-studies/<slug>`, `/about`, `/careers`, `/press`, `/contact`,
  `/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/accessibility`,
  `/terminal` (optional, needs verification).
- Navigation model follows primary and footer JSON structures outlined in project brief.

## 3. Design System
- Design tokens use Style Dictionary format with brand colors **[NEEDS VERIFICATION]** and a base
  typography/spacing scale.
- Component library: Header/Nav, Hero, Feature Grid, Pricing Table, CTA, Form, Footer, Blog Card,
  Post Page, Author card, FAQ accordion, Badge, Table, Toast, Modal.
- Accessibility criteria: keyboard navigation, visible focus, color contrast ≥ 4.5:1, ARIA where
  needed, target size ≥ 24×24 px, skip link, reduced-motion respect.

## 4. Page Blueprints
Each page uses a consistent structure: header/nav, hero with H1 and CTAs, content blocks, footer.
The Home page includes social proof, value props, solution sections, metrics, CTA band, and latest
insights. All pages employ a standard SEO meta template and JSON-LD (Organization, WebSite,
BreadcrumbList, Article for posts, FAQPage for FAQ sections).

## 5. Technical SEO Pack
- `robots.txt` allows all and points to `/sitemap.xml`.
- `sitemap.xml` generated from routes and CMS content.
- Canonical tags use absolute URLs. Open Graph and Twitter meta tags implemented per page.
- Preview/staging environments use `noindex` to avoid search indexing.

## 6. Accessibility Pack (WCAG 2.2 AA)
- Requirements: semantic landmarks, one H1 per page, labeled forms, skip links, focus traps handled
  in modals, consistent heading order, adjustable timeouts, captions/transcripts for media.
- Test plan: axe-core automated scans, keyboard-only walkthroughs, screen reader spot-checks,
  color contrast tests, Playwright with `@axe-core/playwright`.

## 7. Security Pack
- Headers: `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Content-Type-Options`.
- Session/form hardening: CSRF tokens, SameSite=Lax cookies, server-side validation, rate limits,
  CAPTCHA optional. CORS default deny. Dependency scanning via CI.

## 8. Performance Pack
- Core Web Vitals budgets: LCP ≤ 2.5s, INP < 200ms, CLS < 0.1.
- JS budget ≤ 150KB gzip; code splitting and tree shaking. Image policy: AVIF/WEBP, responsive
  `next/image`, hero ≤ 180KB, lazy loading, preload hero.
- Preconnect to fonts/analytics, ISR/SSG for content, cache headers for static assets, Lighthouse CI
  and size-limit for monitoring.

## 9. Privacy & Legal Pack
- Pages: `/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/accessibility`, each with
  disclaimer "This is general information, not legal advice."
- CCPA/CPRA compliance: "Do Not Sell or Share" link and data request workflow.
- Cookie banner/CMP for analytics; data map and retention policy for form submissions.

## 10. Code Scaffolding
- Repository structure includes `app/` (Next.js pages), `components/`, `lib/seo.ts`,
  `middleware.ts` for security headers, dynamic `robots.ts` and `sitemap.ts`.
- Environment variables: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ANALYTICS_ID`, optional `SENTRY_DSN`,
  `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET`, `LLM_ENDPOINT` **[NEEDS VERIFICATION]**.

## 11. CI/CD Plan
- GitHub Actions run on push: install, lint, test, build, size-limit, Lighthouse CI on preview URLs.
- Deploy previews on Vercel; production deploy on tagged releases. Weekly Lighthouse CI job and
  Sentry release integration.

## 12. Monitoring & QA
- Lighthouse audits, Playwright scripts for navigation/forms, uptime probes to `/` and `/healthz`,
  Sentry error tracking, analytics (GA4 or PostHog) consent-gated, axe-core scans in CI.

## 13. Risk Register
| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|-----------|
|1|Missing WCAG 2.2 AA criteria|High|Med|Automated + manual a11y tests|
|2|Weak CSP allows inline scripts|High|Med|Nonce/strict CSP|
|3|INP >200ms on mobile|High|Med|JS budget, code splitting|
|4|No consent gating for analytics|High|Low|CMP, conditional scripts|
|5|503 outages on main site|High|Med|Health checks, auto-scaling|
|6|Robots/sitemap misconfig|Med|Low|CI validation|
|7|Hero images too heavy|Med|Med|Image policy, Next/Image|
|8|PII in logs|High|Low|Redaction middleware|
|9|Rate-limited LLM endpoint not enforced|High|Low|Rate limiting, auth|
|10|Unpatched dependencies|Med|Med|Dependabot + weekly audits|

## 14. Definition of Done
- Pages implemented with meta + JSON-LD validated.
- Accessibility tests pass; keyboard walkthrough recorded; color contrast verified.
- Lighthouse: ≥95 desktop, ≥85 mobile; performance budgets met or exceptions documented.
- Security headers present; TLS valid; no mixed content.
- Privacy pages live; cookie banner behavior documented; robot/sitemap valid.
- CI/CD passing; monitoring and alerting configured; legal sign-off obtained.

## Notes
- Tagline, brand palette, social handles, and LLM terminal availability remain **[NEEDS VERIFICATION]**.
- Live site returned 503 during initial checks; infrastructure stability must be confirmed.
