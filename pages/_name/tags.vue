<template>
  <div class="flex justify-center mb-16">
    <div class="w-full lg:w-8/12 text-two">
      <p class="mt-16 mb-16 text-4xl text-center">
        {{ name }}
      </p>

      <div class="flex flex-col items-center justify-center">
        <!-- List of digests -->
        <div
          v-for="(digest, index) of digests"
          :key="index"
          class="flex items-center justify-between w-full px-8 py-4 text-sm font-bold text-center border-b border-gray-600"
        >
          <div class="truncate">
            {{ digest.name }}
          </div>

          <!-- Right -->
          <div class="flex items-center">
            <div class="flex mr-8">
              <div
                v-for="(tag, indexTags) of digest.tags"
                :key="indexTags"
                class="w-auto p-2 px-4 mx-2 whitespace-no-wrap bg-gray-200 rounded-lg"
              >
                {{ tag }}
              </div>
            </div>

            <button
              class="flex items-center justify-center p-1 px-2 text-center text-red-700 bg-red-200 border-2 border-red-500 rounded"
              @click="deleteImage(digest.name)"
            >
              🗑️
            </button>
          </div>
          <!-- END # Right -->
        </div>
        <!-- END # List of digests -->

        <div v-if="digests.length === 0">
          No tag found for this repository
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import getBaseUrl from '@/functions/getBaseUrl';

export default {
  async asyncData ({ $axios, route, store, app }) {
    const { data: { tags } } = await $axios({
      method: 'GET',
      url: `${getBaseUrl(store.state)}/v2/${route.params.name}/tags/list`,
    });

    if (tags === null) {
      return {
        noTag: true,
        name: route.params.name,
        digests: [],
      };
    }

    const tagsWithDigest = await Promise.all(tags.map(async (tag) => {
      const { headers: { 'docker-content-digest': digest } } = await $axios({
        method: 'HEAD',
        url: `${getBaseUrl(store.state)}/v2/${route.params.name}/manifests/${tag}`,
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
        },
      });

      return { name: tag, digest };
    }));

    const finalDigests = new Map();
    tagsWithDigest.forEach(({ name, digest }) => {
      if (finalDigests.has(digest)) {
        finalDigests.set(digest, {
          name: digest,
          tags: [...finalDigests.get(digest).tags, name],
        });
      } else {
        finalDigests.set(digest, { name: digest, tags: [name] });
      }
    });

    return {
      noTag: false,
      name: route.params.name,
      digests: Array.from(finalDigests.values()),
    };
  },
  mounted () {
    if (this.$route.query.delete === 'success') {
      this.deleteSuccess();
      this.$router.push(`/${this.name}/tags`);
    }
  },
  methods: {
    deleteImage (digesthash) {
      if (window.confirm(`Do you really want to delete ${this.$store.state.url.data}/${this.name}:${digesthash} ?`)) {
        window.location = `/${this.name}/${digesthash}/delete`;
      }
    },
  },
  notifications: {
    deleteSuccess: {
      title: 'Delete',
      message: 'Sucessfully deleted the digest!',
      type: 'success',
    },
  },
};
</script>
