<template>
  <div class="h-full">
    <div
      v-if="syncingInProgress"
      class="text-theme-default hover:text-theme-default absolute text-2xl right-0 bottom-0 mb-20 shadow-xl mr-6 bg-gray-50 p-2 px-4 rounded-lg"
    >
      Sync in progress...
    </div>

    <section id="actions" class="flex justify-between pt-6 ml-8">
      <NuxtLink to="/">
        <button class="font-bold text-theme-default hover:text-theme-default">
          Home
        </button>
      </NuxtLink>

      <!--<div class="mr-8">
        <button
          class="flex items-center font-bold text-theme-default hover:text-theme-default"
          @click="toggleHiddingRepoMode"
        >
          <div v-if="!hiddingRepoMode" class="w-4 mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div v-else class="w-4 mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          {{ !hiddingRepoMode ? 'Edit mode' : 'Validate' }}
        </button>
      </div>-->
    </section>

    <div class="flex flex-col h-full items-center justify-center mb-40">
      <div class="w-full h-full lg:w-8/12">
        <div class="flex flex-col items-center justify-center mb-40 text-theme-default">
          <div v-if="!loading" class="mb-16 mt-8 xl:mt-0 text-4xl text-center">
            <p>
              {{ url }}
            </p>

            <NuxtLink to="/list/last" class="text-sm underline">
              View last pushed images
            </NuxtLink>
          </div>

          <div v-if="loading" class="flex flex-col items-center justify-center">
            <div class="lds-ring">
              <div /><div /><div /><div />
            </div>

            <div class="mt-16 text-xl">
              <p>
                We sent our messengers to get the list of repositories. Please be patient
              </p>
            </div>
          </div>

          <div v-if="!loading" class="w-1/2 mb-16">
            <input
              v-model="imageName"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="image name"
              @keyup="searchImageByNameDebounce"
            >
          </div>

          <div
            v-for="(repo, index) of filteredRepositories"
            :key="index"
            class="flex pl-16 xl:pl-4 pr-16 xl:pr-4 items-center justify-between w-full px-4 py-4 text-sm font-bold text-center whitespace-no-wrap border-b border-theme-default"
            :class="{ 'opacity-50': hiddingRepositories.includes(repo.name) }"
          >
            <div class="w-5/12 text-xl text-left truncate">
              {{ repo.name }}
            </div>

            <!-- Right -->
            <div class="flex items-center">
              <div class="xl:flex mr-8 hidden">
                <input
                  class="px-2 text-xs bg-gray-50 text-theme-default border border-theme-default rounded-l docker-pull"
                  type="text"
                  :value="downloadUrl(repo.name)"
                >

                <button
                  class="p-2 px-4 bg-gray-100 border border-l-0 border-theme-default rounded-r"
                  type="button"
                  @click="onCopy(repo.name)"
                >
                  <img
                    class="w-4"
                    src="https://clipboardjs.com/assets/images/clippy.svg"
                    alt=""
                  >
                </button>
              </div>

              <div class="flex items-center justify-end text-right w-40">
                <NuxtLink :to="`/${repo.name.replace(/\//g, '--slash--')}/tags`">
                  Show tags ({{ repo.countOfTags }})
                </NuxtLink>
              </div>

              <button v-show="hiddingRepoMode" class="w-6 ml-4">
                <svg
                  v-if="hiddingRepositories.includes(repo.name)"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  @click="showRepo(repo.name)"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>

                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  @click="hideRepo(repo.name)"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>

              <button v-show="hiddingRepoMode" class="w-6 ml-2" @click="deleteAllImage(repo.name)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          <!-- END # Right -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Option } from '@swan-io/boxed'
import { match } from 'ts-pattern'

import debounce from 'lodash.debounce'
import { Provider } from '../../types/provider'

import { DB } from '../../functions/db'
import { getCookie, setCookie } from '~~/functions/cookies'

type State = {
  awsEcr: { accessKey: string, secretKey: string, region: string },
  dockerRegistry: { url: string, username: string, password: string },
  dockerhub: { username: string, password: string };
  fetchAdditionalRepositoriesLoading: boolean,
  githubRegistry: { nickname: string, token: string },
  hasNext: boolean,
  hiddingRepoMode: false,
  hiddingRepositories: Array<any>,
  imageName: string,
  loading: boolean;
  provider: Option<Provider>,
  repositories: Array<any>,
  syncingInProgress: boolean;
}

