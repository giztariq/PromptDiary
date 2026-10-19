/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        'accent-soft': 'var(--accent-soft)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces Variable', 'Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
