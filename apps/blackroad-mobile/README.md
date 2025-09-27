# BlackRoad Mobile (App Store Blueprint)

This directory contains a lightweight SwiftUI application skeleton that turns the
BlackRoad Prism Console data into a native iOS experience. The goal is to ship a
review-friendly binary through App Store Connect while keeping parity with the
terminal-focused `btop++` workflow: quick system insight, color-coded health,
and fast navigation between operational dashboards.

## Feature snapshot

- **Live operations pulse** – mirrors the CLI metrics exported by
  `python -m cli.console status:generate`, aggregating service uptime,
  API latency, and outstanding tasks into a compact grid.
- **Action shortcuts** – one-tap deep links for SLO reports, bench runs, or
  emergency runbooks. These reuse the existing orchestrator endpoints so the
  mobile app stays thin.
- **Offline friendly** – caches the most recent payload in `AppStorage` and
  displays a degraded-but-usable view when the device is offline.
- **Accessible visuals** – large typography, VoiceOver labels, and haptic
  confirmations modeled after the monitoring panels in the Prism console.

## Building and running

1. Open `BlackRoadApp.swift` in Xcode 15 or newer.
2. Create a new **App** project named `BlackRoad` and replace the generated
   Swift files with the ones in this folder. (We keep the Swift code in-repo so
   it can be linted and code-reviewed.)
3. Update the bundle identifier to match your Apple Developer account, e.g.
   `io.blackroad.console`.
4. Add the following environment values to your scheme or configuration plist:

   | Key | Description |
   | --- | --- |
   | `BLACKROAD_API_URL` | Base URL of the Prism Console API (defaults to `https://console.blackroad.io`). |
   | `BLACKROAD_API_TOKEN` | Optional bearer token for authenticated requests. |

5. Run on the simulator or a physical device. The dashboard will populate using
   the stubbed sample data if the API is unreachable.

## Preparing for the App Store

1. **Assets** – replace the placeholder accent colors with official branding
   (AppIcon, launch screen, accent palette). This repo ships the logic only so
   creative assets stay in Design’s source of truth.
2. **Signing** – use `xcodebuild -exportArchive` with an `ExportOptions.plist`
   configured for App Store distribution. Attach the generated `.ipa` to the
   `deliver` step or upload via Xcode Organizer.
3. **Continuous delivery** – add a `fastlane` lane or GitHub Action that runs
   `xcodebuild` for `Release` and notarizes the build with `altool`.
4. **Review package** – document the login flow and any special configuration in
   `docs/blackroad_app_store_release.md` so App Review receives reproducible
   steps and demo credentials.

## Relationship to the CLI

The SwiftUI app calls the same JSON endpoints that drive `cli/console.py`. You
can keep a consistent operator workflow by:

- Exposing `/api/mobile/dashboard` from the existing API and hooking it into the
  orchestrator’s task routing logic.
- Scheduling the CLI’s health checks (e.g. `python -m cli.console slo:report`)
  to publish into the `dashboard` payload consumed by the mobile client.
- Using the included `AppDashboardViewModel` to map CLI fields to mobile cards.

With these pieces in place, the App Store app becomes a polished skin around the
`btop++` style monitoring experience that BlackRoad operators already trust.
