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

function defaultWindow(key) {
  const layout = APPS[key];
  const size = layout?.size || {};
  return {
    id: createId(),
    app: key,
    title: layout?.title || key,
    x: 80,
    y: 80,
    w: size.width || 400,
    h: size.height || 320,
    minimized: false,
    maximized: false,
  };
}

function loadLayout() {
  return new Promise((resolve) => {
    if (!globalThis.indexedDB) {
      resolve([]);
      return;
    }
    const request = indexedDB.open("prism-desktop", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("layout");
    };
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("layout", "readonly");
      const store = tx.objectStore("layout");
      const getReq = store.get("windows");
      getReq.onsuccess = () => resolve(Array.isArray(getReq.result) ? getReq.result : []);
      getReq.onerror = () => resolve([]);
    };
  });
}

function saveLayout(windows) {
  if (!globalThis.indexedDB) {
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
  const [windows, setWindows] = useState([]);

  useEffect(() => {
    let ignore = false;
    loadLayout().then((data) => {
      if (!ignore) {
        setWindows(data.map((win) => ({ ...defaultWindow(win.app), ...win, id: win.id || createId() })));
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    saveLayout(windows);
  }, [windows]);

  const openWindow = (key) => {
    if (!APPS[key]) return;
    setWindows((prev) => {
      const existing = prev.find((win) => win.app === key);
      if (existing) {
        return prev.map((win) => (win.app === key ? { ...win, minimized: false } : win));
      }
      return [...prev, defaultWindow(key)];
    });
  };

  const updateWindow = (id, patch) => {
    setWindows((prev) => prev.map((win) => (win.id === id ? { ...win, ...patch } : win)));
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg,#FF4FD8,#0096FF,#FDBA2D)" }}
    >
      {windows.map((win) => (
        <Window
          key={win.id}
          win={win}
          onClose={() => setWindows((prev) => prev.filter((item) => item.id !== win.id))}
          onToggleMin={() => updateWindow(win.id, { minimized: !win.minimized })}
          onToggleMax={() => updateWindow(win.id, { maximized: !win.maximized })}
          onUpdate={(patch) => updateWindow(win.id, patch)}
        >
          {renderApp(win.app)}
        </Window>
      ))}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-black/60 px-3 py-2 text-white">
        {Object.entries(APPS).map(([key, app]) => (
          <button
            key={key}
            type="button"
            onClick={() => openWindow(key)}
            className="rounded bg-white/15 px-3 py-1 text-sm font-semibold tracking-wide hover:bg-white/25"
            title={app.title}
          >
            {app.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
