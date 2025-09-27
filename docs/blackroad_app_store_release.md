# BlackRoad App Store Release Checklist

This document captures the tasks needed to turn the SwiftUI mobile shell into a
shipping binary on the Apple App Store. Treat it as the companion playbook for
Product, Engineering, and Ops to collaborate on the submission.

## 1. Product framing

- **Value prop** – “BlackRoad Prism in your pocket,” surfacing the same real-time
  operational health that operators currently access via the `btop++`-style
  terminal dashboard.
- **Target users** – On-call engineers, executives needing status glances, and
  enablement leads reviewing readiness metrics.
- **Feature commitments for v1**
  - Live status grid powered by `/api/mobile/dashboard`.
  - Shortcut launcher for SLO reports, bench orchestrations, and runbooks.
  - Offline cache and background refresh every 15 minutes.
  - Biometrics gate (Face ID / Touch ID) when the API token is scoped to
    privileged operations.

## 2. Engineering tasks

1. **API contract** – expose `DashboardPayload` from the Prism backend and add a
   contract test alongside `cli/console.py` so the mobile client and CLI stay in
   lockstep.
2. **Telemetry** – add mobile app identifiers to the existing analytics pipeline
   (segmenting by device, OS version, and build number).
3. **Automated build** – GitHub Action that:
   - Runs `swiftlint` and `swift test`.
   - Archives the app with `xcodebuild -scheme BlackRoad -configuration Release`.
   - Exports an `.ipa` via `xcodebuild -exportArchive` with App Store
     provisioning.
   - Uploads to TestFlight using `xcrun altool` or `notarytool` for notarization.
4. **CLI parity** – extend `python -m cli.console status:generate` to emit the
   JSON consumed by the mobile client; document the field mapping in
   `apps/blackroad-mobile/README.md`.

## 3. Compliance & security

- **PII audit** – confirm the payload excludes sensitive customer identifiers.
- **Encryption** – note that network requests use HTTPS with bearer tokens. Add a
  `NSAppTransportSecurity` exception only if pointing to non-HTTPS dev servers.
- **Keychain storage** – store the API token using `KeychainAccess` and guard
  refresh tokens behind biometrics.
- **MAM requirements** – if distributing internally, register with Apple Business
  Manager and supply the MDM profile details.

## 4. Design deliverables

- App icon set (1024px master + 20/29/40/60/76/83.5 variations).
- Launch screen storyboard mirroring the desktop dashboard glow.
- Accent palette and typography tokens consistent with BlackRoad’s web brand
  kit.
- Screenshots for 6.1", 6.7", and iPad form factors showing the metrics grid,
  shortcuts, and offline mode.

## 5. App Store Connect metadata

| Field | Owner | Notes |
| --- | --- | --- |
| Name | Product | "BlackRoad Prism" preferred. |
| Subtitle | Marketing | e.g. "Mission-critical ops in your pocket". |
| Privacy policy URL | Legal | Link to existing BlackRoad privacy policy. |
| Support URL | Support | Should point to `/support`. |
| Keywords | Marketing | Monitoring, SRE, BlackRoad, ops, SLO. |
| Rating | Legal | Likely 4+. |
| Review notes | Engineering | Provide demo credentials and scenario. |

## 6. Submission flow

1. Create an App Store Connect record (iOS app, bundle ID `io.blackroad.console`).
2. Upload the `.ipa` produced by CI or Xcode Organizer.
3. Fill metadata, privacy questionnaire, and encryption export compliance.
4. Attach screenshots, preview video, and a detailed changelog.
5. Submit for review and monitor App Review feedback.

## 7. Post-launch

- Set up crash monitoring with Xcode Organizer + Sentry.
- Add mobile-specific SLOs (e.g. refresh latency, push notification delivery).
- Publish release notes in the Prism console and the corporate blog.
- Collect NPS via in-app prompt after the third successful refresh.

Following this checklist keeps the BlackRoad mobile experience aligned with the
existing operational tooling while satisfying Apple’s distribution requirements.
