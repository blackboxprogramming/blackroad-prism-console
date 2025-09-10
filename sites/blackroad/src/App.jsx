import { NavLink, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Chat from './pages/Chat.jsx';
import Canvas from './pages/Canvas.jsx';
import Editor from './pages/Editor.jsx';
import Terminal from './pages/Terminal.jsx';
import RoadView from './pages/RoadView.jsx';
import Backroad from './pages/Backroad.jsx';
import Subscribe from './pages/Subscribe.jsx';
import Lucidia from './pages/Lucidia.jsx';
import InfinityMath from './pages/InfinityMath.jsx';
import Agents from './pages/Agents.jsx';
import Desktop from './pages/Desktop.jsx';
import QuantumConsciousness from './pages/QuantumConsciousness.jsx';
import OptimalTransportLab from './pages/OptimalTransportLab.jsx';
import BifurcationLab from './pages/BifurcationLab.jsx';
import ContinuedFractionsLab from './pages/ContinuedFractionsLab.jsx';
import QuatJuliaLab from './pages/QuatJuliaLab.jsx';
import StableFluidsLab from './pages/StableFluidsLab.jsx';
import AutoDiffLab from './pages/AutoDiffLab.jsx';
import ConformalGridLab from './pages/ConformalGridLab.jsx';
import EikonalLab from './pages/EikonalLab.jsx';
import PoissonDiskLab from './pages/PoissonDiskLab.jsx';
import LSystemLab from './pages/LSystemLab.jsx';
import MinimalSurfaceLab from './pages/MinimalSurfaceLab.jsx';
import EigenmapsLab from './pages/EigenmapsLab.jsx';
import PoissonBlendLab from './pages/PoissonBlendLab.jsx';
import NBodyLab from './pages/NBodyLab.jsx';
import WaveletLab from './pages/WaveletLab.jsx';
import PoissonBoltzmannLab from './pages/PoissonBoltzmannLab.jsx';
import RidgeRegressionLab from './pages/RidgeRegressionLab.jsx';
import KernelPCALab from './pages/KernelPCALab.jsx';
import BrushfirePathLab from './pages/BrushfirePathLab.jsx';
import BlueNoiseTSPLab from './pages/BlueNoiseTSPLab.jsx';
import BezierShadedSurfaceLab from './pages/BezierShadedSurfaceLab.jsx';
import Kalman2DTrackerLab from './pages/Kalman2DTrackerLab.jsx';
import VorticityStreamLab from './pages/VorticityStreamLab.jsx';

function useApiHealth() {
  const [state, setState] = useState({ ok: null, info: '' });
  useEffect(() => {
    let dead = false;
    (async () => {
      const probe = async (path) => {
        try {
          const r = await fetch(path, { cache: 'no-store' });
          const t = await r.text();
          let info = '';
          try {
            const j = JSON.parse(t);
            info = `${j.status || 'ok'} • ${j.time || ''}`;
          } catch {}
          return { ok: r.ok, info };
        } catch {
          return { ok: false, info: '' };
        }
      };
      let res = await probe('/api/health');
      if (!res.ok) res = await probe('/api/health.json');
      if (!dead) setState(res);
    })();
    return () => {
      dead = true;
    };
  }, []);
  return state;
}

function StatusPill() {
  const { ok, info } = useApiHealth();
  const tone =
    ok == null ? 'opacity-60' : ok ? 'text-green-400' : 'text-red-400';
  const label = ok == null ? 'Checking API…' : ok ? 'API healthy' : 'API error';
  return (
    <span className={`text-sm ${tone}`}>
      {label}
      {info ? ` — ${info}` : ''}
    </span>
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

function LegacyApp() {
  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr] gap-4 p-4">
      <aside className="sidebar p-3">
        <div className="brand-logo text-2xl mb-4">BlackRoad.io</div>
        <nav className="flex flex-col gap-2">
          <NavLink className="nav-link" to="/chat">
            Chat
          </NavLink>
          <NavLink className="nav-link" to="/canvas">
            Canvas
          </NavLink>
          <NavLink className="nav-link" to="/editor">
            Editor
          </NavLink>
          <NavLink className="nav-link" to="/terminal">
            Terminal
          </NavLink>
          <NavLink className="nav-link" to="/roadview">
            RoadView
          </NavLink>
          <NavLink className="nav-link" to="/backroad">
            Backroad
          </NavLink>
          <NavLink className="nav-link" to="/agents">
            Agents
          </NavLink>
          <NavLink className="nav-link" to="/subscribe">
            Subscribe
          </NavLink>
          <NavLink className="nav-link" to="/lucidia">
            Lucidia
          </NavLink>
          <NavLink className="nav-link" to="/math">
            <span
              style={{
                background: 'linear-gradient(90deg,#FF4FD8,#0096FF,#FDBA2D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ∞
            </span>{' '}
            Infinity Math
          </NavLink>
        </nav>
        <div className="mt-6 text-xs text-neutral-400">
          <StatusPill />
        </div>
      </aside>

      <main className="space-y-4">
        <header className="panel p-4 flex items-center justify-between">
          <h1 className="brand-gradient text-xl font-semibold">
            Co-coding Portal
          </h1>
          <a
            className="btn-primary"
            href="/api/health"
            target="_blank"
            rel="noreferrer"
          >
            API Health
          </a>
        </header>

        <section className="card">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/canvas" element={<Canvas />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/roadview" element={<RoadView />} />
            <Route path="/backroad" element={<Backroad />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/lucidia" element={<Lucidia />} />
            <Route path="/math" element={<InfinityMath />} />
            <Route path="/ot" element={<OptimalTransportLab />} />
            <Route path="/bifurcate" element={<BifurcationLab />} />
            <Route path="/cfrac" element={<ContinuedFractionsLab />} />
            <Route path="/qjulia" element={<QuatJuliaLab />} />
            <Route path="/fluids" element={<StableFluidsLab />} />
            <Route path="/autodiff" element={<AutoDiffLab />} />
            <Route path="/conformal" element={<ConformalGridLab />} />
            <Route path="/eikonal" element={<EikonalLab />} />
            <Route path="/poisson2" element={<PoissonDiskLab />} />
            <Route path="/lsys" element={<LSystemLab />} />
            <Route path="/minimal" element={<MinimalSurfaceLab />} />
            <Route path="/eigenmaps" element={<EigenmapsLab />} />
            <Route path="/blend" element={<PoissonBlendLab />} />
            <Route path="/nbody" element={<NBodyLab />} />
            <Route path="/wavelet" element={<WaveletLab />} />
            <Route path="/pb" element={<PoissonBoltzmannLab />} />
            <Route path="/ridge" element={<RidgeRegressionLab />} />
            <Route path="/kpca" element={<KernelPCALab />} />
             <Route path="/brushfire" element={<BrushfirePathLab />} />
             <Route path="/blue-tsp" element={<BlueNoiseTSPLab />} />
             <Route path="/bezier-lit" element={<BezierShadedSurfaceLab />} />
             <Route path="/kf-2d" element={<Kalman2DTrackerLab />} />
             <Route path="/vorticity" element={<VorticityStreamLab />} />
            <Route path="chat" element={<Chat />} />
            <Route path="canvas" element={<Canvas />} />
            <Route path="editor" element={<Editor />} />
            <Route path="terminal" element={<Terminal />} />
            <Route path="roadview" element={<RoadView />} />
            <Route path="backroad" element={<Backroad />} />
            <Route path="subscribe" element={<Subscribe />} />
            <Route path="lucidia" element={<Lucidia />} />
            <Route path="math" element={<InfinityMath />} />
            <Route path="ot" element={<OptimalTransportLab />} />
            <Route path="bifurcate" element={<BifurcationLab />} />
            <Route path="cfrac" element={<ContinuedFractionsLab />} />
            <Route path="qjulia" element={<QuatJuliaLab />} />
            <Route path="fluids" element={<StableFluidsLab />} />
            <Route path="autodiff" element={<AutoDiffLab />} />
            <Route path="conformal" element={<ConformalGridLab />} />
            <Route path="eikonal" element={<EikonalLab />} />
            <Route path="poisson2" element={<PoissonDiskLab />} />
            <Route path="lsys" element={<LSystemLab />} />
            <Route path="minimal" element={<MinimalSurfaceLab />} />
            <Route path="eigenmaps" element={<EigenmapsLab />} />
            <Route path="blend" element={<PoissonBlendLab />} />
            <Route path="nbody" element={<NBodyLab />} />
            <Route path="wavelet" element={<WaveletLab />} />
            <Route path="pb" element={<PoissonBoltzmannLab />} />
            <Route path="ridge" element={<RidgeRegressionLab />} />
            <Route path="kpca" element={<KernelPCALab />} />
             <Route path="brushfire" element={<BrushfirePathLab />} />
             <Route path="blue-tsp" element={<BlueNoiseTSPLab />} />
             <Route path="bezier-lit" element={<BezierShadedSurfaceLab />} />
             <Route path="kf-2d" element={<Kalman2DTrackerLab />} />
             <Route path="vorticity" element={<VorticityStreamLab />} />
             <Route path="*" element={<div>Not found</div>} />
          </Routes>
        </section>
      </main>
    </div>
  );
}
