# RoadWork Security Notes

- No secrets or API keys are stored in the repository. Mock APIs rely on static fixtures.
- All progress and telemetry data remain in the browser via LocalStorage.
- Rate limiting guards block rapid quiz submissions to mitigate spam.
- Keep dependencies updated via pnpm to receive security patches.
