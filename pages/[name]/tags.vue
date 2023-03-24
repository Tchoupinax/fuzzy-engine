<template>
  <div>
    <section id="actions" class="mt-6 ml-8">
      <NuxtLink to="/list">
        <button class="font-bold text-theme-default hover:text-theme-default">
          List of repositories
        </button>
      </NuxtLink>
    </section>

    <div class="flex justify-center mb-32">
      <div class="w-full lg:w-8/12 text-theme-default">
        <div class="flex justify-center w-full">
          <p class="inline-block w-auto mt-16 mb-16 text-4xl text-center border-blue-400 border-b-10 title">
            {{ name }}
          </p>
        </div>

        <div class="flex flex-col items-center justify-center">
          <!-- List of digests -->
          <div
            v-for="(digest, index) of digests"
            :key="index"
            class="flex items-center justify-between w-full px-8 py-4 text-sm font-bold text-center"
            :class="{
              'border-b border-theme-default': index !== digests.length - 1,
              'border-none': index === digests.length - 1,
            }"
          >
            <div class="flex items-center justify-center">
              <div class="w-24 mr-8">
                {{ digest.name }}
              </div>

              <div
                v-if="provider.getWithDefault('_') !== 'github-ecr'"
                class="relative flex items-center justify-center mr-8"
              >
                {{ digest.size }}

                <div
                  class="px-2 py-0 ml-2 border rounded-full cursor-pointer infoButton border-theme-default hover:text-theme-default"
                >
                  i
                </div>
                <div class="absolute left-0 z-10 w-48 p-2 px-1 ml-24 bg-black rounded-lg info">
                  This size is calculated by summing the image's layers, of which are compressed.
                </div>
              </div>

              <div class="relative flex items-center justify-center mr-8">
                {{ timeago(digest.created) }}

                <div
                  class="px-2 py-0 ml-2 border rounded-full cursor-pointer infoButton border-theme-default hover:text-theme-default"
                >
                  i
                </div>

                <div class="absolute left-0 z-10 w-48 p-2 px-1 ml-32 bg-black rounded-lg info">
                  {{ formatFullDate(digest.created) }}
                </div>
              </div>
            </div>

            <div class="flex items-center">
              <div class="relative flex items-center justify-center mr-4">
                <div
                  v-if="digest.architectures && digest.architectures.length > 0"
                  class="px-2 py-0 ml-2 border rounded-full cursor-pointer infoButton border-theme-default hover:text-theme-default"
                >
                  architectures
                </div>

                <div class="absolute left-0 z-10 flex p-2 px-1 ml-24 bg-black rounded-lg w-28 info">
                  <div>
                    <div
                      v-for="(architecture, indexArchitecture) of digest.architectures"
                      :key="indexArchitecture"
                    >
                      {{ architecture }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex">
                <div
                  v-for="(tag, indexTags) of digest.tags"
                  :key="indexTags"
                  class="w-auto p-1 px-2 mx-1 whitespace-no-wrap bg-gray-200 rounded-lg"
                >
                  {{ tag && tag.slice(0, 16) }}
                </div>
              </div>

              <button
                v-if="false"
                class="flex items-center justify-center p-1 px-2 ml-8 text-center bg-gray-200 border-2 rounded border-theme-default text-theme-default"
                @click="deleteImage(digest.fullDigest)"
              >
                <div class="w-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
              </button>
            </div>
            <!-- END # Right -->
          </div>
          <!-- END # List of digests -->

          <div v-if="loaded && digests.length === 0">
            No tag found for this repository
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as timeago from 'timeago.js'
import { Option } from '@swan-io/boxed'
import { getCookie } from '../../functions/cookies'

export default {
  name: 'TagsComponent',
  data () {
    return {
      loaded: false,
      provider: Option.None(),
      name: '',
      notag: '',
      digests: [],
    }
  },
  async mounted () {
    this.provider = Option.Some(getCookie('fuzzy-engine-provider'))

    if (this.$route.query.delete === 'success') {
      this.deleteSuccess()
      this.$router.push(`/${this.name}/tags/`)
    }

    const data = await $fetch(`${new URL(window.location).origin}/api/repositories/${this.$route.params.name}/tags`, {
      method: 'GET',
      credentials: 'include',
    })

    this.name = data.name
    this.noTag = data.noTag
    this.digests = data.digests
    this.loaded = true
  },
  methods: {
    timeago: timeago.format,

    formatFullDate (date) {
      const dtf = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false })

      return dtf.format(new Date(date))
    },

    deleteImage (digesthash) {
      if (window.confirm(`Do you really want to delete ${this.$store.state.url.data}/${this.name}:${digesthash} ?`)) {
        window.location = `/${this.name}/${digesthash}/delete`
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
}
</script>

<style scoped>
.title {
  font-size: 70px;
  border-bottom: 20px solid rgb(255, 183, 48);
}

.info {
  opacity: 0;
  display: none;
}

.infoButton:hover+.info {
  opacity: 1;
  display: inline;
}
</style>
