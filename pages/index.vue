<template>
  <div
    class="flex flex-col items-center justify-center flex-1 h-full mt-16 mb-32 text-theme-default"
  >
    <div>
      <h1 class="text-center title">
        fuzzy-engine
      </h1>

      <h2 class="text-center subtitle">
        Docker registry UI made with love
      </h2>

      <div class="flex items-center justify-center mt-16 mb-16 mr-8">
        <div
          v-for="({ name, image }) of providers"
          :key="name"
          class="flex items-center justify-center w-32 p-4 ml-8 border-4 cursor-pointer"
          :class="{
            'border-theme-lighter': provider === name,
            'hover:border-indigo-400 border-transparent': provider !== name
          }"
          @click="changeProvider(name)"
        >
          <img
            class="w-auto h-24"
            :src="image"
          >
        </div>
      </div>

      <div class="flex justify-center w-full mt-16">
        <button
          v-if="provider"
          class="px-4 py-2 font-bold text-white rounded bg-theme-lighter"
          :class="{
            'hover:bg-theme-default': connected,
            'bg-theme-lighter cursor-not-allowed': !connected,
          }"
          :disabled="!connected"
          @click="openList"
        >
          Show Docker images
        </button>
      </div>

      <div class="flex justify-center mt-8">
        <form class="w-full" @submit="openList">
          <div
            v-if="provider === 'docker-registry-v2'"
            class="flex flex-col items-center justify-center w-full p-4"
          >
            <input
              v-model="dockerRegistry.url"
              type="url"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="registry.mydomain.com"
              @keyup="saveData"
            >

            <input
              v-if="!dockerRegistry.passwordless"
              v-model="dockerRegistry.username"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="username"
              @keyup="saveData"
            >

            <div
              v-if="!dockerRegistry.passwordless"
              class="flex justify-center w-full mb-4"
            >
              <input
                v-model="dockerRegistry.password"
                class="w-full p-1 px-2 text-xl font-bold border rounded-l text-theme-default border-theme-default docker-pull placeholder-theme-lighter"
                :type="revealed ? 'text' : 'password'"
                placeholder="password"
                @keyup="saveData"
              >
              <button
                class="p-2 px-4 text-white border border-l-0 rounded-r border-theme-default bg-theme-default"
                type="button"
                @click="revealed = !revealed"
              >
                <div class="w-4">
                  <svg
                    v-if="!revealed"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </button>
            </div>

            <div class="flex">
              <input
                id="passwordless"
                v-model="dockerRegistry.passwordless"
                type="checkbox"
                class="mr-2"
                @keyup="saveData"
              >

              <label for="passwordless" class="flex w-full italic font-bold cursor-pointer">
                Use passwordless auth
              </label>
            </div>
          </div>

          <div
            v-if="provider === 'dockerhub'"
            class="flex flex-col items-center justify-center w-full p-4"
          >
            <input
              v-model="dockerhub.username"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="username"
              @keyup="saveData"
            >

            <div
              class="flex justify-center w-full mb-4"
            >
              <input
                v-model="dockerhub.password"
                class="w-full p-1 px-2 text-xl font-bold border rounded-l text-theme-default border-theme-default docker-pull placeholder-theme-lighter"
                :type="revealed ? 'text' : 'password'"
                placeholder="password"
                @keyup="saveData"
              >
              <button
                class="p-2 px-4 text-white border border-l-0 rounded-r border-theme-default bg-theme-default"
                type="button"
                @click="revealed = !revealed"
              >
                <div class="w-4">
                  <svg
                    v-if="!revealed"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div
            v-if="provider === 'aws-ecr'"
            class="flex flex-col items-center justify-center w-full p-4"
          >
            <label
              v-if="awsEcr.localAuthentication.length > 0"
              class="text-xl mb-4"
            >
              <input
                v-model="awsEcr.useLocalAuthentication"
                type="checkbox"
                @change="saveData"
              >
              Use local AWS authentication <br>({{ awsEcr.localAuthentication }})
            </label>

            <input
              v-model="awsEcr.region"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="region"
              @keyup="saveData"
            >

            <input
              v-if="!awsEcr.useLocalAuthentication"
              v-model="awsEcr.accessKey"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="access-key"
              @keyup="saveData"
            >

            <div v-if="!awsEcr.useLocalAuthentication" class="flex justify-center w-full">
              <input
                v-model="awsEcr.secretKey"
                class="w-full p-1 px-2 text-xl font-bold border rounded-l text-theme-default border-theme-default docker-pull placeholder-theme-lighter"
                :type="revealed ? 'text' : 'password'"
                placeholder="secret-key"
                @keyup="saveData"
              >
              <button
                class="p-2 px-4 text-white border border-l-0 rounded-r border-theme-default bg-theme-default"
                type="button"
                @click="revealed = !revealed"
              >
                <div class="w-4">
                  <svg
                    v-if="!revealed"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div
            v-if="provider === 'github-ecr'"
            class="flex flex-col items-center justify-center w-full p-4"
          >
            <input
              v-model="githubRegistry.nickname"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="Github nickname"
              @keyup="saveData"
            >

            <div class="flex justify-center w-full">
              <input
                v-model="githubRegistry.token"
                class="w-full p-1 px-2 text-xl font-bold border rounded-l text-theme-default border-theme-default docker-pull placeholder-theme-lighter"
                :type="revealed ? 'text' : 'password'"
                placeholder="token"
                @keyup="saveData"
              >
              <button
                class="p-2 px-4 text-white border border-l-0 rounded-r border-theme-default bg-theme-default"
                type="button"
                @click="revealed = !revealed"
              >
                <div class="w-4">
                  <svg
                    v-if="!revealed"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <button class="invisible" type="submit" />
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Provider } from '../types/provider'
import { getCookie, setCookie } from '~~/functions/cookies'

