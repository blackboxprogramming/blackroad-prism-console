# BlackRoad Website Redevelopment Plan

## 1. Executive Overview
- **Goals**: Build a production‑grade, accessible, secure, and SEO‑strong website for BlackRoad, Inc.
- **Audiences**: Enterprise buyers, developers, partners, candidates.
- **Key Journeys**: Learn what BlackRoad does, evaluate solutions, contact sales, read insights.
- **Constraints**: WCAG 2.2 AA, US privacy laws (CCPA/CPRA), Core Web Vitals budgets, strict security headers.
- **Tagline**: [NEEDS VERIFICATION] – research: 1) GET / for existing tagline 2) review marketing brief 3) confirm with stakeholders.

## 2. Information Architecture
```json
{
  "sitemap": [
    "/", "/solutions", "/pricing", "/blog", "/blog/<slug>", "/case-studies", "/case-studies/<slug>", "/about", "/careers", "/press", "/contact", "/legal/privacy", "/legal/terms", "/legal/cookies", "/legal/accessibility", "/terminal"
  ],
  "navigation": {
    "primary": [
      {"label": "Home", "href": "/"},
      {"label": "Solutions", "href": "/solutions"},
      {"label": "Pricing", "href": "/pricing"},
      {"label": "Insights", "href": "/blog"},
      {"label": "Company", "href": "/about"},
      {"label": "Careers", "href": "/careers"},
      {"label": "Contact", "href": "/contact"}
    ],
    "footer": {
      "company": [{"label": "About", "href": "/about"}, {"label": "Press", "href": "/press"}],
      "resources": [{"label": "Blog", "href": "/blog"}, {"label": "Guides", "href": "/guides"}],
      "legal": [
        {"label": "Privacy", "href": "/legal/privacy"},
        {"label": "Terms", "href": "/legal/terms"},
        {"label": "Cookies", "href": "/legal/cookies"},
        {"label": "Accessibility", "href": "/legal/accessibility"}
      ]
    }
  }
}
```

## 3. Design System
### Tokens (Style Dictionary)
```json
{
  "color": {
    "brand": {
      "primary": {"value": "[NEEDS VERIFICATION]"},
      "secondary": {"value": "[NEEDS VERIFICATION]"},
      "accent": {"value": "[NEEDS VERIFICATION]"}
    },
    "background": {"base": {"value": "#ffffff"}, "alt": {"value": "#0B0B0C"}},
    "text": {"primary": {"value": "#0B0B0C"}, "muted": {"value": "#6B7280"}}
  },
  "font": {
    "family": {"sans": {"value": "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"}},
    "size": {"xs":{"value":"12px"},"sm":{"value":"14px"},"md":{"value":"16px"},"lg":{"value":"18px"},"xl":{"value":"20px"}},
    "lineHeight": {"tight":{"value":1.2},"normal":{"value":1.5},"relaxed":{"value":1.7}}
  },
  "space": {"xs":{"value":"4px"},"sm":{"value":"8px"},"md":{"value":"16px"},"lg":{"value":"24px"},"xl":{"value":"40px"}}
}
```
### Components
Header/Nav, Hero, Feature Grid, Pricing Table, CTA Band, Forms, Blog Card, Post Page, Author Bio, FAQ, Badge, Table, Toast, Modal.
### A11y Acceptance Criteria
- Keyboard navigable, visible focus states, ARIA roles, color contrast ≥4.5:1, target size ≥24×24px.

## 4. Page Blueprints
For each page type, outline structure, content blocks, SEO meta, JSON‑LD.
Example: **Home**
1. Header/Nav
2. Hero (H1, copy, primary & secondary CTA)
3. Social proof
4. Feature grid
5. Solution sections
6. Metrics
7. CTA band
8. Latest Insights
9. Footer
SEO meta: `{ "title": "Home | BlackRoad", "description": "<160c>", "canonical": "https://blackroadinc.us/" }`
JSON‑LD: Organization + WebSite.

## 5. Technical SEO Pack
- robots.txt
```
User-agent: *
Allow: /
Sitemap: https://blackroadinc.us/sitemap.xml
```
- sitemap.xml skeleton (programmatic generation).
- Canonical tags: `https://blackroadinc.us<PATH>`.
- Meta templates for Open Graph & Twitter cards.

## 6. Accessibility Pack (WCAG 2.2 AA)
- Requirements: skip links, focus management, ARIA patterns, color contrast, keyboard flows.
- Test Plan: axe scans, manual keyboard testing, screen reader smoke tests.
- Color Contrast Checks: verify all brand colors meet 4.5:1.

## 7. Security Pack
- Headers: HSTS (`max-age=63072000; includeSubDomains; preload`), CSP (no unsafe-inline), Referrer-Policy `strict-origin-when-cross-origin`, Permissions-Policy minimal, X-Content-Type-Options `nosniff`.
- Session/Form Hardening: CSRF tokens, rate limiting, validation, no local storage for secrets.

