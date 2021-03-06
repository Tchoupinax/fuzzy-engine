
module.exports = {
  ssr: 'true',
  head: {
    title: 'Docker registry UI',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' },
    ],
    link: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  },
  loading: { color: '#fff' },
  css: [],
  plugins: [
    { src: '~/plugins/notifications', ssr: false },
    { src: '~/plugins/clipboard.js', ssr: false },
  ],
  buildModules: [
    '@nuxtjs/eslint-module',
    '@nuxtjs/tailwindcss',
  ],
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
  ],
  axios: {
    // NOTE Do not send proxy headers, if the UI is behind a reverse proxy with basic auth
    // it will override authorization header and broke everything
    proxyHeaders: false,
  },
  build: {
    extend (config, ctx) {
    },
  },
};
