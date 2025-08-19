const links = [
  { to: '/', label: 'Home' },
  { to: '/docs', label: 'Docs' },
  { to: '/status', label: 'Status' },
  { to: '/snapshot', label: 'Snapshot' },
  { to: '/portal', label: 'Portal' },
  { to: '/playground', label: 'Playground' },
  { to: '/contact', label: 'Contact' },
  { to: '/tutorials', label: 'Tutorials' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/changelog', label: 'Changelog' },
  { to: '/blog', label: 'Blog' },
  { to: '/math', label: 'MathLab' },
  { to: '/deploys', label: 'Deploys' },
  { to: '/metrics', label: 'Metrics' },
  { to: '/experiments', label: 'Experiments' },
  { to: '/news', label: 'News' },
  { to: '/deploys', label: 'Deploys' },
  { to: '/inbox', label: 'Inbox' },
  { to: '/deploys', label: 'Deploys' },
];

function navigate(e, to) {
  e.preventDefault();
  window.history.pushState({}, '', to);
  window.dispatchEvent(new Event('popstate'));
}

export default function Layout({ children }) {
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { telemetryInit } from '../lib/telemetry.ts'

export default function Layout({ children }) {
  useEffect(() => { telemetryInit() }, [])
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <header className="py-8">
          <h1 className="text-4xl font-bold">blackroad.io</h1>
          <nav className="mt-4 flex flex-wrap gap-4">
            {links.map((l) => (
              <a key={l.to} href={l.to} onClick={(e) => navigate(e, l.to)} className="underline">
                {l.label}
              </a>
            ))}
          </nav>
        </header>
        {children}
        <footer className="opacity-70 mt-16">© {new Date().getFullYear()} blackroad</footer>
      </div>
    </main>
  );
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { t, setLocale, localeFromPath, withPrefix } from '../lib/i18n.ts'
import { useEffect } from 'react'
import { telemetryInit } from '../lib/telemetry.ts'

function Tab({ to, children }) {
  const loc = useLocation()
  const lang = localeFromPath(loc.pathname)
  const href = withPrefix(to, lang)
  return (
    <NavLink to={href} className={({isActive})=>`px-2 py-1 rounded ${isActive?'bg-white/10':'hover:bg-white/5'}`}>
      {children}
    </NavLink>
  )
}

export default function Layout() {
  const loc = useLocation()
  const lang = localeFromPath(loc.pathname)
  setLocale(lang)
  useEffect(() => { telemetryInit() }, [])
  document.title = t('title')
  const homeHref = withPrefix('/', lang)
  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto p-6">
          <header className="py-6 flex items-center justify-between gap-4">
            <Link to={homeHref} className="text-2xl font-bold">{t('title')}</Link>
            <nav className="flex gap-2 text-sm items-center">
              <Tab to="/">{t('navHome')}</Tab>
              <Tab to="/docs">{t('navDocs')}</Tab>
              <Tab to="/status">{t('navStatus')}</Tab>
              <Tab to="/snapshot">{t('navSnapshot')}</Tab>
              <Tab to="/portal">{t('navPortal')}</Tab>
              <Tab to="/playground">{t('navPlayground')}</Tab>
              <Tab to="/tutorials">{t('navTutorials')}</Tab>
              <Tab to="/roadmap">{t('navRoadmap')}</Tab>
              <Tab to="/changelog">{t('navChangelog')}</Tab>
              <Tab to="/blog">{t('navBlog')}</Tab>
              <Tab to="/contact">{t('navContact')}</Tab>
              <LanguageSwitcher />
            </nav>
          </header>
          <Outlet />
          <footer className="opacity-70 mt-16 text-sm">{t('footer', { year: new Date().getFullYear() })}</footer>
        </div>
      </main>
    </ErrorBoundary>
          <p className="opacity-80 mt-2">Fast lane to shipping. Flag-aware, bot-powered workflows.</p>
        </header>
        {children || <Outlet />}
        <footer className="opacity-70 mt-16">© {new Date().getFullYear()} blackroad</footer>
      </div>
    </main>
  )
}
