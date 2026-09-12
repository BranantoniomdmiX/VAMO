/**
 * VAMO Design Tokens — Fuente Central de Verdad Visual (v1.0)
 * Tokens de diseño para aplicaciones Web y PWA de VAMO.
 * Compatible con Tailwind CSS v4 y CSS Custom Properties.
 */

export const vamoTokens = {
  colors: {
    // Brand Core
    primary: '#0040A1',
    primaryContainer: '#0056D2',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#CCD8FF',

    // Energy / Promociones
    secondary: '#6D5E00',
    secondaryContainer: '#FDDF33',
    onSecondaryContainer: '#726200',

    // Confianza / Éxito
    tertiaryFixed: '#C3F400',
    onTertiaryFixed: '#161E00',

    // Alertas y Operativa
    alertOrange: '#FF5722',
    danger: '#BA1A1A',
    onDanger: '#FFFFFF',
    warning: '#D97706',
    success: '#15803D',

    // Superficies y Neutros
    surface: '#FCF9F8',
    surfaceBright: '#FCF9F8',
    surfaceDim: '#DCD9D9',
    surfaceCard: '#FFFFFF',
    surfaceContainerLow: '#F6F3F2',
    surfaceContainer: '#F0EDED',
    surfaceContainerHigh: '#EAE7E7',
    surfaceBorder: '#E5E2E1',

    // Texto
    textPrimary: '#1C1B1B',
    textSecondary: '#424654',
    textMuted: '#737785',
    textInverse: '#FFFFFF',
  },

  radii: {
    control: '0.75rem',    // 12px - Botones, inputs, badges
    card: '1.5rem',       // 24px - Tarjetas estándar, elementos modales
    panel: '2rem',        // 32px - Contenedores principales, paneles KPI
    modal: '2.5rem',      // 40px - Modales y hojas inferiores
    pill: '9999px',       // Redondeo completo (Píldoras)
  },

  touch: {
    minSize: '48px',      // Mínimo de accesibilidad táctil para México (WCAG 2.2)
    compactSize: '40px',  // Para barras densas de escritorio
    heroSize: '56px',     // Botones tácticos gigantes (Driver / KDS)
  },

  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },

  typography: {
    fontFamily: 'var(--font-quicksand), sans-serif',
    display: { fontSize: '2.5rem', lineHeight: '3rem', fontWeight: '900' },
    pageTitle: { fontSize: '1.75rem', lineHeight: '2.25rem', fontWeight: '800' },
    sectionTitle: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '800' },
    cardTitle: { fontSize: '1.125rem', lineHeight: '1.5rem', fontWeight: '700' },
    body: { fontSize: '0.9375rem', lineHeight: '1.375rem', fontWeight: '500' },
    bodySmall: { fontSize: '0.8125rem', lineHeight: '1.125rem', fontWeight: '500' },
    label: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '700' },
    caption: { fontSize: '0.6875rem', lineHeight: '0.875rem', fontWeight: '600' },
    metric: { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: '900' },
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 4px 12px 0 rgba(0, 0, 0, 0.06)',
    float: '0 12px 30px -4px rgba(0, 86, 210, 0.18)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  zIndex: {
    base: 0,
    dropdown: 20,
    sticky: 30,
    drawer: 40,
    modal: 50,
    toast: 60,
  }
} as const
