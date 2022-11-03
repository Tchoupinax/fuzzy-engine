import VueClipboard from 'vue-clipboard2';

export default defineNuxtPlugin((nuxtApp) => {
  VueClipboard.config.autoSetContainer = true;
  nuxtApp.vueApp.use(VueClipboard);
});
