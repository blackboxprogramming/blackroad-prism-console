---
title: "CISA Adds Eight Actively Exploited CVEs to the KEV Catalog"
date: "2025-10-07"
tags: [security, vulnerability-management, cisa]
description: "Seven more actively exploited CVEs just landed in CISA's KEV catalog—here's what they hit and what to do before the October 27 deadline."
---

CISA expanded the Known Exploited Vulnerabilities (KEV) catalog on October 6 with **seven** additional CVEs that adversaries are already abusing in the wild, then added an **eighth** entry on October 7. Under Binding Operational Directive (BOD) 22-01, U.S. federal civilian agencies must remediate the affected products by **27 October 2025**, and the same urgency applies to anyone running the impacted stacks.

## The new entries

- **CVE-2025-61882 – Oracle E-Business Suite (BI Publisher Integration)**: Unauthenticated network attackers can take over Oracle Concurrent Processing via a flaw in the BI Publisher integration component. Fixes or mitigations from Oracle should be applied immediately, or the service must be pulled offline.
- **CVE-2021-22555 – Linux Kernel (user namespaces)**: A heap out-of-bounds write allows privilege escalation or denial of service through crafted user namespace interactions. Harden kernel configs and move to patched builds without delay.
- **CVE-2021-43226 – Microsoft Windows (CLFS driver)**: A privilege escalation bug in the Common Log File System driver lets local attackers bypass security controls. Roll out Microsoft’s updates and monitor for suspicious CLFS usage.
- **CVE-2013-3918 – Microsoft Windows (icardie ActiveX)**: Remote code execution via the InformationCardSigninHelper ActiveX control. Because the affected component is legacy, organizations should remove or disable the control entirely if patching is impossible.
- **CVE-2011-3402 – Microsoft Windows (TrueType parser)**: Crafted fonts delivered via documents or webpages can trigger kernel-mode code execution. Ensure all systems—including VDIs and kiosk images—receive the patched win32k.sys drivers.
- **CVE-2010-3962 – Microsoft Internet Explorer**: An uninitialized memory corruption flaw enables remote code execution in Internet Explorer. Systems still relying on IE (including embedded runtimes) should be migrated or isolated if updates are unavailable.
- **CVE-2010-3765 – Mozilla Firefox, SeaMonkey, Thunderbird**: Memory corruption in the layout engine allows code execution when JavaScript is enabled. Legacy deployments must upgrade or disable affected features.
- **CVE-2024-43198 – Ivanti Connect Secure / Policy Secure Gateways**: An authentication bypass and command injection chain lets remote attackers execute arbitrary commands on the appliance. Patch to the fixed build, rotate appliance credentials, and sweep for webshells or rogue processes before bringing gateways back into service.

## Why this round matters

- **High-value targets**: The list spans ERP middleware, core operating systems, and ubiquitous browsers—assets that anchor identity, finance, and mission applications.
- **Old but not gone**: Four of the seven CVEs pre-date 2014, highlighting how legacy components linger in operational environments. Assume unsupported software is present in OT and contractor networks until proven otherwise.
- **Active exploitation confirmed**: KEV inclusion means exploitation is happening now, not hypothetically. Expect rapid commoditization in exploit kits.

## Immediate actions

1. **Inventory exposure fast**: Enumerate Oracle E-Business Suite instances, Linux kernel versions, and any Windows or Mozilla builds that still expose these code paths.
2. **Patch or isolate**: Deploy vendor fixes where available. For EoL technologies (Internet Explorer, legacy ActiveX controls, old Mozilla builds), segment or retire systems that cannot be remediated.
3. **Hunt for compromise**: Review logs for suspicious CLFS driver activity, abnormal user namespace operations on Linux, and unexpected font or browser crashes.
4. **Update playbooks**: Align remediation timelines with the October 27 deadline and communicate the KEV additions to leadership and third parties subject to federal requirements.

## Make KEV hits lights-out P1s

To keep pace with rapid KEV updates, fold the catalog directly into your vulnerability-response pipeline:

1. **Daily KEV sync + diff**: Pull the CISA KEV JSON every day and compare it against SBOM exports or scanner results to catch new overlaps immediately.
2. **Auto-ticketing**: When a KEV match appears, open an incident ticket with the owning team, the CVE identifier, severity preset to P1, and a due date aligned to CISA’s remediation window.
3. **Enforce gating**: Block deploys for any service with an open KEV ticket until remediation or a documented, approved isolation is in place.

With those guardrails wired into CI/CD, every fresh KEV entry becomes an automatic stop-the-line event instead of a frantic manual hunt.

Treat this KEV update as a stop-everything maintenance window. Weaponization is confirmed, timelines are fixed, and the blast radius covers some of the most entrenched software in critical infrastructure.
