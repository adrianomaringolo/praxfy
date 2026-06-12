/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/buildgrid-ui/dist/**/*.{js,mjs}',
  ],
  theme: {
    extend: {
      colors: {
        // Primária — azul-ardósia (identidade, navegação, headers)
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b9fd',
          400: '#8191f8',
          500: '#6366f1', // base
          600: '#4f46e5', // hover
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Accent — índigo vibrante (CTAs, badges ativos, destaques)
        accent: {
          DEFAULT: '#6366f1',
          hover:   '#4f46e5',
          light:   '#e0e7ff',
        },
        // Superfície — fundos levemente aquecidos
        surface: {
          DEFAULT: '#f8f7ff', // fundo geral (não branco puro)
          card:    '#ffffff',
          muted:   '#f1f0f9',
        },
        // Feedback
        success: { DEFAULT: '#10b981', light: '#d1fae5' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2' },
        info:    { DEFAULT: '#3b82f6', light: '#dbeafe' },
        // Texto
        text: {
          primary:   '#1e1b4b',
          secondary: '#6b7280',
          muted:     '#9ca3af',
          inverse:   '#ffffff',
        },
        // Sidebar
        sidebar: {
          bg:     '#1e1b4b',
          hover:  '#312e81',
          active: '#4f46e5',
          text:   '#c7d7fe',
          muted:  '#818cf8',
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
