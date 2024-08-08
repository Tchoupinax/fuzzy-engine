import perfectionist from "eslint-plugin-perfectionist";

import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  plugins: {
    perfectionist,
  },
  rules: {
    "@typescript-eslint/no-invalid-void-type": "off",
    // It's because maybe one day default html component will be called
    // and there are always in one word
    "vue/multi-word-component-names": "off",
    "vue/html-self-closing": "off",
    "perfectionist/sort-imports": "error",
  },
});
