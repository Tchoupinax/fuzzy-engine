/*
** TailwindCSS Configuration File
**
** Docs: https://tailwindcss.com/docs/configuration
** Default: https://github.com/tailwindcss/tailwindcss/blob/master/stubs/defaultConfig.stub.js
*/
import { colors } from 'tailwindcss/defaultTheme'

module.exports = {
  theme: {
    extend: {
      colors: {
        ...colors,
        theme: {
          lighter: 'var(--color-theme-lighter)',
          default: 'var(--color-theme)',
        },
      },
    },
  },
  variants: {},
  plugins: [],
  content: [
    'components/**/*.vue',
    'layouts/**/*.vue',
    'pages/**/*.vue',
    'plugins/**/*.js',
    'nuxt.config.js',
  ],
}
