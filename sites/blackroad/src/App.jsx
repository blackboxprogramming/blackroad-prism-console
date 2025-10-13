import { NavLink, Route, Routes } from "react-router-dom";
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

const legacyRoutes = [
  { path: "chat", label: "Chat", element: <Chat /> },
  { path: "canvas", label: "Canvas", element: <Canvas /> },
  { path: "editor", label: "Editor", element: <Editor /> },
  { path: "terminal", label: "Terminal", element: <Terminal /> },
  { path: "roadview", label: "RoadView", element: <RoadView /> },
  { path: "backroad", label: "Backroad", element: <Backroad /> },
  { path: "agents", label: "Agents", element: <Agents /> },
  { path: "subscribe", label: "Subscribe", element: <Subscribe /> },
  { path: "lucidia", label: "Lucidia", element: <Lucidia /> },
  { path: "math", label: "∞ Infinity Math", accent: true, element: <InfinityMath /> },
  { path: "ising", label: "Ising 2D Lab", element: <Ising2DLab /> },
  { path: "pca", label: "PCA Lab", element: <PCALab /> },
  { path: "rsa", label: "RSA Toy Lab", element: <RSAToyLab /> },
  { path: "ot", label: "Optimal Transport Lab", element: <OptimalTransportLab /> },
  { path: "bifurcate", label: "Bifurcation Lab", element: <BifurcationLab /> },
  { path: "cfrac", label: "Continued Fractions Lab", element: <ContinuedFractionsLab /> },
  { path: "qjulia", label: "Quaternion Julia Lab", element: <QuatJuliaLab /> },
  { path: "fluids", label: "Stable Fluids Lab", element: <StableFluidsLab /> },
  { path: "autodiff", label: "AutoDiff Lab", element: <AutoDiffLab /> },
  { path: "conformal", label: "Conformal Grid Lab", element: <ConformalGridLab /> },
  { path: "eikonal", label: "Eikonal Lab", element: <EikonalLab /> },
  { path: "poisson2", label: "Poisson Disk Lab", element: <PoissonDiskLab /> },
  { path: "lsys", label: "L-System Lab", element: <LSystemLab /> },
  { path: "minimal", label: "Minimal Surface Lab", element: <MinimalSurfaceLab /> },
  { path: "eigenmaps", label: "Eigenmaps Lab", element: <EigenmapsLab /> },
  { path: "blend", label: "Poisson Blend Lab", element: <PoissonBlendLab /> },
  { path: "nbody", label: "N-Body Lab", element: <NBodyLab /> },
  { path: "wavelet", label: "Wavelet Lab", element: <WaveletLab /> },
  { path: "pb", label: "Poisson-Boltzmann Lab", element: <PoissonBoltzmannLab /> },
  { path: "ridge", label: "Ridge Regression Lab", element: <RidgeRegressionLab /> },
  { path: "kpca", label: "Kernel PCA Lab", element: <KernelPCALab /> },
  { path: "brushfire", label: "Brushfire Path Lab", element: <BrushfirePathLab /> },
  { path: "blue-tsp", label: "Blue Noise TSP Lab", element: <BlueNoiseTSPLab /> },
  { path: "bezier-lit", label: "Bezier Shaded Surface Lab", element: <BezierShadedSurfaceLab /> },
  { path: "kf-2d", label: "Kalman 2D Tracker Lab", element: <Kalman2DTrackerLab /> },
  { path: "vorticity", label: "Vorticity Stream Lab", element: <VorticityStreamLab /> },
];

function useApiHealth() {
  const [state, setState] = useState({ ok: null, info: "" });

  useEffect(() => {
    let dead = false;

    const probe = async (path) => {
      try {
        const response = await fetch(path, { cache: "no-store" });
        const text = await response.text();
        let info = "";
        try {
          const data = JSON.parse(text);
          info = `${data.status || "ok"}${data.time ? ` • ${data.time}` : ""}`;
        } catch (error) {
          info = "";
        }
        return { ok: response.ok, info };
      } catch (error) {
        return { ok: false, info: "" };
      }
    };

    (async () => {
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
    <span className={`text-xs uppercase tracking-wide ${tone}`}>
      {label}
      {info ? ` — ${info}` : ""}
    </span>
  );
}

function LegacyApp() {
  return (
    <div className="min-h-screen grid gap-4 p-4 md:grid-cols-[240px_1fr]">
      <aside className="sidebar p-4">
        <div className="brand-logo text-2xl font-semibold">BlackRoad.io</div>
        <nav className="mt-6 flex flex-col gap-2 text-sm">
          {legacyRoutes.map((item) => (
            <NavLink
              key={item.path}
              to={`/${item.path}`}
              className={({ isActive }) =>
                `nav-link rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-white/10 text-white" : "text-slate-200/80 hover:text-white"
                }`
              }
            >
              {item.accent ? (
                <span className="brand-gradient font-semibold">{item.label}</span>
              ) : (
                item.label
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8">
          <StatusPill />
        </div>
      </aside>

      <main className="space-y-4">
        <header className="panel flex items-center justify-between p-4">
          <h1 className="brand-gradient text-xl font-semibold">Creator Ops Portal</h1>
          <a className="btn-primary text-sm" href="/api/health" target="_blank" rel="noreferrer">
            View API JSON
          </a>
        </header>

        <section className="card">
          <Routes>
            <Route index element={<Chat />} />
            {legacyRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            <Route path="*" element={<div className="p-6 text-sm text-neutral-400">Not found</div>} />
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
