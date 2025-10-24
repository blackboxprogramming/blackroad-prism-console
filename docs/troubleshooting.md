# Troubleshooting

### Vite build fails on missing asset

Create placeholder files under `sites/blackroad/public/` or update import paths. The codex bridge auto-creates common placeholders.

### ESLint errors

ESLint is advisory in CI. Locally, run `npm run lint` to fix most issues. If config missing, the bridge seeds a minimal one.

### Previews not posting

Provider secrets/vars missing. Workflows are skip-safe; add required secrets and re-run.

### Status/Snapshot not updating

Check `Uptime JSON` and `Cache Warm + Screenshot` workflows. Ensure repo has write permission and branch is not protected against bot commits.

### C# Dev Kit language server crashes with MEF composition errors

The VS Code C# Dev Kit spins up a background `servicehub` process. When its dependency graph is incomplete you see repeated errors like:

```
Microsoft.CodeAnalysis.Remote.ExportProviderBuilder[0]
  ... expected exactly 1 export matching constraints:
      Contract name: Microsoft.VisualStudio.Threading.JoinableTaskContext
      ... but found 0
```

and the log may also warn that `dotnet` cannot be found or that `MallocStackLogging` cannot be toggled. This happens when the extension cannot locate the .NET runtime it bootstrapped or when an earlier crash left stale ServiceHub state.

**Fix**

1. Make sure VS Code can see the CLI that ships with the .NET runtime. On macOS run `ln -s /usr/local/share/dotnet/dotnet /usr/local/bin/dotnet` (or update your shell PATH) and restart VS Code.
2. Clear the ServiceHub caches the Dev Kit maintains: quit VS Code and delete `~/Library/Application Support/Code/User/globalStorage/ms-dotnettools.vscode-dotnet-runtime` and `~/Library/Application Support/Code/User/globalStorage/ms-dotnettools.vscode-dotnet-runtime-servicehub/`.
3. Reinstall the `C# Dev Kit` and `C#` extensions. After the reinstall, re-open the workspace so the runtime is re-downloaded with the fixed PATH.
4. If GitHub Copilot is enabled, temporarily toggle **Copilot › IntelliSense: Enable** off. The failing MEF parts ship in the Copilot integration layer and stopping them prevents the crash loop until an upstream fix lands.

When the ServiceHub process starts cleanly the log reports `Language server initialized` without subsequent MEF errors and IntelliSense resumes working.
