import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

// Core application pages
import Agents from "./pages/Agents.jsx";
import Backroad from "./pages/Backroad.jsx";
import Canvas from "./pages/Canvas.jsx";
import Chat from "./pages/Chat.jsx";
import CodexPromptPage from "./pages/CodexPrompt.jsx";
import CreatorLightpath from "./pages/CreatorLightpath.jsx";
import Desktop from "./pages/Desktop.jsx";
import Editor from "./pages/Editor.jsx";
import BootSequence from "./pages/BootSequence.jsx";
import InfinityMath from "./pages/InfinityMath.jsx";
import Lucidia from "./pages/Lucidia.jsx";
import Monitoring from "./pages/Monitoring.jsx";
import NotFound from "./pages/NotFound.jsx";
import QuantumConsciousness from "./pages/QuantumConsciousness.jsx";
import RoadView from "./pages/RoadView.jsx";
import StatusPage from "./pages/StatusPage.jsx";
import Subscribe from "./pages/Subscribe.jsx";
import Terminal from "./pages/Terminal.jsx";

// Laboratory experiences
import AStarLab from "./pages/AStarLab.jsx";
import AutoDiffLab from "./pages/AutoDiffLab.jsx";
import BeliefPropagationLab from "./pages/BeliefPropagationLab.jsx";
import BeltramiTorusLab from "./pages/BeltramiTorusLab.jsx";
import BezierBSplineLab from "./pages/BezierBSplineLab.jsx";
import BezierShadedSurfaceLab from "./pages/BezierShadedSurfaceLab.jsx";
import BezierSurfaceLab from "./pages/BezierSurfaceLab.jsx";
import BifurcationLab from "./pages/BifurcationLab.jsx";
import BlueNoiseTSPLab from "./pages/BlueNoiseTSPLab.jsx";
import BrushfirePathLab from "./pages/BrushfirePathLab.jsx";
import CahnHilliardLab from "./pages/CahnHilliardLab.jsx";
import CatMapLab from "./pages/CatMapLab.jsx";
import CircleInversionLab from "./pages/CircleInversionLab.jsx";
import ClusteringCompareLab from "./pages/ClusteringCompareLab.jsx";
import ComplexBarycentricLab from "./pages/ComplexBarycentricLab.jsx";
import ComplexPotentialsLab from "./pages/ComplexPotentialsLab.jsx";
import ConformalGridLab from "./pages/ConformalGridLab.jsx";
import ContinuedFractionsLab from "./pages/ContinuedFractionsLab.jsx";
import DLALab from "./pages/DLALab.jsx";
import DiffusionMapsLab from "./pages/DiffusionMapsLab.jsx";
import DrumWaveLab from "./pages/DrumWaveLab.jsx";
import EigenmapsLab from "./pages/EigenmapsLab.jsx";
import EikonalLab from "./pages/EikonalLab.jsx";
import EikonalPathLab from "./pages/EikonalPathLab.jsx";
import EllipsoidGeodesicLab from "./pages/EllipsoidGeodesicLab.jsx";
import FastMarchTreeLab from "./pages/FastMarchTreeLab.jsx";
import FourierLab from "./pages/FourierLab.jsx";
import FourierPainterLab from "./pages/FourierPainterLab.jsx";
import GrayScottGalleryLab from "./pages/GrayScottGalleryLab.jsx";
import HilbertMortonLab from "./pages/HilbertMortonLab.jsx";
import HungarianLab from "./pages/HungarianLab.jsx";
import Ising2DLab from "./pages/Ising2DLab.jsx";
import IsingMaxCutLab from "./pages/IsingMaxCutLab.jsx";
import Kalman2DTrackerLab from "./pages/Kalman2DTrackerLab.jsx";
import KernelPCALab from "./pages/KernelPCALab.jsx";
import LaplaceConductorsLab from "./pages/LaplaceConductorsLab.jsx";
import LSystemLab from "./pages/LSystemLab.jsx";
import MarchingSquaresLab from "./pages/MarchingSquaresLab.jsx";
import MaxFlowLab from "./pages/MaxFlowLab.jsx";
import MinimalSurfaceLab from "./pages/MinimalSurfaceLab.jsx";
import NBodyLab from "./pages/NBodyLab.jsx";
import OTLab from "./pages/OTLab.jsx";
import OptimalTransportLab from "./pages/OptimalTransportLab.jsx";
import OULab from "./pages/OULab.jsx";
import PCALab from "./pages/PCALab.jsx";
import PDELiveLab from "./pages/PDELiveLab.jsx";
import PendulumLab from "./pages/PendulumLab.jsx";
import PenroseToyLab from "./pages/PenroseToyLab.jsx";
import PerlinTerrainLab from "./pages/PerlinTerrainLab.jsx";
import PoissonBlendLab from "./pages/PoissonBlendLab.jsx";
import PoissonBoltzmannLab from "./pages/PoissonBoltzmannLab.jsx";
import PoissonDiskLab from "./pages/PoissonDiskLab.jsx";
import PoincarePendulumLab from "./pages/PoincarePendulumLab.jsx";
import PowerDiagramLab from "./pages/PowerDiagramLab.jsx";
import PowerJuliaLab from "./pages/PowerJuliaLab.jsx";
import PowerLloydLab from "./pages/PowerLloydLab.jsx";
import PrimeGapsLab from "./pages/PrimeGapsLab.jsx";
import QuasiConformalEggLab from "./pages/QuasiConformalEggLab.jsx";
import QuatJuliaLab from "./pages/QuatJuliaLab.jsx";
import QuaternionRotLab from "./pages/QuaternionRotLab.jsx";
import RansacPlane3DLab from "./pages/RansacPlane3DLab.jsx";
import RidgeRegressionLab from "./pages/RidgeRegressionLab.jsx";
import RiemannMappingToy from "./pages/RiemannMappingToy.jsx";
import RRTSmoothLab from "./pages/RRTSmoothLab.jsx";
import RRTStarLab from "./pages/RRTStarLab.jsx";
import RSAToyLab from "./pages/RSAToyLab.jsx";
import SIRLab from "./pages/SIRLab.jsx";
import SpectralClusteringLab from "./pages/SpectralClusteringLab.jsx";
import SpectralGraphLab from "./pages/SpectralGraphLab.jsx";
import SpectralPoissonLab from "./pages/SpectralPoissonLab.jsx";
import StableFluidsLab from "./pages/StableFluidsLab.jsx";
import TSPLab from "./pages/TSPLab.jsx";
import VoronoiLloydLab from "./pages/VoronoiLloydLab.jsx";
import VorticityStreamLab from "./pages/VorticityStreamLab.jsx";
import WaveletLab from "./pages/WaveletLab.jsx";

