/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
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

      // Type scale — DESIGN_GUIDE §2 — extend only, do not replace
      fontSize: {
        xs:    ['0.75rem',  { lineHeight: '1rem'  }],   // 12px
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        base:  ['1rem',     { lineHeight: '1.5rem' }],   // 16px
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem',   { lineHeight: '2rem'   }],  // 24px — KPI numbers
        '3xl': ['1.875rem', { lineHeight: '2.25rem'}],  // 30px — screen titles
      },

      borderRadius: {
        DEFAULT: '6px',
        sm:      '4px',
        md:      '6px',
        lg:      '8px',
        xl:      '12px',
        badge:   '9999px',
      },

      // Fixed layout dimensions — not spacing overrides
      width: {
        sidebar: '240px',
      },
      minWidth: {
        sidebar: '240px',
      },
      height: {
        topbar: '64px',
      },
      maxWidth: {
        content: '1280px',
      },

      boxShadow: {
        card:        '0 1px 4px 0 rgba(0,0,0,0.06)',
        'card-hover':'0 4px 12px 0 rgba(0,0,0,0.10)',
        dropdown:    '0 8px 24px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