export default {
  name: 'ListPage',
  data (): State {
    return {
      provider: Option.None(),
      dockerRegistry: {
        url: '',
        username: '',
        password: '',
      },
      imageName: '',
      awsEcr: {
        accessKey: '',
        secretKey: '',
        region: '',
      },
      githubRegistry: {
        nickname: '',
        token: '',
      },
      dockerhub: {
        username: '',
        password: '',
      },
      fetchAdditionalRepositoriesLoading: false,
      hasNext: false,
      hiddingRepoMode: false,
      hiddingRepositories: [],
      loading: true,
      repositories: [],
      syncingInProgress: false,
    }
  },
  computed: {
    url (): string {
      return this.provider.match({
        Some: provider => match(provider)
          .with('aws-ecr', () => `AWS - ${this.repositories?.[0]?.url?.split('.')?.[0]} - ${this.awsEcr.region}`)
          .with('docker-registry-v2', () => this.dockerRegistry.url)
          .with('dockerhub', () => `DockerHub - ${this.dockerhub.username}`)
          .with('github-ecr', () => 'Github repository')
          .exhaustive(),
        None: () => ''
      })
    },
    filteredRepositories () {
      if (this.hiddingRepoMode) {
        return this.repositories
      }

      return this.repositories.filter((n) => {
        return !this.hiddingRepositories.includes(n.name)
      })
    },
  },
  async mounted () {
    if (!getCookie('fuzzy-engine-provider')) {
      setCookie('fuzzy-engine-provider', 'docker-registry-v2')
    }

    this.syncingInProgress = true
    this.searchImageByNameDebounce = debounce(this.searchImage, 400)

    const db = new DB()
    this.provider = Option.fromNullable(getCookie('fuzzy-engine-provider') as Provider)

    const storedData = db.findRepositories()
    if (storedData.isSome()) {
      this.loading = false
      this.repositories = storedData.get()
    }

    this.initFromCookies()
    this.hiddingRepositories = JSON.parse(localStorage.getItem('hiddingRepositories') || '[]')

    if (this.$route.query['delete-all'] === 'success') {
      this.deleteAllSuccess()
      this.$router.push('/list')
    }

    let repositories = []
    let hasNext = true
    while (hasNext) {
      const { data, hasNext: localHasNext } = await $fetch(
        `${new URL(window.location).origin}/api/repositories?offset=${repositories.length}&limit=10`,
        { credentials: 'include' }
      )

      repositories = [...repositories, ...data]
      hasNext = localHasNext
    }

    db.saveRepositoryImages(repositories)
    this.repositories = [...repositories]
    this.syncingInProgress = false
    this.loading = false
  },
  methods: {
    debounce,
    downloadUrl (repositoryName: string): string {
      return this.provider.match({
        Some: provider => match(provider)
          .with('aws-ecr', () => `${this.repositories[0].url}.dkr.ecr.${this.awsEcr.region}.amazonaws.com/${repositoryName}`)
          .with('docker-registry-v2', () => `${this.dockerRegistry.url}/${repositoryName}`)
          .with('dockerhub', () => `docker.io/${this.dockerhub.username}/${repositoryName}`)
          .with('github-ecr', () => `ghcr.io/${this.githubRegistry.nickname}/${repositoryName}`)
          .exhaustive(),
        None: () => 'Non available'
      })
    },
    initFromCookies () {
      if (getCookie('fuzzy-engine-github-ecr')) {
        const { nickname, token } = JSON.parse(atob(getCookie('fuzzy-engine-github-ecr')))
        this.githubRegistry.nickname = nickname
        this.githubRegistry.token = token
      }
      if (getCookie('fuzzy-engine-aws-ecr')) {
        const { accessKey, secretKey, region } = JSON.parse(atob(getCookie('fuzzy-engine-aws-ecr')))
        this.awsEcr.accessKey = accessKey
        this.awsEcr.secretKey = secretKey
        this.awsEcr.region = region
      }
      if (getCookie('fuzzy-engine-dockerhub')) {
        const { username, password } = JSON.parse(atob(getCookie('fuzzy-engine-dockerhub')))
        this.dockerhub.username = username
        this.dockerhub.password = password
      }
      if (getCookie('fuzzy-engine-docker-v2')) {
        const { url, username, password } = JSON.parse(atob(getCookie('fuzzy-engine-docker-v2')))
        this.dockerRegistry.url = url
        this.dockerRegistry.username = username
        this.dockerRegistry.password = password
      }
    },
    onCopy (repositoryName: string) {
      this.copiedSuccesfully()
      navigator.clipboard.writeText(this.downloadUrl(repositoryName))
    },
    async searchImage () {
      this.fetchAdditionalRepositoriesLoading = true

      const { data, hasNext } = await $fetch(
        `${new URL(window.location).origin}/api/repositories?limit=10&name=${this.imageName}`,
        { credentials: 'include' }
      )

      this.repositories = [...data]
      this.fetchAdditionalRepositoriesLoading = false
      this.hasNext = hasNext
    }
  },
  notifications: {
    copiedSuccesfully: {
      title: 'Copied!',
      type: 'success',
    },
    deleteAllSuccess: {
      title: 'Delete',
      message: 'Sucessfully deleted all the image for this repo',
      type: 'success',
    },
  },
}
</script>

<style scoped>
.docker-pull {
  width: 20rem;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid var(--color-theme);
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: var(--color-theme) transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
