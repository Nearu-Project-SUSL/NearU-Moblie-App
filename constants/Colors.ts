/**
 * NearU Premium Color Design Tokens
 * Harmonious slate-based system with tailored accents for vibrant brand presence and crisp dark mode.
 */

const tintColorLight = '#2563EB'; // Electric Blue
const tintColorDark = '#60A5FA';  // Radiant Ice Blue

export const Colors = {
  light: {
    text: '#0F172A',         // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#94A3B8',     // Slate 400
    background: '#F8FAFC',    // Slate 50
    surface: '#FFFFFF',       // Absolute White
    surfaceCard: '#FFFFFF',
    border: '#E2E8F0',        // Slate 200
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    
    // Semantic Colors
    primary: '#2563EB',       // Blue 600
    primaryLight: '#DBEAFE',  // Blue 100
    success: '#10B981',       // Emerald 500
    successLight: '#D1FAE5',  // Emerald 100
    warning: '#F59E0B',       // Amber 500
    warningLight: '#FEF3C7',  // Amber 100
    danger: '#EF4444',        // Rose 500
    dangerLight: '#FEE2E2',   // Rose 100
  },
  dark: {
    text: '#F8FAFC',         // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    textMuted: '#64748B',     // Slate 500
    background: '#0F172A',    // Slate 900
    surface: '#1E293B',       // Slate 800
    surfaceCard: '#1E293B',
    border: '#334155',        // Slate 700
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    
    // Semantic Colors
    primary: '#3B82F6',       // Blue 500
    primaryLight: '#1E3A8A',  // Blue 900 (deep)
    success: '#34D399',       // Emerald 400
    successLight: '#064E3B',  // Emerald 900
    warning: '#FBBF24',       // Amber 400
    warningLight: '#78350F',  // Amber 900
    danger: '#F87171',        // Rose 400
    dangerLight: '#7F1D1D',   // Rose 900
  },
};
export type ColorsType = typeof Colors.light;
