/**
 * The Eilams palette, lifted straight from the website's `--sn-*` custom
 * properties so the app and the site read as one product.
 */
export const colors = {
  brand: '#164E63',
  brandHover: '#0E7490',
  ink: '#17212B',
  body: '#164E63',
  muted: '#64748B',
  faint: '#94A3B8',
  accent: '#84CC16',
  accentSoft: '#D9F99D',
  sun: '#F0A81E',
  danger: '#A8263C',
  dangerSoft: '#FDF0EF',
  success: '#137333',
  successSoft: '#E6F4EA',
  warning: '#B45309',
  warningSoft: '#FEF6E7',
  surface: '#FFFFFF',
  subtle: '#F7FAFA',
  sunken: '#F8FAFB',
  line: '#E7F4F5',
  lineStrong: '#D3E9EA',
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
  sm: 8,
  md: 12,
  lg: 18,
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
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const font = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  semibold: { fontFamily: 'System', fontWeight: '600' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
};
