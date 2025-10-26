# iOS Privacy Manifest guardrails

Apple requires a privacy manifest for third-party SDKs starting in 2024. BlackRoad Mobile currently links only first-party SwiftUI/SwiftPM code, so no additional declarations are required.

## Data collection policy
- The app does **not** collect personal data by default.
- Telemetry events are anonymized operational metrics; ensure they remain aggregate-only.
- Update the manifest if integrating analytics, crash reporters, or advertising SDKs.

## Platform entitlements
- Face ID / Touch ID: Add `NSFaceIDUsageDescription` only if biometric gating ships. Include justification referencing enterprise authentication.
- Background refresh, location, Bluetooth, etc.: Require product review + legal sign-off before enabling.

## Implementation checklist
1. Keep `PrivacyInfo.xcprivacy` under source control once third-party SDKs demand it.
2. Document any new data categories in this file and in `docs/appstore-metadata.md`.
3. Coordinate with security to review vendor privacy manifests.

## Secrets hygiene
- Never embed `BLACKROAD_API_TOKEN` or other credentials in Info.plist or the bundle.
- Use the Keychain at runtime and environment-driven configuration (`Config.xcconfig`) at build time.
