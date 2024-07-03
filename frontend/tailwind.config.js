/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': 'var(--app-bg)',
        'border-darker': 'var(--border-darker)',
        'border-default': 'var(--border-default)',
        'border-disabled': 'var(--border-disabled)',
        'errors-darker': 'var(--errors-darker)',
        'errors-default': 'var(--errors-default)',
        'errors-lighter': 'var(--errors-lighter)',
        'errors-subtle': 'var(--errors-subtle)',
        'primary-darker': 'var(--primary-darker)',
        'primary-default': 'var(--primary-default)',
        'primary-lighter': 'var(--primary-lighter)',
        'primary-subtle': 'var(--primary-subtle)',
        'success-darker': 'var(--success-darker)',
        'success-default': 'var(--success-default)',
        'success-lighter': 'var(--success-lighter)',
        'success-subtle': 'var(--success-subtle)',
        'surface-default': 'var(--surface-default)',
        'surface-disabled': 'var(--surface-disabled)',
        'surface-subtle': 'var(--surface-subtle)',
        'text-body': 'var(--text-body)',
        'text-caption': 'var(--text-caption)',
        'text-disabled': 'var(--text-disabled)',
        'text-subtitle': 'var(--text-subtitle)',
        'text-title': 'var(--text-title)'
      },
      screens: {
        xs: '384px',
        sm: '512px'
      }
    }
  },
  plugins: []
};
