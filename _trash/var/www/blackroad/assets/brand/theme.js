/** FILE: /var/www/blackroad/assets/brand/theme.js */
export const brand = {
  name: "BlackRoad",
  colors: {
    dark: "#0A0A0E",
    darker: "#050507",
    light: "#F6F7FB",
    fg: "#E8EAF1",
    fgMuted: "#B7BCCB",
    accent1: "#FF4FD8",
    accent2: "#0096FF",
    accent3: "#FDBA2D"
  },
  gradient: "linear-gradient(135deg, #FF4FD8 0%, #0096FF 50%, #FDBA2D 100%)",
  radius: { sm: 8, md: 12, lg: 20 }
};

export function applyBrandTheme(root = document.documentElement) {
  const { colors, gradient } = brand;
  root.style.setProperty("--brand-dark", colors.dark);
  root.style.setProperty("--brand-darker", colors.darker);
  root.style.setProperty("--brand-light", colors.light);
  root.style.setProperty("--brand-fg", colors.fg);
  root.style.setProperty("--brand-fg-muted", colors.fgMuted);
  root.style.setProperty("--accent-1", colors.accent1);
  root.style.setProperty("--accent-2", colors.accent2);
  root.style.setProperty("--accent-3", colors.accent3);
  root.style.setProperty("--brand-gradient", gradient);
}
