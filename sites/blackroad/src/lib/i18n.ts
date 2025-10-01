export type Locale = 'en' | 'es';
export const locales: Locale[] = ['en', 'es'];

const dict = {
  en: {
    title: 'blackroad.io',
    navHome: 'Home',
    navDocs: 'Docs',
    navStatus: 'Status',
    navSnapshot: 'Snapshot',
    navPortal: 'Co-Coding',
    navQuantumConsciousness: 'Quantum Consciousness',
    navPlayground: 'Playground',
    navTutorials: 'Tutorials',
    navRoadmap: 'Roadmap',
    navChangelog: 'Changelog',
    navBlog: 'Blog',
    navContact: 'Contact',
    quickCommands: 'Quick Commands',
    explore: 'Explore',
    coCodingPortal: 'Co-Coding Portal',
    docs: 'Docs',
    status: 'Status',
    snapshot: 'Snapshot',
    quantumConsciousness: 'Quantum Consciousness',
    footer: '© {year} blackroad',
    loading: 'Loading…',
    noPosts: 'No posts yet.',
    noDocs: 'No docs yet.',
  },
  es: {
    title: 'blackroad.io',
    navHome: 'Inicio',
    navDocs: 'Documentación',
    navStatus: 'Estado',
    navSnapshot: 'Instantánea',
    navPortal: 'Co-código',
    navQuantumConsciousness: 'Conciencia Cuántica',
    navPlayground: 'Laboratorio',
    navTutorials: 'Tutoriales',
    navRoadmap: 'Hoja de ruta',
    navChangelog: 'Registro de cambios',
    navBlog: 'Blog',
    navContact: 'Contacto',
    quickCommands: 'Comandos Rápidos',
    explore: 'Explorar',
    coCodingPortal: 'Portal de Co-código',
    docs: 'Documentación',
    status: 'Estado',
    snapshot: 'Instantánea',
    quantumConsciousness: 'Conciencia Cuántica',
    footer: '© {year} blackroad',
    loading: 'Cargando…',
    noPosts: 'Sin artículos por ahora.',
    noDocs: 'Sin documentos todavía.',
  },
} as const;

let _locale: Locale = 'en';
export function getLocale(): Locale {
  return _locale;
}
export function setLocale(l: Locale) {
  _locale = l;
}

export function t<K extends keyof (typeof dict)['en']>(
  key: K,
  vars?: Record<string, string | number>
) {
  const table = dict[_locale] ?? dict.en;
  const s = (table[key] ?? (dict.en as any)[key] ?? String(key)) as string;
  return vars
    ? Object.keys(vars).reduce(
        (acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k])),
        s
      )
    : s;
}

export function localeFromPath(pathname: string): Locale {
  const m = pathname.split('/').filter(Boolean)[0];
  return m === 'es' ? 'es' : 'en';
}

export function withPrefix(path: string, l: Locale = _locale) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return l === 'en' ? clean : `/${l}${clean === '/' ? '' : clean}`;
}
