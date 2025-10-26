# BlackRoad Mobile

SwiftUI companion app delivering the Prism dashboard to leadership wherever they are.

## Runbook

### Prerequisites

- Xcode 15+
- Swift 5.9 toolchain
- [SwiftLint](https://github.com/realm/SwiftLint) and [SwiftFormat](https://github.com/nicklockwood/SwiftFormat) for style gates
- Optional: Python 3.11+ for local mock API

### Getting started

```bash
make dev             # opens the Xcode workspace
make mocks           # runs the local mock API at http://localhost:5051
```

In Xcode choose the **BlackRoadMobile** target and run on the iPhone 15 simulator. The app authenticates with biometrics when a `BLACKROAD_API_TOKEN` is present.

### Configuration

Runtime secrets stay in the device Keychain. Build-time configuration is surfaced through `Config.xcconfig`, which defaults to production but can be overridden by environment variables:

```xcconfig
// Env-driven API; default to production
API_URL = https://console.blackroad.io/api
BLACKROAD_API_URL = $(API_URL)
```

Override `API_URL` before running Xcode or Fastlane to target staging or local mocks. The biometric gate only activates when `BLACKROAD_API_TOKEN` is supplied at runtime—never store the token in Info.plist or source control.

For local QA, export temporary values in your shell:

```bash
export API_URL=http://localhost:5051/api/mobile/dashboard
export BLACKROAD_API_TOKEN=stub-token
```

### Quality Gates

```bash
make lint
make test
make build
```

Tests cover the view model, offline cache, telemetry batching, and a SwiftUI rendering snapshot.

### Fastlane delivery

Fastlane automation lives in `fastlane/`. Run `bundle install` once, then invoke lanes with `bundle exec`. Key lanes:

- `bundle exec fastlane bump_build` — sets the build number to a UTC timestamp.
- `bundle exec fastlane unit_tests` — runs the `BlackRoad` scheme on the iPhone 15 simulator with coverage.
- `bundle exec fastlane build_ipa` — produces `fastlane/build/BlackRoad.ipa` using automatic signing.
- `bundle exec fastlane beta` — bumps the build, runs tests, builds, and uploads to the TestFlight **Internal** + **QA** groups.
- `bundle exec fastlane release version:1.2.0` — bumps the marketing version, rebuilds, and ships to the Internal TestFlight group for manual App Store promotion.

Lanes rely on the App Store Connect API key secrets injected at runtime (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENT`, `APPLE_TEAM_ID`). Keep `.p8` files out of the repo—CI reconstructs them per run. Optional lanes `lint` and `ci` provide local wrappers for style + build checks.

Before your first upload, create the **Internal** and **QA** TestFlight groups in App Store Connect and add testers.

For local end-to-end tests, export your App Store Connect API key material before running a lane:

```bash
export ASC_KEY_ID=...
export ASC_ISSUER_ID=...
export ASC_KEY_CONTENT=$(base64 -i ~/AuthKey_<id>.p8)
export APPLE_TEAM_ID=...

bundle exec fastlane beta
```

### Offline Mode

When the API call fails the app serves the cached payload from `UserDefaults` and surfaces an accessibility-labelled offline banner.

### Telemetry

Interactions are buffered and flushed when the buffer reaches ten events. Extend `Telemetry` to connect to your analytics pipeline.

### Release checklist

1. `make lint test build` or `bundle exec fastlane unit_tests`.
2. `bundle exec fastlane beta` to exercise the full delivery path before main merges.
3. Validate biometric gate on a device with Face ID / Touch ID enabled.
4. Tag with `mobile-v<version>+<build>` after QA sign-off.
