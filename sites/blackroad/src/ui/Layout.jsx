import { Outlet, Link, NavLink } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary.jsx';
export default function Layout() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto p-6">
          <header className="py-6 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              blackroad.io
            </Link>
            <nav className="flex gap-4 text-sm">
              <Tab to="/">Home</Tab>
              <Tab to="/docs">Docs</Tab>
              <Tab to="/status">Status</Tab>
              <Tab to="/snapshot">Snapshot</Tab>
              <Tab to="/portal">Co-Coding</Tab>
              <Tab to="/playground">Playground</Tab>
              <Tab to="/tutorials">Tutorials</Tab>
              <Tab to="/roadmap">Roadmap</Tab>
              <Tab to="/changelog">Changelog</Tab>
              <Tab to="/blog">Blog</Tab>
              <Tab to="/contact">Contact</Tab>
            </nav>
          </header>
          <Outlet />
          <footer className="opacity-70 mt-16 text-sm">
            © {new Date().getFullYear()} blackroad
          </footer>
        </div>
      </main>
    </ErrorBoundary>
  );
}
function Tab({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-2 py-1 rounded ${isActive ? 'bg-white/10' : 'hover:bg白/5'.replace('白', 'white')}`
      }
    >
      {children}
    </NavLink>
  );
}
