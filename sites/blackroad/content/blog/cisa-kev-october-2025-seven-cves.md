---
title: "CISA Adds Seven Actively Exploited CVEs to the KEV Catalog"
date: "2025-10-07"
tags: [security, vulnerability-management, cisa]
description: "Seven more actively exploited CVEs just landed in CISA's KEV catalog—here's what they hit and what to do before the October 27 deadline."
---

CISA expanded the Known Exploited Vulnerabilities (KEV) catalog on October 6 with **seven** additional CVEs that adversaries are already abusing in the wild. Under Binding Operational Directive (BOD) 22-01, U.S. federal civilian agencies must remediate the affected products by **27 October 2025**, and the same urgency applies to anyone running the impacted stacks.

## The new entries

- **CVE-2025-61882 – Oracle E-Business Suite (BI Publisher Integration)**: Unauthenticated network attackers can take over Oracle Concurrent Processing via a flaw in the BI Publisher integration component. Fixes or mitigations from Oracle should be applied immediately, or the service must be pulled offline.
- **CVE-2021-22555 – Linux Kernel (user namespaces)**: A heap out-of-bounds write allows privilege escalation or denial of service through crafted user namespace interactions. Harden kernel configs and move to patched builds without delay.
- **CVE-2021-43226 – Microsoft Windows (CLFS driver)**: A privilege escalation bug in the Common Log File System driver lets local attackers bypass security controls. Roll out Microsoft’s updates and monitor for suspicious CLFS usage.
- **CVE-2013-3918 – Microsoft Windows (icardie ActiveX)**: Remote code execution via the InformationCardSigninHelper ActiveX control. Because the affected component is legacy, organizations should remove or disable the control entirely if patching is impossible.
- **CVE-2011-3402 – Microsoft Windows (TrueType parser)**: Crafted fonts delivered via documents or webpages can trigger kernel-mode code execution. Ensure all systems—including VDIs and kiosk images—receive the patched win32k.sys drivers.
- **CVE-2010-3962 – Microsoft Internet Explorer**: An uninitialized memory corruption flaw enables remote code execution in Internet Explorer. Systems still relying on IE (including embedded runtimes) should be migrated or isolated if updates are unavailable.
- **CVE-2010-3765 – Mozilla Firefox, SeaMonkey, Thunderbird**: Memory corruption in the layout engine allows code execution when JavaScript is enabled. Legacy deployments must upgrade or disable affected features.

## Why this round matters

- **High-value targets**: The list spans ERP middleware, core operating systems, and ubiquitous browsers—assets that anchor identity, finance, and mission applications.
- **Old but not gone**: Four of the seven CVEs pre-date 2014, highlighting how legacy components linger in operational environments. Assume unsupported software is present in OT and contractor networks until proven otherwise.
- **Active exploitation confirmed**: KEV inclusion means exploitation is happening now, not hypothetically. Expect rapid commoditization in exploit kits.

## Immediate actions

1. **Inventory exposure fast**: Enumerate Oracle E-Business Suite instances, Linux kernel versions, and any Windows or Mozilla builds that still expose these code paths.
2. **Patch or isolate**: Deploy vendor fixes where available. For EoL technologies (Internet Explorer, legacy ActiveX controls, old Mozilla builds), segment or retire systems that cannot be remediated.
3. **Hunt for compromise**: Review logs for suspicious CLFS driver activity, abnormal user namespace operations on Linux, and unexpected font or browser crashes.
4. **Update playbooks**: Align remediation timelines with the October 27 deadline and communicate the KEV additions to leadership and third parties subject to federal requirements.

Treat this KEV update as a stop-everything maintenance window. Weaponization is confirmed, timelines are fixed, and the blast radius covers some of the most entrenched software in critical infrastructure.
