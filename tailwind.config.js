/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['GothicValentine', 'serif'],
        body: ['GothicValentine', 'serif'],
        tour: ['var(--font-space-mono)', 'monospace'],
        ui: ['var(--font-inter)', 'sans-serif'],
        'wc-label': ['var(--font-cinzel)', 'serif'],
        wc: ['var(--font-chakra-petch)', 'sans-serif'],
      },
      colors: {
        roa: {
          bg: '#0a0a0a',
          fg: '#f2f2f2',
          muted: '#6b6b6b',
          border: '#1f1f1f',
        },
      },
    },
  },
  plugins: [],
}
