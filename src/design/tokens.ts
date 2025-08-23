export const tokens = {
  core: {
    color: {
      accent: '#FF4FD8',
      accent2: '#0096FF',
      accent3: '#FDBA2D',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#0096FF',
      bg: '#0B0C0F',
      surface: '#121319',
      surface2: '#1A1C23',
      text: '#E6E7EB',
      muted: '#B5B8C1',
      outline: '#2A2E37'
    },
    radius: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
    space: { '0': '0px', '1': '4px', '2': '8px', '3': '12px', '4': '16px', '5': '24px', '6': '32px', '7': '48px', '8': '64px' },
    blur: { sm: '4px', md: '8px', lg: '16px' },
    shadow: {
      sm: '0 1px 2px rgba(0,0,0,0.4)',
      md: '0 4px 16px rgba(0,0,0,0.5)',
      lg: '0 10px 40px rgba(0,0,0,0.55)'
    },
    typography: {
      fontBody: "'Inter Variable', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontMono: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      ratio: 1.333,
      size: {
        xs: '0.75rem',
        sm: '1rem',
        md: '1.333rem',
        lg: '1.777rem',
        xl: '2.369rem',
        '2xl': '3.157rem',
        '3xl': '4.209rem'
      },
      line: { tight: '1.25', normal: '1.5', loose: '1.7' }
    }
  },
  alias: {
    'text.default': '#E6E7EB',
    'text.muted': '#B5B8C1',
    link: '#0096FF',
    focus: '#FF4FD8',
    'bg.app': '#0B0C0F',
    'bg.elev1': '#121319',
    'bg.elev2': '#1A1C23',
    'border.default': '#2A2E37',
    'state.success': '#10B981',
    'state.warning': '#F59E0B',
    'state.danger': '#EF4444',
    'state.info': '#0096FF'
  }
} as const;
