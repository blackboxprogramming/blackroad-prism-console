import { NavLink, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Chat from "./pages/Chat.jsx";
import Canvas from "./pages/Canvas.jsx";
import Editor from "./pages/Editor.jsx";
import Terminal from "./pages/Terminal.jsx";
import RoadView from "./pages/RoadView.jsx";
import Backroad from "./pages/Backroad.jsx";
import Subscribe from "./pages/Subscribe.jsx";
import Lucidia from "./pages/Lucidia.jsx";
import InfinityMath from "./pages/InfinityMath.jsx";
import Agents from "./pages/Agents.jsx";
import Desktop from "./pages/Desktop.jsx";
import QuantumConsciousness from "./pages/QuantumConsciousness.jsx";
import OptimalTransportLab from "./pages/OptimalTransportLab.jsx";
import BifurcationLab from "./pages/BifurcationLab.jsx";
import ContinuedFractionsLab from "./pages/ContinuedFractionsLab.jsx";
import QuatJuliaLab from "./pages/QuatJuliaLab.jsx";
import StableFluidsLab from "./pages/StableFluidsLab.jsx";
import AutoDiffLab from "./pages/AutoDiffLab.jsx";
import ConformalGridLab from "./pages/ConformalGridLab.jsx";
import EikonalLab from "./pages/EikonalLab.jsx";
import PoissonDiskLab from "./pages/PoissonDiskLab.jsx";
import LSystemLab from "./pages/LSystemLab.jsx";
import MinimalSurfaceLab from "./pages/MinimalSurfaceLab.jsx";
import EigenmapsLab from "./pages/EigenmapsLab.jsx";
import PoissonBlendLab from "./pages/PoissonBlendLab.jsx";
import NBodyLab from "./pages/NBodyLab.jsx";
import WaveletLab from "./pages/WaveletLab.jsx";
import PoissonBoltzmannLab from "./pages/PoissonBoltzmannLab.jsx";
import RidgeRegressionLab from "./pages/RidgeRegressionLab.jsx";
import KernelPCALab from "./pages/KernelPCALab.jsx";
import BrushfirePathLab from "./pages/BrushfirePathLab.jsx";
import BlueNoiseTSPLab from "./pages/BlueNoiseTSPLab.jsx";
import BezierShadedSurfaceLab from "./pages/BezierShadedSurfaceLab.jsx";
import Kalman2DTrackerLab from "./pages/Kalman2DTrackerLab.jsx";
import VorticityStreamLab from "./pages/VorticityStreamLab.jsx";
import Ising2DLab from "./pages/Ising2DLab.jsx";
import PCALab from "./pages/PCALab.jsx";
import RSAToyLab from "./pages/RSAToyLab.jsx";
import NotFound from "./pages/NotFound.jsx";

const NAV_LINKS = [
  { path: "chat", label: "Chat" },
  { path: "canvas", label: "Canvas" },
  { path: "editor", label: "Editor" },
  { path: "terminal", label: "Terminal" },
  { path: "roadview", label: "RoadView" },
  { path: "backroad", label: "Backroad" },
  { path: "agents", label: "Agents" },
  { path: "subscribe", label: "Subscribe" },
  { path: "lucidia", label: "Lucidia" },
  {
    path: "math",
    renderLabel: () => (
      <>
        <span
          style={{
            background: "linear-gradient(90deg,#FF4FD8,#0096FF,#FDBA2D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ∞
        </span>{" "}
        Infinity Math
      </>
    ),
  },
];

const LEGACY_ROUTES = [
  { path: "chat", element: <Chat /> },
  { path: "canvas", element: <Canvas /> },
  { path: "editor", element: <Editor /> },
  { path: "terminal", element: <Terminal /> },
  { path: "roadview", element: <RoadView /> },
  { path: "backroad", element: <Backroad /> },
  { path: "agents", element: <Agents /> },
  { path: "subscribe", element: <Subscribe /> },
  { path: "lucidia", element: <Lucidia /> },
  { path: "math", element: <InfinityMath /> },
  { path: "ot", element: <OptimalTransportLab /> },
  { path: "bifurcate", element: <BifurcationLab /> },
  { path: "cfrac", element: <ContinuedFractionsLab /> },
  { path: "qjulia", element: <QuatJuliaLab /> },
  { path: "fluids", element: <StableFluidsLab /> },
  { path: "autodiff", element: <AutoDiffLab /> },
  { path: "conformal", element: <ConformalGridLab /> },
  { path: "eikonal", element: <EikonalLab /> },
  { path: "poisson2", element: <PoissonDiskLab /> },
  { path: "lsys", element: <LSystemLab /> },
  { path: "minimal", element: <MinimalSurfaceLab /> },
  { path: "eigenmaps", element: <EigenmapsLab /> },
  { path: "blend", element: <PoissonBlendLab /> },
  { path: "nbody", element: <NBodyLab /> },
  { path: "wavelet", element: <WaveletLab /> },
  { path: "pb", element: <PoissonBoltzmannLab /> },
  { path: "ridge", element: <RidgeRegressionLab /> },
  { path: "kpca", element: <KernelPCALab /> },
  { path: "brushfire", element: <BrushfirePathLab /> },
  { path: "blue-tsp", element: <BlueNoiseTSPLab /> },
  { path: "bezier-lit", element: <BezierShadedSurfaceLab /> },
  { path: "kf-2d", element: <Kalman2DTrackerLab /> },
  { path: "vorticity", element: <VorticityStreamLab /> },
  { path: "ising", element: <Ising2DLab /> },
  { path: "pca", element: <PCALab /> },
  { path: "rsa", element: <RSAToyLab /> },
];

function useApiHealth() {
  const [state, setState] = useState({ ok: null, info: "" });

  useEffect(() => {
    let dead = false;

    (async () => {
      const probe = async (path) => {
        try {
          const response = await fetch(path, { cache: "no-store" });
          const text = await response.text();
          let info = "";

          try {
            const json = JSON.parse(text);
            info = `${json.status || "ok"} • ${json.time || ""}`;
          } catch {}

          return { ok: response.ok, info };
        } catch {
          return { ok: false, info: "" };
        }
      };

      let result = await probe("/api/health");
      if (!result.ok) {
        result = await probe("/api/health.json");
      }

      if (!dead) {
        setState(result);
      }
    })();

    return () => {
      dead = true;
    };
  }, []);

  return state;
}

function StatusPill() {
  const { ok, info } = useApiHealth();
  const tone = ok == null ? "opacity-60" : ok ? "text-green-400" : "text-red-400";
  const label = ok == null ? "Checking API…" : ok ? "API healthy" : "API error";

  return (
    <span className={`text-sm ${tone}`}>
      {label}
      {info ? ` — ${info}` : ""}
    </span>
  );
}

function LegacyApp() {
  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr] gap-4 p-4">
      <aside className="sidebar p-3">
        <div className="brand-logo text-2xl mb-4">BlackRoad.io</div>
        <nav className="flex flex-col gap-2">
          {NAV_LINKS.map(({ path, label, renderLabel }) => (
            <NavLink key={path} className="nav-link" to={`/${path}`}>
              {renderLabel ? renderLabel() : label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 text-xs text-neutral-400">
          <StatusPill />
        </div>
      </aside>

      <main className="space-y-4">
        <header className="panel p-4 flex items-center justify-between">
          <h1 className="brand-gradient text-xl font-semibold">Co-coding Portal</h1>
          <a className="btn-primary" href="/api/health" target="_blank" rel="noreferrer">
            API Health
          </a>
        </header>

        <section className="card">
          <Routes>
            <Route index element={<Chat />} />
            {LEGACY_ROUTES.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Desktop />} />
      <Route path="/quantum-consciousness" element={<QuantumConsciousness />} />
      <Route path="/*" element={<LegacyApp />} />
    </Routes>
  );
}
