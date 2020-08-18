<template>
  <div>
    <section id="actions" class="mt-6 ml-8">
      <a href="/list">
        <button class="font-bold text-theme-lighter hover:text-theme">
          Home
        </button>
      </a>
    </section>

    <div class="flex justify-center mb-32">
      <div class="w-full lg:w-8/12 text-theme">
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
            <div class="flex items-center justify-center">
              <div class="w-24 mr-8">
                {{ digest.name }}
              </div>
              <div class="relative z-10 flex items-center justify-center mr-8">
                {{ digest.size }}
                <div class="px-2 py-0 ml-2 border rounded-full cursor-pointer infoButton border-theme hover:bg-theme hover:text-white hover:border-white">
                  i
                </div>
                <div class="absolute left-0 w-48 p-2 px-1 ml-24 bg-black rounded-lg info">
                  This size is calculated by summing the image's layers, of which are compressed.
                </div>
              </div>
              <div class="relative flex items-center justify-center mr-8">
                {{ timeago(digest.created) }}
                <div class="px-2 py-0 ml-2 border rounded-full cursor-pointer infoButton border-theme hover:bg-theme hover:text-white hover:border-white">
                  i
                </div>
                <div class="absolute left-0 w-48 p-2 px-1 ml-32 bg-black rounded-lg info">
                  {{ formatFullDate(digest.created) }}
                </div>
              </div>
            </div>

            <!-- Right -->
            <div class="flex items-center">
              <div class="flex mr-8">
                <div
                  v-for="(tag, indexTags) of digest.tags"
                  :key="indexTags"
                  class="w-auto p-1 px-2 mx-1 whitespace-no-wrap bg-gray-200 rounded-lg"
                >
                  {{ tag }}
                </div>
              </div>

              <button
                class="flex items-center justify-center p-1 px-2 text-center border-2 rounded border-theme bg-theme-lighter text-theme"
                @click="deleteImage(digest.fullDigest)"
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
  </div>
</template>

<script>
import prettyBytes from 'pretty-bytes';
import * as timeago from 'timeago.js';
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
      const {
        headers: { 'docker-content-digest': digest },
        data: { layers },
      } = await $axios({
        method: 'GET',
        url: `${getBaseUrl(store.state)}/v2/${route.params.name}/manifests/${tag}`,
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
        },
      });

      const size = layers.reduce((acc, cur) => acc + cur.size, 0);

      // Get creation date
      const { data: { history: [{ v1Compatibility }] } } = await $axios({
        method: 'GET',
        url: `${getBaseUrl(store.state)}/v2/${route.params.name}/manifests/${tag}`,
      });

      return {
        name: tag,
        digest: digest.slice(7, 19),
        fullDigest: digest,
        size: prettyBytes(size),
        created: JSON.parse(v1Compatibility).created,
      };
    }));

    const finalDigests = new Map();
    tagsWithDigest.forEach(({ name, digest, size, created, fullDigest }) => {
      if (finalDigests.has(digest)) {
        finalDigests.set(digest, {
          name: digest,
          tags: [...finalDigests.get(digest).tags, name],
          size,
          created,
          fullDigest,
        });
      } else {
        finalDigests.set(digest, { name: digest, tags: [name], size, created, fullDigest });
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
      this.$router.push(`/${this.name}/tags/`);
    }
  },
  methods: {
    timeago: timeago.format,
    formatFullDate (date) {
      const dtf = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
      return dtf.format(new Date(date));
    },
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

<style scoped>
.info {
  opacity: 0;
  display: none;
}

.infoButton:hover + .info {
  opacity: 1;
  display: inline;
}
</style>
