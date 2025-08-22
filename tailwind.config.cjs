module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html','./src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        bg:      'var(--bg-app)',
        surface: 'var(--bg-elev-1)',
        text:    'var(--text)',
        muted:   'var(--text-muted)',
        border:  'var(--border)',
        accent:  'var(--accent)',
        accent2: 'var(--accent-2)',
        accent3: 'var(--accent-3)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
        info:    'var(--info)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)'
      }
    }
  },
  plugins: []
};