const NAV_LINKS = [
  { to: "/chat", label: "Chat" },
  { to: "/canvas", label: "Canvas" },
  { to: "/editor", label: "Editor" },
  { to: "/terminal", label: "Terminal" },
  { to: "/boot", label: "Boot Sequence" },
  { to: "/roadview", label: "RoadView" },
  { to: "/backroad", label: "Backroad" },
  { to: "/agents", label: "Agents" },
  { to: "/subscribe", label: "Subscribe" },
  { to: "/creator-lightpath", label: "Creator lightpath" },
  { to: "/lucidia", label: "Lucidia" },
  { to: "/math", label: "Infinity Math", accent: true },
  { to: "/monitoring", label: "Monitoring" },
  { to: "/quantum-consciousness", label: "Quantum Consciousness" }
];

const PRIMARY_ROUTE_COMPONENTS = {
  agents: Agents,
  backroad: Backroad,
  canvas: Canvas,
  chat: Chat,
  "creator-lightpath": CreatorLightpath,
  editor: Editor,
  boot: BootSequence,
  lucidia: Lucidia,
  math: InfinityMath,
  monitoring: Monitoring,
  roadview: RoadView,
  status: StatusPage,
  subscribe: Subscribe,
  terminal: Terminal
};

const LAB_ROUTE_COMPONENTS = {
  astar: AStarLab,
  autodiff: AutoDiffLab,
  belief: BeliefPropagationLab,
  beltrami: BeltramiTorusLab,
  "bezier-lit": BezierShadedSurfaceLab,
  bezier3d: BezierSurfaceLab,
  bifurcate: BifurcationLab,
  blend: PoissonBlendLab,
  "blue-tsp": BlueNoiseTSPLab,
  brushfire: BrushfirePathLab,
  cahn: CahnHilliardLab,
  catmap: CatMapLab,
  curves: BezierBSplineLab,
  diffmaps: DiffusionMapsLab,
  dla: DLALab,
  drum: DrumWaveLab,
  eigenmaps: EigenmapsLab,
  eikonal: EikonalLab,
  "fmm-tree": FastMarchTreeLab,
  fourier: FourierLab,
  geo: EikonalPathLab,
  "gs-gallery": GrayScottGalleryLab,
  hilbert: HilbertMortonLab,
  hungarian: HungarianLab,
  implicit: MarchingSquaresLab,
  invert: CircleInversionLab,
  ising: Ising2DLab,
  "kf-2d": Kalman2DTrackerLab,
  kpca: KernelPCALab,
  laplace: LaplaceConductorsLab,
  lsys: LSystemLab,
  minimal: MinimalSurfaceLab,
  nbody: NBodyLab,
  ot: OTLab,
  "ot-1d": OptimalTransportLab,
  ou: OULab,
  pb: PoissonBoltzmannLab,
  pca: PCALab,
  pde: PDELiveLab,
  penrose: PenroseToyLab,
  pendulum: PendulumLab,
  poisson: SpectralPoissonLab,
  poisson2: PoissonDiskLab,
  poincare: PoincarePendulumLab,
  power: PowerDiagramLab,
  "power-lloyd": PowerLloydLab,
  potentials: ComplexPotentialsLab,
  primes: PrimeGapsLab,
  pzoo: PowerJuliaLab,
  qjulia: QuatJuliaLab,
  quat: QuaternionRotLab,
  "qc-egg": QuasiConformalEggLab,
  ridge: RidgeRegressionLab,
  riemann: RiemannMappingToy,
  rrtstar: RRTStarLab,
  "rrt-smooth": RRTSmoothLab,
  rsa: RSAToyLab,
  sir: SIRLab,
  spec: SpectralClusteringLab,
  spectral: SpectralGraphLab,
  terrain: PerlinTerrainLab,
  tsp: TSPLab,
  vor: VoronoiLloydLab,
  vorticity: VorticityStreamLab,
  wavelet: WaveletLab
};

