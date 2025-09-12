# Release Strategy

We follow [SemVer](https://semver.org). Increment:

- **MAJOR** for incompatible API changes
- **MINOR** for backwards-compatible features
- **PATCH** for backwards-compatible fixes

## Release Notes Template

```
## vX.Y.Z - YYYY-MM-DD
### Added
-
### Changed
-
### Fixed
-
```

Tagged releases are created via GitHub Actions (`tag-and-release.yml`) and the
changelog is derived from commit messages.
