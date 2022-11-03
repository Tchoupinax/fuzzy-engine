// https://v3.nuxtjs.org/api/configuration/nuxt.config
import eslint from 'vite-plugin-eslint'

export default defineNuxtConfig({
  ssr: true,
  typescript: {
    shim: false
  },
  head: {
    title: 'Docker registry UI',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {

        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
  },
  loading: { color: '#fff' },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/pwa'
  ],
  vite: {
    plugins: [
      eslint()
    ]
  }
});
