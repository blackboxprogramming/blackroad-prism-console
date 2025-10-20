import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

import Agents from "./pages/Agents.jsx";
import AStarLab from "./pages/AStarLab.jsx";
import AutoDiffLab from "./pages/AutoDiffLab.jsx";
import Backroad from "./pages/Backroad.jsx";
import BezierBSplineLab from "./pages/BezierBSplineLab.jsx";
import BezierShadedSurfaceLab from "./pages/BezierShadedSurfaceLab.jsx";
import BezierSurfaceLab from "./pages/BezierSurfaceLab.jsx";
import BeltramiTorusLab from "./pages/BeltramiTorusLab.jsx";
import BifurcationLab from "./pages/BifurcationLab.jsx";
import BlueNoiseTSPLab from "./pages/BlueNoiseTSPLab.jsx";
import BrushfirePathLab from "./pages/BrushfirePathLab.jsx";
import Canvas from "./pages/Canvas.jsx";
import Chat from "./pages/Chat.jsx";
import ClusteringCompareLab from "./pages/ClusteringCompareLab.jsx";
import ComplexBarycentricLab from "./pages/ComplexBarycentricLab.jsx";
import ConformalGridLab from "./pages/ConformalGridLab.jsx";
import ContinuedFractionsLab from "./pages/ContinuedFractionsLab.jsx";
import CreatorLightpath from "./pages/CreatorLightpath.jsx";
import Desktop from "./pages/Desktop.jsx";
import DLALab from "./pages/DLALab.jsx";
import DrumWaveLab from "./pages/DrumWaveLab.jsx";
import Editor from "./pages/Editor.jsx";
import EigenmapsLab from "./pages/EigenmapsLab.jsx";
import EikonalLab from "./pages/EikonalLab.jsx";
import EllipsoidGeodesicLab from "./pages/EllipsoidGeodesicLab.jsx";
import FastMarchTreeLab from "./pages/FastMarchTreeLab.jsx";
import FourierPainterLab from "./pages/FourierPainterLab.jsx";
import GrayScottGalleryLab from "./pages/GrayScottGalleryLab.jsx";
import HilbertMortonLab from "./pages/HilbertMortonLab.jsx";
import HungarianLab from "./pages/HungarianLab.jsx";
import InfinityMath from "./pages/InfinityMath.jsx";
import Ising2DLab from "./pages/Ising2DLab.jsx";
import IsingMaxCutLab from "./pages/IsingMaxCutLab.jsx";
import Kalman2DTrackerLab from "./pages/Kalman2DTrackerLab.jsx";
import KernelPCALab from "./pages/KernelPCALab.jsx";
import Lucidia from "./pages/Lucidia.jsx";
import LSystemLab from "./pages/LSystemLab.jsx";
import MarchingSquaresLab from "./pages/MarchingSquaresLab.jsx";
import MaxFlowLab from "./pages/MaxFlowLab.jsx";
import MinimalSurfaceLab from "./pages/MinimalSurfaceLab.jsx";
import NBodyLab from "./pages/NBodyLab.jsx";
import NotFound from "./pages/NotFound.jsx";
import OptimalTransportLab from "./pages/OptimalTransportLab.jsx";
import PCALab from "./pages/PCALab.jsx";
import PendulumLab from "./pages/PendulumLab.jsx";
import PenroseToyLab from "./pages/PenroseToyLab.jsx";
import PoissonBlendLab from "./pages/PoissonBlendLab.jsx";
import PoissonBoltzmannLab from "./pages/PoissonBoltzmannLab.jsx";
import PoissonDiskLab from "./pages/PoissonDiskLab.jsx";
import PowerJuliaLab from "./pages/PowerJuliaLab.jsx";
import QuantumConsciousness from "./pages/QuantumConsciousness.jsx";
import QuasiConformalEggLab from "./pages/QuasiConformalEggLab.jsx";
import QuaternionRotLab from "./pages/QuaternionRotLab.jsx";
import QuatJuliaLab from "./pages/QuatJuliaLab.jsx";
import RansacPlane3DLab from "./pages/RansacPlane3DLab.jsx";
import RidgeRegressionLab from "./pages/RidgeRegressionLab.jsx";
import RoadView from "./pages/RoadView.jsx";
import RRTStarLab from "./pages/RRTStarLab.jsx";
import RSAToyLab from "./pages/RSAToyLab.jsx";
import SIRLab from "./pages/SIRLab.jsx";
import SpectralClusteringLab from "./pages/SpectralClusteringLab.jsx";
import SpectralPoissonLab from "./pages/SpectralPoissonLab.jsx";
import StableFluidsLab from "./pages/StableFluidsLab.jsx";
import StatusPage from "./pages/StatusPage.jsx";
import Subscribe from "./pages/Subscribe.jsx";
import Terminal from "./pages/Terminal.jsx";
import TSPLab from "./pages/TSPLab.jsx";
import VorticityStreamLab from "./pages/VorticityStreamLab.jsx";
import WaveletLab from "./pages/WaveletLab.jsx";

