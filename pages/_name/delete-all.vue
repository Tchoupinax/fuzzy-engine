<template>
  <div class="flex flex-col items-center justify-center mt-40">
    <div class="w-full lg:w-8/12">
      <div class="flex flex-col items-center justify-center mb-40 text-theme">
        <p class="mb-24 text-4xl">
          deleting all image for {{ repoName }} ...
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import getBaseUrl from '@/functions/getBaseUrl';

export default {
  async asyncData ({ $axios, route, store }) {
    const { data: { tags } } = await $axios({
      method: 'GET',
      url: `${getBaseUrl(store.state)}/v2/${route.params.name}/tags/list`,
    });

    await Promise.all([
      tags.map(async (tag) => {
        const {
          headers: { 'docker-content-digest': digest },
        } = await $axios({
          method: 'GET',
          url: `${getBaseUrl(store.state)}/v2/${route.params.name}/manifests/${tag}`,
          headers: {
            Accept: 'application/vnd.docker.distribution.manifest.v2+json',
          },
        });

        $axios({
          method: 'DELETE',
          url: `${getBaseUrl(store.state)}/v2/${route.params.name}/manifests/${digest}`,
        });
      },
      ),
    ]);
  },
  computed: {
    repoName () { return this.$route.params.name; },
  },
  mounted () {
    window.location = '/list?delete-all=success';
  },
};
</script>