export default {
  name: 'IndexPage',
  data () {
    return {
      provider: 'docker-registry-v2',
      providers: [
        {
          name: 'docker-registry-v2',
          image: 'data:image/jpeg;base64,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',
        },
        {
          name: 'dockerhub',
          image: 'https://gitlab.com/uploads/-/system/project/avatar/22180576/dockerhub.png',
        },
        {
          name: 'aws-ecr',
          image: 'https://bobcares.com/wp-content/uploads/2022/04/Amazon_Elastic_Container_Registry__ECR_.png',
        },
        {
          name: 'github-ecr',
          image: 'data:image/png;base64,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',
        },
      ],
      revealed: false,
      dockerRegistry: {
        url: '',
        username: '',
        password: '',
        passwordless: false,
      },
      dockerhub: {
        username: '',
        password: '',
      },
      awsEcr: {
        accessKey: '',
        secretKey: '',
        region: '',
        useLocalAuthentication: false,
        localAuthentication: ''
      },
      githubRegistry: {
        nickname: '',
        token: '',
      },
    }
  },
  computed: {
    connected () {
      if (this.provider === 'aws-ecr') {
        return (
          (
            this.awsEcr.region?.length > 0 &&
            this.awsEcr.accessKey?.length > 0 &&
            this.awsEcr.secretKey?.length > 0
          ) || (
            this.awsEcr.region?.length > 0 &&
            this.awsEcr.useLocalAuthentication
          )
        )
      }

      if (this.provider === 'github-ecr') {
        return this.githubRegistry.token.length > 0 &&
          this.githubRegistry.nickname.length > 0
      }

      if (this.provider === 'dockerhub') {
        return this.dockerhub.username.length > 0 &&
          this.dockerhub.password.length > 0
      }

      return (
        this.dockerRegistry.url?.length > 0 &&
          (this.dockerRegistry.passwordless || (
            this.dockerRegistry.username?.length > 0 &&
            this.dockerRegistry.password?.length > 0)
          )
      )
    },
  },
  mounted () {
    this.checkAwsLocalAuthentication()

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

    if (this.$route.query.provider) {
      setCookie('fuzzy-engine-provider', this.$route.query.provider)
    }

    this.provider = getCookie('fuzzy-engine-provider')
  },
  methods: {
    saveData () {
      setCookie(
        'fuzzy-engine-ids',
        btoa(
          JSON.stringify({
            url: {
              data: this.urlData,
            },
            username: {
              data: this.usernameData,
            },
            password: {
              data: this.passwordData,
            },
          }),
        ),
      )

      setCookie(
        'fuzzy-engine-aws-ecr',
        btoa(
          JSON.stringify({
            ...this.awsEcr,
          }),
        ),
      )

      setCookie(
        'fuzzy-engine-github-ecr',
        btoa(
          JSON.stringify({
            ...this.githubRegistry,
          }),
        ),
      )

      setCookie(
        'fuzzy-engine-dockerhub',
        btoa(
          JSON.stringify({
            ...this.dockerhub,
          }),
        ),
      )

      setCookie(
        'fuzzy-engine-docker-v2',
        btoa(
          JSON.stringify({
            ...this.dockerRegistry,
          }),
        ),
      )
    },
    openList (e) {
      e.preventDefault()
      this.$router.push('/list')
    },
    changeProvider (provider: Provider) {
      this.provider = provider
      setCookie('fuzzy-engine-provider', this.provider)
    },
    async checkAwsLocalAuthentication () {
      const data: any = await $fetch(
        `${new URL((window as any).location).origin}/api/authentication/aws-local`,
      )

      if (data.connected) {
        this.awsEcr.localAuthentication = data.identity
        this.awsEcr.useLocalAuthentication = true
      }
    }
  },
  notifications: {
    unauthorized: {
      title: 'Error',
      message: '401 - Unauthorized',
      type: 'error',
    },
    enotfound: {
      title: 'Error',
      message: 'Domain not found',
      type: 'error',
    },
  },
}
</script>

<style>
.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 80px;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 30px;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
