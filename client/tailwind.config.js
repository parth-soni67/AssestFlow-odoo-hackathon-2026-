/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-sunken': 'var(--color-surface-sunken)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-subtle': 'var(--color-accent-subtle)',
        
        // Status colors
        success: 'var(--color-success)',
        'success-subtle': 'var(--color-success-subtle)',
        info: 'var(--color-info)',
        'info-subtle': 'var(--color-info-subtle)',
        warning: 'var(--color-warning)',
        'warning-subtle': 'var(--color-warning-subtle)',
        alert: 'var(--color-alert)',
        'alert-subtle': 'var(--color-alert-subtle)',
        danger: 'var(--color-danger)',
        'danger-subtle': 'var(--color-danger-subtle)',
        'neutral-status': 'var(--color-neutral-status)',
        'neutral-subtle': 'var(--color-neutral-subtle)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }],
        sm: ['0.875rem', { lineHeight: '1.43' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.5rem', { lineHeight: '1.4' }],
        '2xl': ['1.875rem', { lineHeight: '1.3' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '6px',
        md: '6px',
        sm: '4px',
        badge: '9999px',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
      }
    },
  },
  plugins: [],
}
