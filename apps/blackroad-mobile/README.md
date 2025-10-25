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

Copy `.env.example` and export values in your shell or add them to your Xcode scheme:

```bash
export BLACKROAD_API_URL=http://localhost:5051/api/mobile/dashboard
export BLACKROAD_API_TOKEN=stub-token
```

### Quality Gates

```bash
make lint
make test
make build
```

Tests cover the view model, offline cache, telemetry batching, and a SwiftUI rendering snapshot.

### Offline Mode

When the API call fails the app serves the cached payload from `UserDefaults` and surfaces an accessibility-labelled offline banner.

### Telemetry

Interactions are buffered and flushed when the buffer reaches ten events. Extend `Telemetry` to connect to your analytics pipeline.

### Release checklist

1. `make lint test build`
2. Validate biometric gate on a device with Face ID / Touch ID enabled.
3. Tag with `v0.1.0-blackroad-mobile` after QA.
