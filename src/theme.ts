/** Eilams travel palette: deep indigo, ocean teal, and clean white surfaces. */
export const colors = {
  brand: '#123E73',
  brandHover: '#0B5A83',
  brandDeep: '#081C38',
  ocean: '#087F91',
  ink: '#142236',
  body: '#344A62',
  muted: '#63758A',
  faint: '#97A6B7',
  accent: '#A8CE4B',
  accentSoft: '#EFF7D9',
  sun: '#EAAE46',
  danger: '#A8263C',
  dangerSoft: '#FDF0EF',
  success: '#137333',
  successSoft: '#E6F4EA',
  warning: '#B45309',
  warningSoft: '#FEF6E7',
  surface: '#FFFFFF',
  subtle: '#F3F6FA',
  sunken: '#F8FAFC',
  line: '#E8EDF3',
  lineStrong: '#D7E0EA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  page: 20,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/** Shared card look, so every surface on screen agrees with every other one. */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.line,
} as const;

export const shadows = {
  card: {
    shadowColor: '#102B49',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  floating: {
    shadowColor: '#071C38',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

export const font = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  semibold: { fontFamily: 'System', fontWeight: '600' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
};
