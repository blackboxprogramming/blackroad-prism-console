import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { t, setLocale, localeFromPath, withPrefix } from '../lib/i18n.ts';
import { useEffect } from 'react';
import { telemetryInit } from '../lib/telemetry.ts';

function Tab({ to, children }) {
  const loc = useLocation();
  const lang = localeFromPath(loc.pathname);
  const href = withPrefix(to, lang);
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        `px-2 py-1 rounded ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const loc = useLocation();
  const lang = localeFromPath(loc.pathname);
  setLocale(lang);
  useEffect(() => {
    telemetryInit();
  }, []);
  document.title = t('title');
  const homeHref = withPrefix('/', lang);
  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto p-6">
          <header className="py-6 flex items-center justify-between gap-4">
            <Link to={homeHref} className="text-2xl font-bold">
              {t('title')}
            </Link>
            <nav className="flex gap-2 text-sm items-center">
              <Tab to="/">{t('navHome')}</Tab>
              <Tab to="/docs">{t('navDocs')}</Tab>
              <Tab to="/status">{t('navStatus')}</Tab>
              <Tab to="/snapshot">{t('navSnapshot')}</Tab>
              <Tab to="/portal">{t('navPortal')}</Tab>
              <Tab to="/quantum-consciousness">{t('navQuantumConsciousness')}</Tab>
              <Tab to="/playground">{t('navPlayground')}</Tab>
              <Tab to="/tutorials">{t('navTutorials')}</Tab>
              <Tab to="/roadmap">{t('navRoadmap')}</Tab>
              <Tab to="/changelog">{t('navChangelog')}</Tab>
              <Tab to="/blog">{t('navBlog')}</Tab>
              <Tab to="/contact">{t('navContact')}</Tab>
              <Tab to="/prompts">Prompts</Tab>
              <LanguageSwitcher />
            </nav>
          </header>
          <Outlet />
          <footer className="opacity-70 mt-16 text-sm">
            {t('footer', { year: new Date().getFullYear() })}
          </footer>
        </div>
      </main>
    </ErrorBoundary>
  );
}
