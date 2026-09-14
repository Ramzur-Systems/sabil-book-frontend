import type { Config } from 'tailwindcss'

/**
 * Mirrors src/assets/styles/tokens.css. Every value here reads a CSS custom
 * property so the two can never drift — change tokens.css, not this file.
 */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        marine: { DEFAULT: 'var(--marine)', dark: 'var(--marine-dark)' },
        parchment: 'var(--parchment)',
        paper: { DEFAULT: 'var(--paper)', tint: 'var(--paper-tint)' },
        brass: { DEFAULT: 'var(--brass)', bg: 'var(--brass-bg)' },
        slate: { DEFAULT: 'var(--slate)', bg: 'var(--slate-bg)' },
        line: 'var(--line)',
        green: { DEFAULT: 'var(--green)', bg: 'var(--green-bg)' },
        red: { DEFAULT: 'var(--red)', bg: 'var(--red-bg)' },
        topnav: 'var(--topnav)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        serif: 'var(--font-serif)',
      },
      borderRadius: {
        control: 'var(--radius-control)',
      },
      transitionTimingFunction: {
        'out-quart': 'var(--ease-out-quart)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        backdrop: 'var(--z-backdrop)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
      maxWidth: {
        shell: '960px',
        prose: '65ch',
        pitch: '520px',
        title: '640px',
        form: '480px',
      },
    },
  },
  // No shadow scale is exposed on purpose: the system forbids box-shadow.
  corePlugins: { boxShadow: false },
  plugins: [],
} satisfies Config
