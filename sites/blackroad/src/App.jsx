import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

import AStarLab from "./pages/AStarLab.jsx";
import Agents from "./pages/Agents.jsx";
import AutoDiffLab from "./pages/AutoDiffLab.jsx";
import Backroad from "./pages/Backroad.jsx";
import BeltramiTorusLab from "./pages/BeltramiTorusLab.jsx";
import BezierBSplineLab from "./pages/BezierBSplineLab.jsx";
import BezierShadedSurfaceLab from "./pages/BezierShadedSurfaceLab.jsx";
import BezierSurfaceLab from "./pages/BezierSurfaceLab.jsx";
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
import DLALab from "./pages/DLALab.jsx";
import Desktop from "./pages/Desktop.jsx";
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
import PenroseToyLab from "./pages/PenroseToyLab.jsx";
import PendulumLab from "./pages/PendulumLab.jsx";
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

const PRIMARY_PAGES = [
  { path: "chat", label: "Chat", component: Chat },
  { path: "canvas", label: "Canvas", component: Canvas },
  { path: "editor", label: "Editor", component: Editor },
  { path: "terminal", label: "Terminal", component: Terminal },
  { path: "roadview", label: "RoadView", component: RoadView },
  { path: "backroad", label: "Backroad", component: Backroad },
  { path: "agents", label: "Agents", component: Agents },
  { path: "subscribe", label: "Subscribe", component: Subscribe },
  { path: "creator-lightpath", label: "Creator lightpath", component: CreatorLightpath },
  { path: "lucidia", label: "Lucidia", component: Lucidia },
  { path: "math", label: "Infinity Math", component: InfinityMath, accent: true },
  { path: "status", label: "Status", component: StatusPage },
];

const LAB_ROUTES = [
  { path: "ot", component: OptimalTransportLab },
  { path: "bifurcate", component: BifurcationLab },
  { path: "cfrac", component: ContinuedFractionsLab },
  { path: "qjulia", component: QuatJuliaLab },
  { path: "fluids", component: StableFluidsLab },
  { path: "autodiff", component: AutoDiffLab },
  { path: "conformal", component: ConformalGridLab },
  { path: "eikonal", component: EikonalLab },
  { path: "poisson2", component: PoissonDiskLab },
  { path: "lsys", component: LSystemLab },
  { path: "minimal", component: MinimalSurfaceLab },
  { path: "eigenmaps", component: EigenmapsLab },
  { path: "blend", component: PoissonBlendLab },
  { path: "nbody", component: NBodyLab },
  { path: "wavelet", component: WaveletLab },
  { path: "pb", component: PoissonBoltzmannLab },
  { path: "ridge", component: RidgeRegressionLab },
  { path: "kpca", component: KernelPCALab },
  { path: "brushfire", component: BrushfirePathLab },
  { path: "blue-tsp", component: BlueNoiseTSPLab },
  { path: "bezier-lit", component: BezierShadedSurfaceLab },
  { path: "kf-2d", component: Kalman2DTrackerLab },
  { path: "vorticity", component: VorticityStreamLab },
  { path: "ising", component: Ising2DLab },
  { path: "pca", component: PCALab },
  { path: "rsa", component: RSAToyLab },
  { path: "maxflow", component: MaxFlowLab },
  { path: "bezier3d", component: BezierSurfaceLab },
  { path: "cluster2", component: ClusteringCompareLab },
  { path: "implicit", component: MarchingSquaresLab },
  { path: "rrtstar", component: RRTStarLab },
  { path: "epicycles", component: FourierPainterLab },
  { path: "hilbert", component: HilbertMortonLab },
  { path: "maxcut", component: IsingMaxCutLab },
  { path: "drum", component: DrumWaveLab },
  { path: "pendulum", component: PendulumLab },
  { path: "pzoo", component: PowerJuliaLab },
  { path: "penrose", component: PenroseToyLab },
  { path: "dla", component: DLALab },
  { path: "sir", component: SIRLab },
  { path: "curves", component: BezierBSplineLab },
  { path: "spec", component: SpectralClusteringLab },
  { path: "beltrami", component: BeltramiTorusLab },
  { path: "poisson", component: SpectralPoissonLab },
  { path: "ellipsoid", component: EllipsoidGeodesicLab },
  { path: "qc-egg", component: QuasiConformalEggLab },
  { path: "fmm-tree", component: FastMarchTreeLab },
  { path: "hungarian", component: HungarianLab },
  { path: "quat", component: QuaternionRotLab },
  { path: "bary", component: ComplexBarycentricLab },
  { path: "astar", component: AStarLab },
  { path: "tsp", component: TSPLab },
  { path: "gs-gallery", component: GrayScottGalleryLab },
  { path: "plane3d", component: RansacPlane3DLab },
];

const NAV_LINKS = [
  ...PRIMARY_PAGES,
  { to: "/quantum-consciousness", label: "Quantum Consciousness" },
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
          const statusText = json.status ?? "ok";
          const time = json.time ? ` • ${json.time}` : "";
          info = `${statusText}${time}`;
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
  return (
    <div className="min-h-screen grid gap-4 p-4 md:grid-cols-[240px_1fr]">
      <aside className="sidebar p-4">
        <div className="brand-logo text-2xl font-semibold">BlackRoad.io</div>
        <nav className="mt-6 flex flex-col gap-2">
          {NAV_LINKS.map(({ path, to, label, accent }) => {
            const destination = to ?? `/${path}`;
            return (
              <NavLink key={destination} className={navLinkClassName} to={destination} end={Boolean(to)}>
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
            );
          })}
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
            {PRIMARY_PAGES.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            {LAB_ROUTES.map(({ path, component: Component }) => (
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
