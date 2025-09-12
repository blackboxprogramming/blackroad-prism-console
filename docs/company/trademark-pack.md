# BlackRoad Trademark Pack

1) Executive brand anchors (what BlackRoad stands for → class coverage)
 - Compliance‑grade operations (trust first): automation, audit‑ready records, immutable trails → Class 42 (SaaS/PaaS) + Class 9 (downloadables/SDKs).
 - AI‑driven productivity (explainable, enterprise): LLM‑assisted docs, search/summarize, developer SDKs → Class 42 + Class 9.
 - Financial clarity for operators: dashboards and reporting that surface investor‑grade insights (as a service) → Class 36 (only to the extent you actually provide financial information/analysis as a service; software aspects remain in Class 42).

Legal note: The wording below is crafted to be ID‑Manual‑style and conservative. If you actually provide investment advice/brokerage/custody, stop and align with counsel before claiming Class 36 advisory language.

2) Final USPTO G/S IDs (copy‑paste; ≤1,000 chars each)

Class 9 – Electrical & Scientific (downloadable software)

Final ID string (≈443 chars):
“Downloadable computer software for workflow automation and document management; Downloadable mobile applications for team communication and project coordination; Downloadable software for natural language processing, text generation, and summarization; Downloadable software development kits (SDKs) for building AI‑enabled business applications; Downloadable application programming interface (API) software for integrating enterprise systems.”

Class 42 – Scientific & Technology services (SaaS/PaaS/IT)

Final ID string (≈610 chars):
“Software as a service (SaaS) featuring software for workflow automation, document routing, and compliance recordkeeping; Platform as a service (PaaS) featuring computer software platforms for building and deploying AI applications; Providing temporary use of online non‑downloadable software for financial analytics and reporting; Computer software development in the field of enterprise software and artificial intelligence; Technology consulting in the field of enterprise software and artificial intelligence; Cloud computing featuring software for knowledge management, search, and document classification.”

Class 36 – Financial services (information/analysis as a service)

Final ID string (≈253 chars):
“Providing financial information and financial analysis to business customers; Providing financial information via a website in the field of enterprise performance metrics; Financial data aggregation services; Financial research and information services.”

3) Specimen plan (what to show for each class)

Class 9 (downloadable):
 - Product download page showing the BLACKROAD mark adjacent to a Download/Install button.
 - App store listing (iOS/Android/desktop) with the mark and app functions.
 - In‑app splash screen or About dialog showing the mark (versioned).

Class 42 (SaaS/PaaS):
 - Live SaaS dashboard or pricing/service page with the mark and “non‑downloadable” service language.
 - SOW/Proposal bearing the mark that offers access to the hosted software.
 - Avoid “download” phrasing in 42 specimens.

Class 36 (financial information/analysis):
 - Service landing page explicitly offering financial information/analysis to business customers under the mark (not just software features).
 - Portal screenshots labeled as services (e.g., “Financial analysis and reporting provided by BlackRoad”).
 - Optional: Engagement letter or statement of work for financial information services with the mark.

One‑liner on each page: “BlackRoad and the BlackRoad logo are trademarks of BlackRoad, Inc.”
Legal: “This is general information, not legal advice; consult qualified counsel.”

4) Filled RUN BLOCK (drop‑in)

```yaml
project:
  company_name: "BlackRoad, Inc."
  mark: "BLACKROAD"
  variants: ["BLACKROAD", "BlackRoad", "BlackRoad Inc."]
  jurisdiction: "US"
  filing_basis: "1(b) intent-to-use"         # change to 1(a) if you already have use-in-commerce specimens
  target_classes: [9, 42, 36]
  madrid_targets: []                          # add later if you want Madrid

brand_pillars:
  - { pillar: "Compliance-Grade Ops", promise: "trust-first automations", classes: [42,9] }
  - { pillar: "AI-Driven Productivity", promise: "explainable enterprise AI", classes: [42,9] }
  - { pillar: "Financial Clarity", promise: "investor-grade insights as a service", classes: [36,42] }

products_features:
  downloadable: ["Desktop CLI", "VSCode extension", "Mobile app"]
  saas: ["Document routing", "Audit-ready records", "LLM Q&A terminal"]
  finance_services: ["Financial information and analysis portal"]   # supports Class 36
  comms: []                                                         # add if launching real-time comms later
  education: []                                                     # add if launching courses/publications

id_pack_preferences:
  wording_style: "US-preferred (ID-Manual)"
  keep_under_1000_chars_per_class: true
  avoid_free_form_surcharge: true

final_id_strings:
  class_9: "Downloadable computer software for workflow automation and document management; Downloadable mobile applications for team communication and project coordination; Downloadable software for natural language processing, text generation, and summarization; Downloadable software development kits (SDKs) for building AI-enabled business applications; Downloadable application programming interface (API) software for integrating enterprise systems."
  class_42: "Software as a service (SaaS) featuring software for workflow automation, document routing, and compliance recordkeeping; Platform as a service (PaaS) featuring computer software platforms for building and deploying AI applications; Providing temporary use of online non-downloadable software for financial analytics and reporting; Computer software development in the field of enterprise software and artificial intelligence; Technology consulting in the field of enterprise software and artificial intelligence; Cloud computing featuring software for knowledge management, search, and document classification."
  class_36: "Providing financial information and financial analysis to business customers; Providing financial information via a website in the field of enterprise performance metrics; Financial data aggregation services; Financial research and information services."

specimens_plan:
  class_9: ["Download page with mark", "App store listing", "In-app splash screen"]
  class_42: ["SaaS dashboard/pricing page", "SOW/proposal showing hosted access"]
  class_36: ["Service landing page for financial information/analysis", "Portal screenshots labeled as services"]

risk_tolerance: "conservative"
counsel_review_required_for_class_36: true
notes: |
  Keep Class 36 to financial information/analysis services unless licensed for advisory/brokerage activities.
  Ensure Class 42 specimens clearly describe non-downloadable hosted software.
  Use pick-list style IDs to avoid free-form surcharges.
```

5) Filing quick‑start (U.S.)
 - Application: TEAS Standard, one application with 3 classes (9/42/36).
 - Basis: Start with 1(b) ITU if you’re not yet using the mark in commerce for each class; convert to 1(a) per class when specimens are ready.
 - Owner: “BlackRoad, Inc.”; list the correct address and contact; keep consistent across classes.
 - Docketing: Calendar the Statement of Use windows for each class; collect & freeze specimens (PDF + URL + date).

6) Definition of Done (for this pack)
 - ✅ Final ID strings pasted into TEAS (or counsel form) unmodified.
 - ✅ Specimens plan approved for each class; pages slated for capture.
 - ✅ Basis confirmed per class (1(a) vs 1(b)).
 - ✅ Internal sign‑offs (Brand + Legal).
 - ✅ Docket entries created (SOU timing, extensions if needed).
