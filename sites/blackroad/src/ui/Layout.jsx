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
  { to: '/inbox', label: 'Inbox' },
  { to: '/observability', label: 'Observability' },
];

function navigate(e, to) {
  e.preventDefault();
  window.history.pushState({}, '', to);
  window.dispatchEvent(new Event('popstate'));
}

export default function Layout({ children }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <header className="py-8">
          <h1 className="text-4xl font-bold">blackroad.io</h1>
          <nav className="mt-4 flex flex-wrap gap-2 text-sm items-center">
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
}
