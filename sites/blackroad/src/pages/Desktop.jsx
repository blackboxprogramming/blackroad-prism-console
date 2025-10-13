import { useEffect, useState } from "react";
import Window from "../desktop/Window.jsx";
import ApiAgent from "../desktop/apps/ApiAgent.jsx";
import LlmAgent from "../desktop/apps/LlmAgent.jsx";
import MathAgent from "../desktop/apps/MathAgent.jsx";
import EchoAgent from "../desktop/apps/EchoAgent.jsx";
import GuardianAgent from "../desktop/apps/GuardianAgent.jsx";
import ExplorerAgent from "../desktop/apps/ExplorerAgent.jsx";
import createId from "../desktop/createId.js";

const APPS = {
  api: { title: "API Agent", icon: "API", component: ApiAgent, size: { width: 420, height: 360 } },
  llm: { title: "LLM Agent", icon: "LLM", component: LlmAgent, size: { width: 460, height: 440 } },
  math: { title: "Math Agent", icon: "MATH", component: MathAgent, size: { width: 520, height: 480 } },
  echo: { title: "Echo Agent", icon: "ECHO", component: EchoAgent, size: { width: 360, height: 320 } },
  guardian: { title: "Guardian Agent", icon: "GUARD", component: GuardianAgent, size: { width: 380, height: 340 } },
  explorer: { title: "Prism Explorer", icon: "FS", component: ExplorerAgent, size: { width: 460, height: 360 } },
};

function defaultWin(key) {
  const layout = APPS[key] || {};
  const size = layout.size || {};

  return {
    id: createId(),
    app: key,
    title: layout.title || key,
    x: 80,
    y: 80,
    w: size.width || 400,
    h: size.height || 320,
    minimized: false,
    maximized: false,
  };
}

function hydrateWindow(win) {
  if (!win || !win.app) {
    return null;
  }

  const layout = APPS[win.app] || {};
  const size = layout.size || {};

  return {
    ...defaultWin(win.app),
    ...win,
    title: win.title || layout.title || win.app,
    w: win.w || size.width || 400,
    h: win.h || size.height || 320,
  };
}

function loadLayout() {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const request = indexedDB.open("prism-desktop", 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore("layout");
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("layout", "readonly");
      const store = tx.objectStore("layout");
      const getReq = store.get("windows");

      getReq.onsuccess = () => {
        const raw = Array.isArray(getReq.result) ? getReq.result : [];
        resolve(raw.map(hydrateWindow).filter(Boolean));
      };

      getReq.onerror = () => resolve([]);
    };

    request.onerror = () => resolve([]);
  });
}

function saveLayout(windows) {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const request = indexedDB.open("prism-desktop", 1);

  request.onupgradeneeded = () => {
    request.result.createObjectStore("layout");
  };

  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction("layout", "readwrite");
    tx.objectStore("layout").put(windows, "windows");
  };
}

function renderApp(key) {
  const entry = APPS[key];
  if (!entry || !entry.component) {
    return null;
  }

  const Component = entry.component;
  return <Component />;
}

export default function Desktop() {
  const [wins, setWins] = useState([]);

  useEffect(() => {
    loadLayout().then((data) => setWins(data));
  }, []);

  useEffect(() => {
    saveLayout(wins);
  }, [wins]);

  const open = (key) => {
    setWins((windows) => {
      const existing = windows.find((win) => win.app === key);
      if (existing) {
        const restored = { ...existing, minimized: false };
        return [...windows.filter((win) => win.app !== key), restored];
      }

      const next = defaultWin(key);
      return [...windows, next];
    });
  };

  const update = (id, patch) =>
    setWins((windows) => windows.map((win) => (win.id === id ? { ...win, ...patch } : win)));

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#FF4FD8,#0096FF,#FDBA2D)" }}
    >
      {wins.map((win) => (
        <Window
          key={win.id}
          win={win}
          onClose={() => setWins((windows) => windows.filter((w) => w.id !== win.id))}
          onToggleMin={() => update(win.id, { minimized: !win.minimized })}
          onToggleMax={() => update(win.id, { maximized: !win.maximized })}
          onUpdate={(data) => update(win.id, data)}
        >
          {renderApp(win.app)}
        </Window>
      ))}

      <div className="taskbar absolute bottom-0 left-0 right-0 bg-black/60 text-white flex gap-2 p-2">
        {Object.entries(APPS).map(([key, app]) => (
          <button
            key={key}
            onClick={() => open(key)}
            className="px-2 py-1 bg-white/20 rounded hover:bg-white/30"
          >
            {app.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
