<template>
  <div>
    <div
      v-if="syncingInProgress"
      class="text-theme-default hover:text-theme-default absolute text-2xl right-0 bottom-0 mb-20 shadow-xl mr-6 bg-gray-50 p-2 px-4 rounded-lg"
    >
      Sync in progress...
    </div>

    <section id="actions" class="flex justify-between pt-6 ml-8">
      <NuxtLink to="/list">
        <button class="font-bold text-theme-default hover:text-theme-default">
          List of repositories
        </button>
      </NuxtLink>

      <div class="mr-8">
        <button
          v-if="hasNullTags"
          class="flex items-center font-bold text-theme-default hover:text-theme-default"
          @click="toggleDoNotDisplayNullTags"
        >
          {{ doNotDisplayNullTags ? 'Display image with null tag' : 'Hide image with null tag' }}
        </button>
      </div>
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
            v-for="(digest, index) of images"
            :key="index"
            class="flex items-center justify-between w-full px-8 py-4 text-sm font-bold text-center"
            :class="{
              'border-b border-theme-default': index !== digests.length - 1,
              'border-none': index === digests.length - 1,
            }"
          >
            <div class="flex items-center justify-center">
              <div class="w-auto mr-8">
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

                <div class="absolute left-0 z-10 flex p-2 ml-24 bg-black rounded-lg w-auto px-4 info">
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

              <div v-if="digest.tags.filter(tag => tag).length > 0" class="flex">
                <div
                  v-for="(tag, indexTags) of digest.tags.filter(tag => tag)"
                  :key="indexTags"
                  class="w-auto p-1 px-2 mx-1 whitespace-no-wrap bg-gray-200 rounded-lg"
                >
                  <div class="relative">
                    <div
                      class="px-0 py-0 cursor-pointer mx-1 infoButton border-theme-default hover:text-theme-default"
                    >
                      {{ digest.tags.length < 10 ? tag : tag.slice(0, 10) }}
                    </div>
                    <div class="absolute right-0 z-10 p-2 px-4 mr-4 bg-black rounded-lg info">
                      {{ tag }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="flex">
                <div
                  class="text-xs w-auto p-1 px-2 mx-1 whitespace-no-wrap rounded-lg"
                >
                  ❌
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
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as timeago from 'timeago.js'
import { Option } from '@swan-io/boxed'
import { getCookie } from '../../functions/cookies'
import { DB } from '../../functions/db'
import { ContainerRepositoryTags, listRepositoriesTagsAnswer } from '../../server/gateways/registry-api.gateway'

type State = {
  digests: Array<ContainerRepositoryTags>;
  doNotDisplayNullTags: boolean;
  name: string;
  noTag: boolean;
  provider: Option<string>;
  syncingInProgress: boolean;
}

export default {
  name: 'TagsComponent',
  data (): State {
    return {
      digests: [],
      doNotDisplayNullTags: true,
      name: '',
      noTag: false,
      provider: Option.None(),
      syncingInProgress: false,
    }
  },
  computed: {
    hasNullTags () { return this.digests.some(digest => digest.tags.filter(tag => tag).length === 0) },
    images () {
      if (this.doNotDisplayNullTags) {
        return this.digests.filter(digest => digest.tags.filter(tag => tag).length > 0)
      }
      return this.digests
    },
  },
  async mounted () {
    if (this.$route.query.delete === 'success') {
      this.deleteSuccess()
      this.$router.push(`/${this.name}/tags/`)
    }

    this.doNotDisplayNullTags = localStorage.getItem('fuzzy-engine-toggleDoNotDisplayNullTags') === 'true'

    const db = new DB()
    const repositoryName: string = this.$route.params.name as string

    const storedData = db.findRepositoryImages(repositoryName)
    if (storedData.isSome()) {
      this.syncingInProgress = true
      const data = storedData.get()
      this.name = data.name
      this.noTag = data.noTag
      this.digests = data.digests
    }

    this.provider = Option.Some(getCookie('fuzzy-engine-provider'))

    const data = await $fetch(`${window.location.origin}/api/repositories/${this.$route.params.name}/tags`, {
      method: 'GET',
      credentials: 'include',
    })

    this.name = data.name
    this.noTag = data.noTag
    this.digests = data.digests as unknown as listRepositoriesTagsAnswer['digests']
    this.syncingInProgress = false

    db.saveRepositoryImages(repositoryName, data)
  },
  methods: {
    timeago: timeago.format,
    formatFullDate (date: Date) {
      const dtf = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false })

      return dtf.format(new Date(date))
    },
    deleteImage (digesthash: string) {
      if (window.confirm(`Do you really want to delete ${this.$store.state.url.data}/${this.name}:${digesthash} ?`)) {
        window.location = `/${this.name}/${digesthash}/delete`
      }
    },
    toggleDoNotDisplayNullTags () {
      this.doNotDisplayNullTags = !this.doNotDisplayNullTags
      localStorage.setItem('fuzzy-engine-toggleDoNotDisplayNullTags', this.doNotDisplayNullTags ? 'true' : 'false')
    }
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
