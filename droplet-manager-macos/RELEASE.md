# Release 0.6.0 Checklist

1. Ensure `CODESIGN_IDENTITY` and notarization credentials are configured.
2. Run the macOS build workflow which produces a signed `.app` and SBOM.
3. Zip the artifact and create a GitHub Release tagged `v0.6.0`.
4. Attach the `.zip` and SBOM to the release.
5. (Optional) Notarize the app using `xcrun notarytool`.
6. Update the Homebrew cask with the new version and sha256.
