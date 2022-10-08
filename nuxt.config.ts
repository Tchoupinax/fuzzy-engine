import { defineNuxtConfig } from "@nuxt/bridge";

export default defineNuxtConfig({
  target: "server",
  head: {
    title: "Docker registry UI",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content: process.env.npm_package_description || ""
      }
    ],
    link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }]
  },
  loading: { color: "#fff" },
  css: [],
  plugins: [
    "~/plugins/clipboard.client.ts",
    "~/plugins/notifications.client.ts"
  ],
  buildModules: ["@nuxtjs/eslint-module", "@nuxtjs/tailwindcss"],
  modules: ["@nuxtjs/axios", "@nuxtjs/pwa"],
  axios: {
    // NOTE Do not send proxy headers, if the UI is behind a reverse proxy with basic auth
    // it will override authorization header and broke everything
    proxyHeaders: false,
    credentials: true,
  }
});