## 8. Performance Pack
- Core Web Vitals targets: LCP ≤2.5s, INP <200ms, CLS <0.1.
- JS budget: ≤150KB gzip initial route.
- Image policy: AVIF/WebP, responsive, priority hero preload.
- Checklist: lazy-load below fold, preconnect critical origins, font `display: swap`.

## 9. Privacy & Legal Pack
- Pages: Privacy, Terms, Cookies, Accessibility — all include disclaimer "not legal advice".
- CCPA/CPRA links in footer; CMP for EU users if expanded.
- Data Subject Request endpoint plan.

##10. Code Scaffolding
Minimal Next.js skeleton (`sites/blackroad-next`):
- `app/layout.tsx`, `app/page.tsx`, `app/robots.ts`, `app/sitemap.ts`, `middleware.ts`, `next.config.mjs`, `package.json`, `tsconfig.json`, `lib/seo.ts`.
- TypeScript strict, ESLint, Prettier, Playwright placeholder.

##11. CI/CD Plan
- GitHub Actions `ci.yml`: install, lint, test, build; preview deploy (Vercel placeholder); production on tag.
- Secrets: `NEXT_PUBLIC_SITE_URL`, analytics IDs, SENTRY_DSN, RECAPTCHA keys.

##12. Monitoring & QA
- Lighthouse & Playwright scripts, weekly cron.
- Uptime probe `/healthz` and homepage.
- Sentry for errors; console warnings converted to issues.

##13. Risk Register
| # | Risk | Impact | Likelihood | Mitigation | Owner |
|---|------|--------|------------|------------|-------|
|1|Missing a11y criteria|High|Med|A11y tests + manual checks|Eng Lead|
|2|Weak CSP allows inline scripts|High|Med|Tight CSP + nonce|Sec Eng|
|3|INP >200ms on mobile|High|Med|JS budget; code split|Perf Eng|
|4|No consent gating in EU|High|Low|CMP + geo logic|PM/Legal|
|5|404s after deploy|Med|Med|Link check + monitor|SRE|
|6|Oversharing referrers|Med|Low|strict-origin-when-cross-origin|Sec Eng|
|7|Large hero images|Med|Med|Next/Image policy|FE Lead|
|8|Robots misconfig|Med|Low|Validate robots/sitemap in CI|SEO Lead|
|9|LLM terminal without guardrails|High|Low|ToS; rate limit; logging|Platform|
|10|PII in logs|High|Low|Redaction middleware|SRE|

##14. Definition of Done
- All page types implemented with meta + JSON‑LD.
- A11y smoke + axe pass; keyboard-only demo recorded.
- CWV budgets met or documented.
- Security headers validated; TLS and no mixed content.
- Privacy pages present; cookie banner behavior documented.
- robots.txt & sitemap.xml valid; staging noindex.
- Uptime & error monitoring live; alerting tested.

## Run Block
```yaml
project:
  site_url: "https://blackroadinc.us"
  company_name: "BlackRoad, Inc."
  tagline: "[NEEDS VERIFICATION]"
  brand_palette:
    primary: "[NEEDS VERIFICATION]"
    secondary: "[NEEDS VERIFICATION]"
  voice_and_tone: "Plain, confident, technical-executive; no hype"
  audiences: ["Enterprise buyers", "Developers", "Partners", "Candidates"]
  key_journeys: ["Learn what BlackRoad does", "Evaluate solutions", "Contact sales", "Read insights"]
  include_llm_terminal_page: true
  jurisdictions: ["US"]
  cms: "Filesystem (MDX)"
  framework: "Next.js (App Router, TS)"
  hosting: "Vercel"
  analytics: "GA4"
  observability: "Sentry"
  forms_provider: "Formspree"
  email_sending: "Postmark"
  blog_enabled: true
  careers_enabled: true
  seo_targets: ["Core Web Vitals", "Topical authority for <keywords>"]
  social_links: ["<LinkedIn>", "<X>", "<GitHub>"]
constraints_and_prefs:
  core_web_vitals:
    lcp_ms: 2500
    inp_ms: 200
    cls: 0.1
  js_budget_kb: 150
  images_policy: "AVIF/WEBP, responsive, priority hero preload"
  security:
    hsts_preload: true
    csp_strict: true
    referrer_policy: "strict-origin-when-cross-origin"
    permissions_policy_minimal: true
  accessibility: "WCAG 2.2 AA"
  privacy:
    ccpa_cpra: true
    gdpr: false
  tone: "executive-friendly, concrete, jargon-lite"
deliverables:
  include_code_scaffolding: true
  include_json_schemas: true
  include_checklists: true
  include_tables: true
  include_citations: "name the authority or mark [NEEDS VERIFICATION]"
  depth: "enterprise-ready but novice-accessible"
notes:
  - robots.txt, sitemap.xml, and site colors [NEEDS VERIFICATION]; fetch plan: GET /robots.txt, GET /sitemap.xml, crawl /, parse CSS for tokens.
```
