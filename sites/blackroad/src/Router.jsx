import { useEffect, useState } from 'react';
import Layout from './ui/Layout.jsx';
import Home from './pages/Home.jsx';
import Docs from './pages/Docs.jsx';
import StatusPage from './pages/StatusPage.jsx';
import SnapshotPage from './pages/SnapshotPage.jsx';
import Portal from './pages/Portal.jsx';
import Playground from './pages/Playground.jsx';
import Contact from './pages/Contact.jsx';
import Tutorials from './pages/Tutorials.jsx';
import Roadmap from './pages/Roadmap.jsx';
import Changelog from './pages/Changelog.jsx';
import Blog from './pages/Blog.jsx';
import Deploys from './pages/Deploys.jsx';
import MathLab from './pages/MathLab.jsx';
import UncertaintyLab from './pages/UncertaintyLab.jsx';
import GeodesicLab from './pages/GeodesicLab.jsx';
import NotFound from './pages/NotFound.jsx';

const routes = {
  '/': <Home />,
  '/docs': <Docs />,
  '/status': <StatusPage />,
  '/snapshot': <SnapshotPage />,
  '/portal': <Portal />,
  '/playground': <Playground />,
  '/contact': <Contact />,
  '/tutorials': <Tutorials />,
  '/roadmap': <Roadmap />,
  '/changelog': <Changelog />,
  '/blog': <Blog />,
  '/deploys': <Deploys />,
  '/math': <MathLab />,
  '/uncertainty': <UncertaintyLab />,
  '/geodesic': <GeodesicLab />,
};

export default function Router() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const element = routes[path] || <NotFound />;
  return <Layout>{element}</Layout>;
}
