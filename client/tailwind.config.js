/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Spacing: DESIGN_GUIDE §3 — 4px base scale only.
    // We extend Tailwind's default scale rather than replace it so that
    // standard utilities still work, but we explicitly name the tokens
    // we care about so they are easy to audit.
    extend: {
      colors: {
        // Core
        bg:                'var(--color-bg)',
        surface:           'var(--color-surface)',
        'surface-sunken':  'var(--color-surface-sunken)',
        border:            'var(--color-border)',
        'border-strong':   'var(--color-border-strong)',

        // Text
        'text-primary':    'var(--color-text-primary)',
        'text-secondary':  'var(--color-text-secondary)',
        'text-muted':      'var(--color-text-muted)',

        // Accent — operations blue
        accent:            'var(--color-accent)',
        'accent-hover':    'var(--color-accent-hover)',
        'accent-subtle':   'var(--color-accent-subtle)',

        // Status
        success:           'var(--color-success)',
        'success-subtle':  'var(--color-success-subtle)',
        info:              'var(--color-info)',
        'info-subtle':     'var(--color-info-subtle)',
        warning:           'var(--color-warning)',
        'warning-subtle':  'var(--color-warning-subtle)',
        alert:             'var(--color-alert)',
        'alert-subtle':    'var(--color-alert-subtle)',
        danger:            'var(--color-danger)',
        'danger-subtle':   'var(--color-danger-subtle)',
        'neutral-status':  'var(--color-neutral-status)',
        'neutral-subtle':  'var(--color-neutral-subtle)',
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },

      // Type scale — DESIGN_GUIDE §2 exact
      fontSize: {
        xs:   ['0.75rem',   { lineHeight: '1.25', fontWeight: '500' }],   // 12px badges/meta
        sm:   ['0.875rem',  { lineHeight: '1.43', fontWeight: '400' }],   // 14px body/labels
        base: ['1rem',      { lineHeight: '1.5',  fontWeight: '400' }],   // 16px input text
        lg:   ['1.125rem',  { lineHeight: '1.5',  fontWeight: '600' }],   // 18px card titles
        xl:   ['1.5rem',    { lineHeight: '1.4',  fontWeight: '600' }],   // 24px screen titles
        '2xl':['1.875rem',  { lineHeight: '1.3',  fontWeight: '700' }],   // 30px KPI numbers
      },

      borderRadius: {
        DEFAULT: '6px',   // cards, inputs
        lg:      '6px',
        md:      '6px',
        sm:      '4px',   // badges, small buttons
        badge:   '9999px',
      },

      // Explicit named spacing on 4px scale — DESIGN_GUIDE §3
      spacing: {
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '6':  '24px',
        '8':  '32px',
        '12': '48px',
        '16': '64px',
      },

      // Fixed layout dimensions
      width: {
        sidebar: '240px',
      },
      height: {
        topbar: '64px',
      },
      maxWidth: {
        content: '1280px',
      },

      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.10)',
        dropdown: '0 8px 24px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
