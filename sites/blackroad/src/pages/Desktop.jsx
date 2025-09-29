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
    const req = indexedDB.open("prism-desktop", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("layout");
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("layout", "readonly");
      const store = tx.objectStore("layout");
      const getReq = store.get("windows");
      getReq.onsuccess = () => resolve(getReq.result || []);
      getReq.onerror = () => resolve([]);
    };
    req.onerror = () => resolve([]);
  });
}

function saveLayout(windows) {
  const req = indexedDB.open("prism-desktop", 1);
  req.onupgradeneeded = () => {
    req.result.createObjectStore("layout");
  };
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction("layout", "readwrite");
    tx.objectStore("layout").put(windows, "windows");
  };
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
    setWins((ws) => {
      const existing = ws.find((w) => w.app === key);
      if (existing) return ws.map((w) => (w.app === key ? { ...w, minimized: false } : w));
      return [...ws, defaultWin(key)];
    });
  };

  const update = (id, patch) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,#FF4FD8,#0096FF,#FDBA2D)",
      }}
    >
      {wins.map((win) => (
        <Window
          key={win.id}
          win={win}
          onClose={() => setWins((ws) => ws.filter((w) => w.id !== win.id))}
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

function renderApp(key) {
  const entry = APPS[key];
  if (!entry || !entry.component) return null;
  const Component = entry.component;
  return <Component />;
}

