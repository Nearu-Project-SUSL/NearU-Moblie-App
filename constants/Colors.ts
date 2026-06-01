/**
 * NearU Premium Color Design Tokens
 * Harmonious slate-based system with tailored accents for vibrant brand presence and crisp dark mode.
 */

const tintColorLight = '#2563EB'; // Electric Blue
const tintColorDark = '#60A5FA';  // Radiant Ice Blue

export const Colors = {
  // ── NearU Brand Identity ──────────────────────────────────────────────────
  brand: {
    accent: '#2E9EBF',          // NearU primary cyan (matches web frontend)
    accentDark: '#247F99',      // Pressed / darker variant
    logoCoral: '#E05638',       // Logo orange path
    logoNavy: '#0F4C81',        // Logo navy path
  },

  light: {
    text: '#0F172A',         // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#94A3B8',     // Slate 400
    background: '#F8FAFC',    // Slate 50
    surface: '#FFFFFF',       // Absolute White
    surfaceCard: '#FFFFFF',
    surfaceElevated: '#F1F5F9', // Subtle elevated surface
    border: '#E2E8F0',        // Slate 200
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#2E9EBF',
    
    // Semantic Colors
    primary: '#2563EB',       // Blue 600
    primaryLight: '#DBEAFE',  // Blue 100
    success: '#10B981',       // Emerald 500
    successLight: '#D1FAE5',  // Emerald 100
    warning: '#F59E0B',       // Amber 500
    warningLight: '#FEF3C7',  // Amber 100
    danger: '#EF4444',        // Rose 500
    dangerLight: '#FEE2E2',   // Rose 100

    // NearU accent surfaces
    nearuAccent: '#2E9EBF',
    nearuAccentSubtle: '#E8F4F8',
    nearuAccentLight: 'rgba(46, 158, 191, 0.08)',
    nearuGradientStart: '#2E9EBF',
    nearuGradientEnd: '#0EA5E9',
  },
  dark: {
    text: '#F8FAFC',         // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    textMuted: '#64748B',     // Slate 500
    background: '#0F172A',    // Slate 900
    surface: '#1E293B',       // Slate 800
    surfaceCard: '#1E293B',
    surfaceElevated: '#253449', // Subtle elevated surface
    border: '#334155',        // Slate 700
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: '#2E9EBF',
    
    // Semantic Colors
    primary: '#3B82F6',       // Blue 500
    primaryLight: '#1E3A8A',  // Blue 900 (deep)
    success: '#34D399',       // Emerald 400
    successLight: '#064E3B',  // Emerald 900
    warning: '#FBBF24',       // Amber 400
    warningLight: '#78350F',  // Amber 900
    danger: '#F87171',        // Rose 400
    dangerLight: '#7F1D1D',   // Rose 900

    // NearU accent surfaces
    nearuAccent: '#2E9EBF',
    nearuAccentSubtle: 'rgba(46, 158, 191, 0.12)',
    nearuAccentLight: 'rgba(46, 158, 191, 0.06)',
    nearuGradientStart: '#2E9EBF',
    nearuGradientEnd: '#38BDF8',
  },
};
export type ColorsType = typeof Colors.light;
