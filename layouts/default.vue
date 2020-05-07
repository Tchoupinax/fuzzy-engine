<template>
  <div
    :class="{
      'one': theme === 'one',
      'two': theme === 'two',
      'three': theme === 'three',
      'fourth': theme === 'fourth'
    }"
  >
    <nuxt />
    <footer class="absolute bottom-0 flex items-center justify-start w-full h-16 px-8 text-white bg-theme-lighter">
      <div class="flex items-center justify-center">
        <p class="mr-4 text-xl font-bold">
          Theme color:
        </p>

        <div class="flex">
          <div
            style="background-color: var(--color-theme-one)"
            class="w-8 h-8 mr-2 border-2 border-black rounded-full cursor-pointer"
            @click="changeColor('one')"
          />
          <div
            style="background-color: var(--color-theme-two)"
            class="w-8 h-8 mr-2 border-2 border-black rounded-full cursor-pointer"
            @click="changeColor('two')"
          />
          <div
            style="background-color: var(--color-theme-three)"
            class="w-8 h-8 mr-2 border-2 border-black rounded-full cursor-pointer"
            @click="changeColor('three')"
          />
          <div
            style="background-color: var(--color-theme-fourth)"
            class="w-8 h-8 mr-2 border-2 border-black rounded-full cursor-pointer"
            @click="changeColor('fourth')"
          />
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
const { setCookie } = require('@/functions/cookies');

export default {
  data () {
    return {
      theme: this.$store.state.theme,
    };
  },
  methods: {
    changeColor (name) {
      this.theme = name;
      setCookie('fuzzy-engine-theme', name);
    },
  },
};
</script>
