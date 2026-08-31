<template>
  <div
    :class="{
      one: theme === 'one',
      two: theme === 'two',
      three: theme === 'three',
      fourth: theme === 'fourth',
      fifth: theme === 'fifth',
      sixth: theme === 'sixth',
    }"
  >
    <slot />

    <footer
      class="fixed bottom-0 flex items-center justify-between w-full h-16 px-8 text-white bg-theme-lighter"
    >
      <div class="flex items-center justify-center">
        <div class="flex">
          <div
            v-for="color in themeColors"
            :key="color"
            :style="{ backgroundColor: `var(--color-theme-${color})` }"
            class="w-8 h-8 mr-2 border-2 rounded-full cursor-pointer"
            :class="
              theme === color
                ? 'border-white ring-2 ring-black scale-110'
                : 'border-black'
            "
            @click="changeColor(color)"
          />
        </div>
      </div>

      <div class="flex">
        <div class="text-black text-xl mr-6 font-medium">v{{ version }}</div>

        <a target="_blank" href="https://github.com/Tchoupinax/fuzzy-engine">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 20"
            fill="none"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
            />
          </svg>
        </a>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { setCookie, getCookie } from "~~/functions/cookies";

const THEME_COLORS = ["one", "two", "three", "fourth", "fifth", "sixth"] as const;
type ThemeColor = (typeof THEME_COLORS)[number];

export default {
  name: "DefaultLayout",
  data() {
    return {
      theme: "one" as ThemeColor,
      themeColors: THEME_COLORS,
      version: "",
    };
  },
  mounted() {
    const savedTheme = getCookie("fuzzy-engine-theme");
    this.theme = THEME_COLORS.includes(savedTheme as ThemeColor)
      ? (savedTheme as ThemeColor)
      : "one";

    if (!savedTheme) {
      setCookie("fuzzy-engine-theme", this.theme);
    }

    this.fetchVersion();
  },
  methods: {
    changeColor(name: ThemeColor) {
      this.theme = name;
      setCookie("fuzzy-engine-theme", name);
    },
    fetchVersion() {
      $fetch("/api/version").then((payload) => {
        this.version = payload.version;
      });
    },
  },
};
</script>
