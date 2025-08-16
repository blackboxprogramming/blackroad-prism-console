const dict = {
  en: { title: 'blackroad.io', quickCommands: 'Quick Commands' },
  es: { title: 'blackroad.io', quickCommands: 'Comandos Rápidos' },
};
export function t(key: keyof (typeof dict)['en'], lang: 'en' | 'es' = 'en') {
  return (dict[lang] && (dict as any)[lang][key]) || dict.en[key] || String(key);
}
