<template>
  <div class="flex justify-center mb-16">
    <div class="w-full lg:w-8/12">
      <div class="flex flex-col items-center justify-center text-theme">
        <p class="mt-16 mb-16 text-4xl">
          {{ url }}
        </p>

        <div
          v-for="(repo, index) of repositories"
          :key="index"
          class="flex items-center justify-between w-full px-4 py-4 text-sm font-bold text-center whitespace-no-wrap border-b border-theme"
        >
          <div class="text-xl">
            {{ repo }}
          </div>

          <!-- Right -->
          <div class="flex items-center">
            <div class="flex mr-8">
              <input
                class="px-2 text-gray-700 border border-gray-700 rounded-l docker-pull"
                type="text"
                :value="`docker pull ${url}/${repo}`"
              >
              <button
                v-clipboard:copy="`docker pull ${url}/${repo}`"
                v-clipboard:success="onCopy"
                class="p-2 px-4 bg-blue-200 border border-l-0 border-gray-700 rounded-r"
                type="button"
              >
                <img
                  class="w-4"
                  src="https://clipboardjs.com/assets/images/clippy.svg"
                  alt=""
                >
              </button>
            </div>

            <a :href="`/${repo}/tags`">Show tags</a>
          </div>
          <!-- END # Right -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import getBaseUrl from '@/functions/getBaseUrl';

export default {
  async asyncData ({ $axios, store, redirect }) {
    let repositories;

    try {
      ({ data: { repositories } } = await $axios({
        method: 'GET',
        url: `${getBaseUrl(store.state)}/v2/_catalog`,
      }));
    } catch (err) {
      if (err.errno) {
        return redirect('/?error=ENOTFOUND');
      }
      if (err.response.status === 401) {
        return redirect('/?error=401');
      }
    };

    return { repositories };
  },
  computed: {
    url () {
      return this.$store.state.url.data;
    },
  },
  methods: {
    onCopy (e) {
      this.copiedSuccesfully();
    },
  },
  notifications: {
    copiedSuccesfully: {
      title: 'Copied!',
      type: 'success',
    },
  },
};
</script>

<style scoped>
.docker-pull {
  width: 22rem;
}
</style>
