import { useEffect, useState } from "react";
import Window from "../desktop/Window.jsx";

const APPS = {
  api: { title: "API Agent", icon: "API" },
  llm: { title: "LLM Agent", icon: "LLM" },
  math: { title: "Math Agent", icon: "MATH" },
  echo: { title: "Echo Agent", icon: "ECHO" },
  guardian: { title: "Guardian Agent", icon: "GUARD" },
  explorer: { title: "Prism Explorer", icon: "FS" },
};

function defaultWin(key) {
  return {
    id: crypto.randomUUID(),
    app: key,
    title: APPS[key].title,
    x: 80,
    y: 80,
    w: 400,
    h: 300,
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
  switch (key) {
    case "api":
      return <pre className="p-2">/prism/logs/api tail</pre>;
    case "llm":
      return <div className="p-2">LLM chat placeholder</div>;
    case "math":
      return <div className="p-2">Graph canvas placeholder</div>;
    case "echo":
      return <div className="p-2">Echo agent window</div>;
    case "guardian":
      return <div className="p-2">Contradictions list</div>;
    case "explorer":
      return <div className="p-2">/prism file explorer</div>;
    default:
      return null;
  }
}