const NAV_LINKS = [
  { path: "chat", label: "Chat" },
  { path: "canvas", label: "Canvas" },
  { path: "editor", label: "Editor" },
  { path: "terminal", label: "Terminal" },
  { path: "roadview", label: "RoadView" },
  { path: "backroad", label: "Backroad" },
  { path: "agents", label: "Agents" },
  { path: "subscribe", label: "Subscribe" },
  { path: "creator-lightpath", label: "Creator lightpath" },
  { path: "lucidia", label: "Lucidia" },
  { path: "math", label: "Infinity Math", accent: true },
];

const CORE_ROUTES = [
  { path: "chat", component: Chat },
  { path: "canvas", component: Canvas },
  { path: "editor", component: Editor },
  { path: "roadview", component: RoadView },
  { path: "terminal", component: Terminal },
  { path: "backroad", component: Backroad },
  { path: "agents", component: Agents },
  { path: "subscribe", component: Subscribe },
  { path: "creator-lightpath", component: CreatorLightpath },
  { path: "lucidia", component: Lucidia },
  { path: "math", component: InfinityMath },
  { path: "status", component: StatusPage },
];

const LAB_ROUTES = [
  { path: "autodiff", component: AutoDiffLab },
  { path: "astar", component: AStarLab },
  { path: "bary", component: ComplexBarycentricLab },
  { path: "bezier3d", component: BezierSurfaceLab },
  { path: "bezier-lit", component: BezierShadedSurfaceLab },
  { path: "beltrami", component: BeltramiTorusLab },
  { path: "bifurcate", component: BifurcationLab },
  { path: "blend", component: PoissonBlendLab },
  { path: "blue-tsp", component: BlueNoiseTSPLab },
  { path: "brushfire", component: BrushfirePathLab },
  { path: "cfrac", component: ContinuedFractionsLab },
  { path: "cluster2", component: ClusteringCompareLab },
  { path: "conformal", component: ConformalGridLab },
  { path: "curves", component: BezierBSplineLab },
  { path: "dla", component: DLALab },
  { path: "drum", component: DrumWaveLab },
  { path: "eigenmaps", component: EigenmapsLab },
  { path: "eikonal", component: EikonalLab },
  { path: "ellipsoid", component: EllipsoidGeodesicLab },
  { path: "epicycles", component: FourierPainterLab },
  { path: "fluids", component: StableFluidsLab },
  { path: "fmm-tree", component: FastMarchTreeLab },
  { path: "gs-gallery", component: GrayScottGalleryLab },
  { path: "hilbert", component: HilbertMortonLab },
  { path: "hungarian", component: HungarianLab },
  { path: "kf-2d", component: Kalman2DTrackerLab },
  { path: "implicit", component: MarchingSquaresLab },
  { path: "ising", component: Ising2DLab },
  { path: "kpca", component: KernelPCALab },
  { path: "lsys", component: LSystemLab },
  { path: "maxcut", component: IsingMaxCutLab },
  { path: "maxflow", component: MaxFlowLab },
  { path: "minimal", component: MinimalSurfaceLab },
  { path: "nbody", component: NBodyLab },
  { path: "ot", component: OptimalTransportLab },
  { path: "pb", component: PoissonBoltzmannLab },
  { path: "pendulum", component: PendulumLab },
  { path: "penrose", component: PenroseToyLab },
  { path: "plane3d", component: RansacPlane3DLab },
  { path: "poisson", component: SpectralPoissonLab },
  { path: "poisson2", component: PoissonDiskLab },
  { path: "pzoo", component: PowerJuliaLab },
  { path: "qc-egg", component: QuasiConformalEggLab },
  { path: "qjulia", component: QuatJuliaLab },
  { path: "ridge", component: RidgeRegressionLab },
  { path: "rrtstar", component: RRTStarLab },
  { path: "rsa", component: RSAToyLab },
  { path: "sir", component: SIRLab },
  { path: "spec", component: SpectralClusteringLab },
  { path: "tsp", component: TSPLab },
  { path: "vorticity", component: VorticityStreamLab },
  { path: "wavelet", component: WaveletLab }
];

