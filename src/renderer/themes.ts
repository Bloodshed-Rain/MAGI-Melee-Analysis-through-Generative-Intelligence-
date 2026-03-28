export interface Theme {
  id: string;
  name: string;
  bg: string;
  surface1: string;
  surface2: string;
  surface3: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  win: string;
  loss: string;
  caution: string;
  sidebarBg: string;
  sidebarAccent: string;
  fontMono: string;
  fontSans: string;
  fontDisplay: string;
  easeSpring: string;
  easeOut: string;
}

export const THEMES: Record<string, Theme> = {
  dark: {
    id: "dark",
    name: "Dark",
    bg: "#0f1115",
    surface1: "#16181d",
    surface2: "#1c1f25",
    surface3: "#23262e",
    border: "#2a2d37",
    text: "#e8e6e3",
    textSecondary: "#8b8d95",
    textMuted: "#555861",
    accent: "#3ecf73",
    accentMuted: "rgba(62,207,115,0.12)",
    win: "#3ecf73",
    loss: "#e5484d",
    caution: "#f5a623",
    sidebarBg: "#0f1115",
    sidebarAccent: "#3ecf73",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    fontSans: "'DM Sans', 'Inter', -apple-system, sans-serif",
    fontDisplay: "'DM Sans', 'Inter', -apple-system, sans-serif",
    easeSpring: "cubic-bezier(0.22, 1, 0.36, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  },

  light: {
    id: "light",
    name: "Light",
    bg: "#f5f5f3",
    surface1: "#ffffff",
    surface2: "#f0f0ee",
    surface3: "#e8e8e5",
    border: "#d4d4d0",
    text: "#1a1a2e",
    textSecondary: "#4a4a60",
    textMuted: "#8b8d95",
    accent: "#1a9d4a",
    accentMuted: "rgba(26,157,74,0.12)",
    win: "#1a9d4a",
    loss: "#e5484d",
    caution: "#f5a623",
    sidebarBg: "#ededeb",
    sidebarAccent: "#1a9d4a",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    fontSans: "'DM Sans', 'Inter', -apple-system, sans-serif",
    fontDisplay: "'DM Sans', 'Inter', -apple-system, sans-serif",
    easeSpring: "cubic-bezier(0.22, 1, 0.36, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  },
};

export const THEME_ORDER = ["dark", "light"];

export type ColorMode = "dark" | "light";

export function getResolvedTheme(themeId: string, mode: ColorMode): Theme {
  return THEMES[mode] ?? THEMES["dark"]!;
}

/**
 * Applies theme tokens as CSS custom properties on :root.
 * New canonical names are set first, then legacy aliases are mapped
 * so existing page CSS continues to work during the transition.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  // ── New canonical tokens ──
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--surface-1", theme.surface1);
  root.style.setProperty("--surface-2", theme.surface2);
  root.style.setProperty("--surface-3", theme.surface3);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--text-secondary", theme.textSecondary);
  root.style.setProperty("--text-muted", theme.textMuted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-muted", theme.accentMuted);
  root.style.setProperty("--win", theme.win);
  root.style.setProperty("--loss", theme.loss);
  root.style.setProperty("--caution", theme.caution);
  root.style.setProperty("--sidebar-bg", theme.sidebarBg);
  root.style.setProperty("--sidebar-accent", theme.sidebarAccent);
  root.style.setProperty("--font-mono", theme.fontMono);
  root.style.setProperty("--font-sans", theme.fontSans);
  root.style.setProperty("--font-display", theme.fontDisplay);
  root.style.setProperty("--ease-spring", theme.easeSpring);
  root.style.setProperty("--ease-out", theme.easeOut);

  // ── Legacy aliases (keep existing CSS working during migration) ──
  root.style.setProperty("--bg-card", theme.surface1);
  root.style.setProperty("--bg-elevated", theme.surface2);
  root.style.setProperty("--bg-hover", theme.surface3);
  root.style.setProperty("--border-subtle", theme.border);
  root.style.setProperty("--text-dim", theme.textSecondary);
  root.style.setProperty("--text-title", theme.accent);
  root.style.setProperty("--text-label", theme.accent);
  root.style.setProperty("--accent-dim", theme.accent);
  root.style.setProperty("--accent-glow", theme.accentMuted);
  root.style.setProperty("--secondary", theme.accent);
  root.style.setProperty("--secondary-dim", theme.accent);
  root.style.setProperty("--green", theme.win);
  root.style.setProperty("--red", theme.loss);
  root.style.setProperty("--yellow", theme.caution);
  root.style.setProperty("--gradient-start", "transparent");
  root.style.setProperty("--gradient-end", "transparent");

  // Deprecated glass/plasma tokens — set to safe fallbacks
  root.style.setProperty("--bg-glass", theme.surface1);
  root.style.setProperty("--bg-glass-strong", theme.surface2);
  root.style.setProperty("--border-glow", theme.border);
  root.style.setProperty("--shimmer", "transparent");
  root.style.setProperty("--plasma-a", theme.accent);
  root.style.setProperty("--plasma-b", theme.accent);
  root.style.setProperty("--plasma-c", theme.accent);
  root.style.setProperty("--surface-noise", "transparent");

  // RGB decompositions for rgba() usage in existing CSS
  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };
  root.style.setProperty("--accent-rgb", hexToRgb(theme.accent));
  root.style.setProperty("--green-rgb", hexToRgb(theme.win));
  root.style.setProperty("--red-rgb", hexToRgb(theme.loss));
  root.style.setProperty("--yellow-rgb", hexToRgb(theme.caution));
}