const FEATURE_ROUTES = [
  { path: "chat", label: "Chat", component: Chat },
  { path: "canvas", label: "Canvas", component: Canvas },
  { path: "editor", label: "Editor", component: Editor },
  { path: "terminal", label: "Terminal", component: Terminal },
  { path: "boot", label: "Boot Sequence", component: BootSequence },
  { path: "roadview", label: "RoadView", component: RoadView },
  { path: "backroad", label: "Backroad", component: Backroad },
  { path: "agents", label: "Agents", component: Agents },
  { path: "subscribe", label: "Subscribe", component: Subscribe },
  { path: "creator-lightpath", label: "Creator lightpath", component: CreatorLightpath },
  { path: "lucidia", label: "Lucidia", component: Lucidia },
  { path: "math", label: "Infinity Math", component: InfinityMath, accent: true },
  { path: "status", label: "Status", component: StatusPage }
];

const LAB_ROUTES = [
  { path: "ot", label: "Optimal Transport Lab", component: OptimalTransportLab },
  { path: "bifurcate", label: "Bifurcation Lab", component: BifurcationLab },
  { path: "cfrac", label: "Continued Fractions Lab", component: ContinuedFractionsLab },
  { path: "qjulia", label: "Quaternion Julia Lab", component: QuatJuliaLab },
  { path: "fluids", label: "Stable Fluids Lab", component: StableFluidsLab },
  { path: "autodiff", label: "AutoDiff Lab", component: AutoDiffLab },
  { path: "conformal", label: "Conformal Grid Lab", component: ConformalGridLab },
  { path: "eikonal", label: "Eikonal Lab", component: EikonalLab },
  { path: "poisson2", label: "Poisson Disk Lab", component: PoissonDiskLab },
  { path: "lsys", label: "L-System Lab", component: LSystemLab },
  { path: "minimal", label: "Minimal Surface Lab", component: MinimalSurfaceLab },
  { path: "eigenmaps", label: "Eigenmaps Lab", component: EigenmapsLab },
  { path: "blend", label: "Poisson Blend Lab", component: PoissonBlendLab },
  { path: "nbody", label: "N-Body Lab", component: NBodyLab },
  { path: "wavelet", label: "Wavelet Lab", component: WaveletLab },
  { path: "pb", label: "Poisson-Boltzmann Lab", component: PoissonBoltzmannLab },
  { path: "ridge", label: "Ridge Regression Lab", component: RidgeRegressionLab },
  { path: "kpca", label: "Kernel PCA Lab", component: KernelPCALab },
  { path: "brushfire", label: "Brushfire Path Lab", component: BrushfirePathLab },
  { path: "blue-tsp", label: "Blue Noise TSP Lab", component: BlueNoiseTSPLab },
  { path: "bezier-lit", label: "Bezier Shaded Surface Lab", component: BezierShadedSurfaceLab },
  { path: "kf-2d", label: "Kalman 2D Tracker Lab", component: Kalman2DTrackerLab },
  { path: "vorticity", label: "Vorticity Stream Lab", component: VorticityStreamLab },
  { path: "ising", label: "Ising 2D Lab", component: Ising2DLab },
  { path: "pca", label: "PCA Lab", component: PCALab },
  { path: "rsa", label: "RSA Toy Lab", component: RSAToyLab },
  { path: "maxflow", label: "Max Flow Lab", component: MaxFlowLab },
  { path: "bezier3d", label: "Bezier Surface Lab", component: BezierSurfaceLab },
  { path: "cluster2", label: "Clustering Compare Lab", component: ClusteringCompareLab },
  { path: "implicit", label: "Marching Squares Lab", component: MarchingSquaresLab },
  { path: "rrtstar", label: "RRT* Lab", component: RRTStarLab },
  { path: "epicycles", label: "Fourier Painter Lab", component: FourierPainterLab },
  { path: "hilbert", label: "Hilbert Morton Lab", component: HilbertMortonLab },
  { path: "maxcut", label: "Ising Max-Cut Lab", component: IsingMaxCutLab },
  { path: "drum", label: "Drum Wave Lab", component: DrumWaveLab },
  { path: "pendulum", label: "Pendulum Lab", component: PendulumLab },
  { path: "pzoo", label: "Power Julia Lab", component: PowerJuliaLab },
  { path: "penrose", label: "Penrose Toy Lab", component: PenroseToyLab },
  { path: "dla", label: "Diffusion Limited Aggregation", component: DLALab },
  { path: "sir", label: "SIR Lab", component: SIRLab },
  { path: "curves", label: "Bezier & B-Spline Lab", component: BezierBSplineLab },
  { path: "spec", label: "Spectral Clustering Lab", component: SpectralClusteringLab },
  { path: "beltrami", label: "Beltrami Torus Lab", component: BeltramiTorusLab },
  { path: "poisson", label: "Spectral Poisson Lab", component: SpectralPoissonLab },
  { path: "ellipsoid", label: "Ellipsoid Geodesic Lab", component: EllipsoidGeodesicLab },
  { path: "qc-egg", label: "Quasi-Conformal Egg Lab", component: QuasiConformalEggLab },
  { path: "fmm-tree", label: "Fast March Tree Lab", component: FastMarchTreeLab },
  { path: "hungarian", label: "Hungarian Lab", component: HungarianLab },
  { path: "quat", label: "Quaternion Rotation Lab", component: QuaternionRotLab },
  { path: "bary", label: "Complex Barycentric Lab", component: ComplexBarycentricLab },
  { path: "astar", label: "A* Lab", component: AStarLab },
  { path: "tsp", label: "TSP Lab", component: TSPLab },
  { path: "gs-gallery", label: "Gray-Scott Gallery", component: GrayScottGalleryLab },
  { path: "plane3d", label: "RANSAC Plane 3D Lab", component: RansacPlane3DLab }
];

