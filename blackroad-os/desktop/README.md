# Black Road Desktop Environment

An Electron + React desktop shell for Black Road OS featuring a spectrum-themed taskbar, start menu, and window chrome tailored for Raspberry Pi 5 hardware.

## Scripts

```bash
# Run the desktop in production mode
npm start

# Launch with developer tooling enabled
npm run dev

# Package distributables (creates AppImage and deb builds)
npm run build
```

## Project layout

- `src/main/` – Electron main-process entry point that manages the root desktop window and application windows.
- `public/` – Static assets loaded by Electron, including the React renderer bundle, styles, and window templates.
- `public/scripts/` – Renderer-side scripts written with React to render the desktop UI and manage IPC with the main process.

## Raspberry Pi optimizations

Enable GPU acceleration by exporting the following variables (add them to `~/.bashrc` on the Pi):

```bash
export ELECTRON_ENABLE_GPU=1
export ELECTRON_FLAGS="--enable-features=VaapiVideoDecoder --use-gl=egl"
```

The desktop auto-expands to fullscreen on Linux arm64 targets, ensuring a kiosk-like boot experience on Pi hardware.