const navLinkClassName = ({ isActive }) =>
  [
    "nav-link",
    "rounded-lg px-3 py-2 text-sm transition",
    isActive ? "bg-white/10 text-white" : "text-slate-200/80 hover:text-white",
  ].join(" ");

function useApiHealth() {
  const [state, setState] = useState({ ok: null, info: "" });

  useEffect(() => {
    let cancelled = false;

    const probe = async (path) => {
      try {
        const fetchFn = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
        if (!fetchFn) {
          return { ok: false, info: "" };
        }
        const response = await fetchFn(path, { cache: "no-store" });
        const text = await response.text();
        let info = "";
        try {
          const json = JSON.parse(text);
          info = `${json.status || "ok"}${json.time ? ` • ${json.time}` : ""}`;
        } catch {
          info = "";
        }
        return { ok: response.ok, info };
      } catch {
        return { ok: false, info: "" };
      }
    };

    (async () => {
      let result = await probe("/api/health");
      if (!result.ok) {
        result = await probe("/api/health.json");
      }
      if (!cancelled) {
        setState(result);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function StatusPill() {
  const { ok, info } = useApiHealth();
  const tone = ok == null ? "opacity-60" : ok ? "text-green-400" : "text-red-400";
  const label = ok == null ? "Checking API…" : ok ? "API healthy" : "API error";

  return <span className={`text-xs uppercase tracking-wide ${tone}`}>{info ? `${label} — ${info}` : label}</span>;
}

function LegacyApp() {
  const allRoutes = [...CORE_ROUTES, ...LAB_ROUTES];

  return (
    <div className="min-h-screen grid gap-4 p-4 md:grid-cols-[240px_1fr]">
      <aside className="sidebar p-4">
        <div className="brand-logo text-2xl font-semibold">BlackRoad.io</div>
        <nav className="mt-6 flex flex-col gap-2">
          {NAV_LINKS.map(({ path, label, accent }) => (
            <NavLink key={path} className={navLinkClassName} to={`/${path}`}>
              {accent ? (
                <span
                  className="font-semibold"
                  style={{
                    background: "linear-gradient(90deg,#FF4FD8,#0096FF,#FDBA2D)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  ∞
                </span>
              ) : null}
              {accent ? " " : null}
              {label}
            </NavLink>
          ))}
          <NavLink className="nav-link" to="/quantum-consciousness">
            Quantum Consciousness
          </NavLink>
        </nav>
        <div className="mt-8">
          <StatusPill />
        </div>
      </aside>

      <main className="space-y-4">
        <header className="panel flex items-center justify-between p-4">
          <h1 className="brand-gradient text-xl font-semibold">Creator Ops Portal</h1>
          <a className="btn-primary text-sm" href="/api/health" rel="noreferrer" target="_blank">
            View API JSON
          </a>
        </header>

        <section className="card">
          <Routes>
            <Route index element={<Chat />} />
            {allRoutes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
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