const QUICK_LINKS = [
  ...FEATURE_ROUTES,
  { path: "quantum-consciousness", label: "Quantum Consciousness", component: QuantumConsciousness }
];

const navLinkClassName = ({ isActive }) =>
  [
    "nav-link",
    "rounded-lg px-3 py-2 text-sm transition",
    isActive ? "bg-white/10 text-white" : "text-slate-200/80 hover:text-white"
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

        const primary = await fetchFn(path, { cache: "no-store" });
        const primaryText = await primary.text();
        let ok = primary.ok;
        let info = "";

        try {
          const json = JSON.parse(primaryText);
          info = `${json.status || "ok"}${json.time ? ` • ${json.time}` : ""}`;
        } catch {
          info = "";
        }

        if (!ok) {
          const fallback = await fetch(path, { cache: "no-store" });
          const fallbackText = await fallback.text();
          ok = fallback.ok;
          try {
            const json = JSON.parse(fallbackText);
            info = `${json.status || "ok"}${json.time ? ` • ${json.time}` : ""}`;
          } catch {
            info = "";
          }
        }

        return { ok, info };
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

  return (
    <span className={`text-xs uppercase tracking-wide ${tone}`}>
      {info ? `${label} — ${info}` : label}
    </span>
  );
}

function CardLink({ path, label, accent }) {
  return (
    <NavLink
      to={`/${path}`}
      className="card-link block rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/10"
    >
      {accent ? (
        <span
          className="mr-2 inline-block font-semibold"
          style={{
            background: "linear-gradient(90deg,#FF4FD8,#0096FF,#FDBA2D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          ∞
        </span>
      ) : null}
      {label}
    </NavLink>
  );
}

function LegacyApp() {
  return (
    <div className="min-h-screen grid gap-4 p-4 md:grid-cols-[240px_1fr]">
      <aside className="sidebar rounded-xl bg-slate-900/60 p-4">
        <div className="brand-logo text-2xl font-semibold text-white">BlackRoad.io</div>
        <nav className="mt-6 flex flex-col gap-2">
          {NAV_LINKS.map(({ to, label, accent }) => (
            <NavLink key={to} className={navLinkClassName} to={to} end={to === "/chat"}>
              {accent ? (
                <span
                  className="mr-1 font-semibold"
                  style={{
                    background: "linear-gradient(90deg,#FF4FD8,#0096FF,#FDBA2D)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  ∞
                </span>
              ) : null}
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8">
          <StatusPill />
        </div>
      </aside>

      <main className="space-y-4">
        <header className="panel flex items-center justify-between rounded-xl bg-slate-900/60 p-4">
          <h1 className="brand-gradient text-xl font-semibold">Creator Ops Portal</h1>
          <a className="btn-primary text-sm" href="/api/health" rel="noreferrer" target="_blank">
            View API JSON
          </a>
        </header>

        <section className="panel rounded-xl bg-slate-900/60 p-4">
          <h2 className="mb-3 text-lg font-semibold text-white">Quick links</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map(({ path, label, accent }) => (
              <CardLink key={path} path={path} label={label} accent={accent} />
            ))}
          </div>
        </section>

        <section className="panel rounded-xl bg-slate-900/60 p-4">
          <h2 className="mb-3 text-lg font-semibold text-white">Labs</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_ROUTES.map(({ path, label }) => (
              <CardLink key={path} path={path} label={label} />
            ))}
          </div>
        </section>

        <section className="panel rounded-xl bg-slate-900/60 p-4">
          <Routes>
            <Route index element={<Chat />} />
            {Object.entries(PRIMARY_ROUTE_COMPONENTS).map(([path, Component]) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            {Object.entries(LAB_ROUTE_COMPONENTS).map(([path, Component]) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            <Route path="codex/:slug" element={<CodexPromptPage />} />
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
