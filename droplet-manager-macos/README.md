# Droplet Manager for macOS

> **Note**: This is a community-maintained fork of the legacy
> DODropletManager-OSX project. The original v1 API client is preserved
> under the `legacy` branch. New development targets DigitalOcean API v2.

## DigitalOcean Token

Create a Personal Access Token with read and write scopes from your
[DigitalOcean control panel](https://cloud.digitalocean.com/account/api/tokens).
The app stores the token securely in your macOS Keychain. No token values
are written to disk.

## Privacy & Security

* OAuth tokens are kept in the user's login Keychain.
* API communication uses `NSURLSession` with TLS.
* Secrets are scanned using [gitleaks](https://github.com/gitleaks/gitleaks).

## Links

* [DigitalOcean API v2 documentation](https://docs.digitalocean.com/reference/api/api-reference/)
* [DigitalOcean OAuth overview](https://docs.digitalocean.com/reference/api/oauth/)

## Screenshots

Screenshots of the application will be added in a future update.

_Last updated on 2025-09-11_
