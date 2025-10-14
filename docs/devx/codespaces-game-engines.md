# Game Engine Workflows in GitHub Codespaces

This guide captures the practical considerations for running Unity and Unreal Engine inside GitHub Codespaces, including GUI enablement and AI tooling support.

## Codespaces Environment Basics

- Codespaces always run a Linux container regardless of the host OS.
- VM sizes range from 2–32 vCPUs and 8–128 GB RAM.
- There is no general-purpose GPU option, and GitHub is retiring the GPU machine type by 29 Aug 2025.
- Custom behaviour can be added through `devcontainer.json` features, but Windows or macOS containers are not available.

## Enabling a GUI with `desktop-lite`

Unity and Unreal require a windowing environment. Add the `desktop-lite` feature to your `devcontainer.json` to expose a lightweight Fluxbox desktop over a web-based VNC session:

```json
{
  "image": "mcr.microsoft.com/devcontainers/universal:2",
  "features": {
    "ghcr.io/devcontainers/features/desktop-lite:1": {
      "password": "vscode",
      "webPort": "6080",
      "vncPort": "5901"
    }
  },
  "forwardPorts": [6080, 5901],
  "portsAttributes": {
    "6080": { "label": "desktop" }
  },
  "runArgs": ["--shm-size=1g"],
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot"
      ]
    }
  }
}
```

After the codespace builds, open the Ports panel, click the globe next to port `6080`, and sign in with the configured password to access the GUI. Apps launched from the terminal appear within the Fluxbox desktop automatically.

## Running Unity in Codespaces

1. Fork the [`unity-desktop-lite`](https://github.com/devcontainers/unity-desktop-lite) project and configure secrets: `UNITY_USERNAME`, `UNITY_PASSWORD`, `UNITY_SERIAL`, and optionally `VNC_PASSWORD`. Unity Plus/Pro licenses are required.
2. Set the desired Unity editor image from the GitHub Container Registry in your `devcontainer.json`.
3. Launch the codespace. The initial build can take about ten minutes.
4. Open the noVNC port (`6080`) and authenticate to reach the desktop.
5. From a terminal inside the desktop session, start Unity, e.g.:
   ```bash
   /opt/unity/Editor/Unity --projectPath /workspaces/<your-project>
   ```

Because rendering is software-only, expect sluggish performance. The setup is best for inspecting scenes or prefabs rather than full 3D editing.

## Running Unreal Engine in Codespaces

- Epic publishes Linux-only development images (`dev`, `dev-slim`) that include the Unreal Editor and toolchains, plus runtime images with optional pixel streaming support.
- Distribution of Windows development containers is prohibited; only Linux variants are provided.
- GPU acceleration in the official runtime containers requires NVIDIA hardware, which Codespaces cannot supply.
- Treat Codespaces as a headless build environment: edit C++/Blueprint code, run command-line builds, and package projects, but plan to use a local or GPU-enabled cloud machine for interactive editor work.

## AI Assistance and Prompt Management

- Include Copilot extensions in `devcontainer.json` (as shown above) to enable GitHub Copilot or Copilot Agents in the codespace.
- Store reusable prompts in `.prompt.yml` or `.prompt.yaml` files. A prompt defines metadata, model parameters, and message templates, and can be tested in the GitHub Model Playground or VS Code AI Toolkit.
- Calling GitHub-hosted models requires a token with `models:read` scope; free-tier usage is rate limited.

## Key Takeaways

1. Codespaces are Linux-only and CPU-only; there is no GPU acceleration, and GPU machine types are being sunset.
2. Use the `desktop-lite` feature to obtain a minimal GUI; forward ports `6080`/`5901` and increase shared memory for stability.
3. Unity can run via the `unity-desktop-lite` container flow for lightweight scene inspection but suffers from software rendering.
4. Unreal Engine containers are Linux-only and rely on NVIDIA GPUs for acceleration, making Codespaces suitable only for headless builds and scripting.
5. Copilot extensions and `.prompt.yml` files enable AI-assisted workflows directly in the codespace.
