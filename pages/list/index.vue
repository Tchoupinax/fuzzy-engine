<template>
  <div>
    <section id="actions" class="flex justify-between mt-6 ml-8">
      <NuxtLink to="/">
        <button class="font-bold text-theme-default hover:text-theme-default">
          Home
        </button>
      </NuxtLink>

      <div class="mr-8">
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
      </div>
    </section>

    <div class="flex flex-col items-center justify-center mb-40">
      <div class="w-full lg:w-8/12">
        <div class="flex flex-col items-center justify-center mb-40 text-theme-default">
          <div class="mb-24 text-4xl text-center">
            <p>
              {{ url }}
            </p>

            <NuxtLink to="/list/last" class="text-sm underline">
              View last pushed images
            </NuxtLink>
          </div>

          <div v-if="loading" class="lds-ring">
            <div /><div /><div /><div />
          </div>

          <div
            v-for="(repo, index) of filteredRepositories"
            v-else
            :key="index"
            class="flex items-center justify-between w-full px-4 py-4 text-sm font-bold text-center whitespace-no-wrap border-b border-theme-default"
            :class="{ 'opacity-50': hiddingRepositories.includes(repo.name) }"
          >
            <div class="w-5/12 text-xl text-left truncate">
              {{ repo.name }}
            </div>

            <!-- Right -->
            <div class="flex items-center">
              <div class="flex mr-8">
                <input
                  class="px-2 text-xs text-gray-700 border border-gray-700 rounded-l docker-pull"
                  type="text"
                  :value="downloadUrl(repo.name)"
                >

                <button
                  v-clipboard:copy="`${url}/${repo.name}`"
                  v-clipboard:success="onCopy"
                  class="p-2 px-4 bg-gray-200 border border-l-0 border-gray-700 rounded-r"
                  type="button"
                >
                  <img
                    class="w-4"
                    src="https://clipboardjs.com/assets/images/clippy.svg"
                    alt=""
                  >
                </button>
              </div>

              <div class="flex items-center justify-end text-right w-28">
                <NuxtLink :to="`/${repo.name.replace(/\//g, '-')}/tags`">
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

<script>
const { getCookie } = require('@/functions/cookies');

export default {
  name: 'ListPage',
  data () {
    return {
      provider: undefined,
      dockerRegistry: {
        url: '',
        username: '',
        password: '',
      },
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
      loading: true,
      hiddingRepoMode: false,
      hiddingRepositories: [],
      repositories: [],
    };
  },
  computed: {
    url () {
      if (this.repositories.length > 0) {
        if (this.provider === 'aws-ecr') {
          return `AWS - ${this.repositories[0].url.split('.')[0]} - ${this.awsEcr.region}`;
        }

        if (this.provider === 'docker-registry-v2') {
          return this.dockerRegistry.url;
        }

        if (this.provider === 'dockerhub') {
          return `DockerHub - ${this.dockerhub.username}`;
        }

        return 'Github repository';
      }

      return '-';
    },

    filteredRepositories () {
      if (this.hiddingRepoMode) {
        return this.repositories;
      }

      return this.repositories.filter((n) => {
        return !this.hiddingRepositories.includes(n.name);
      });
    },
  },
  async mounted () {
    if (getCookie('fuzzy-engine-github-ecr')) {
      const { nickname, token } = JSON.parse(Buffer.from(getCookie('fuzzy-engine-github-ecr'), 'base64'));
      this.githubRegistry.nickname = nickname;
      this.githubRegistry.token = token;
    }

    if (getCookie('fuzzy-engine-aws-ecr')) {
      const { accessKey, secretKey, region } = JSON.parse(Buffer.from(getCookie('fuzzy-engine-aws-ecr'), 'base64'));
      this.awsEcr.accessKey = accessKey;
      this.awsEcr.secretKey = secretKey;
      this.awsEcr.region = region;
    }

    if (getCookie('fuzzy-engine-docker-v2')) {
      const { url, username, password } = JSON.parse(Buffer.from(getCookie('fuzzy-engine-docker-v2'), 'base64') ?? '{}');
      this.dockerRegistry.url = url;
      this.dockerRegistry.username = username;
      this.dockerRegistry.password = password;
    }

    if (getCookie('fuzzy-engine-dockerhub')) {
      const { url, username, password } = JSON.parse(Buffer.from(getCookie('fuzzy-engine-dockerhub'), 'base64') ?? '{}');
      this.dockerhub.username = username;
      this.dockerhub.password = password;
    }

    this.provider = getCookie('fuzzy-engine-provider');

    this.hiddingRepositories = JSON.parse(localStorage.getItem('hiddingRepositories') || '[]');
    this.loading = false;

    if (this.$route.query['delete-all'] === 'success') {
      this.deleteAllSuccess();
      this.$router.push('/list');
    }

    const { data } = await this.$axios.get('/api/repositories', { withCredentials: true });

    this.repositories = data.sort((a, b) => {
      if (a.name > b.name) { return 1; }
      if (a.name < b.name) { return -1; }
    });
  },
  methods: {
    downloadUrl (repo) {
      if (this.provider === 'aws-ecr') {
        return `${this.repositories[0].url}.dkr.ecr.${this.awsEcr.region}.amazonaws.com/${repo}`;
      }

      if (this.provider === 'dockerhub') {
        return `docker.io/${this.dockerhub.username}/${repo}`;
      }

      return `/${repo}`;
    },

    toggleHiddingRepoMode () {
      this.hiddingRepoMode = !this.hiddingRepoMode;
      if (!this.hiddingRepoMode) {
        localStorage.setItem('hiddingRepositories', JSON.stringify(this.hiddingRepositories));
      }
    },

    onCopy () {
      this.copiedSuccesfully();
    },
    hideRepo (name) {
      this.hiddingRepositories.push(name);
    },
    showRepo (name) {
      this.hiddingRepositories.splice(this.hiddingRepositories.findIndex(n => n === name), 1);
    },
    deleteAllImage (repoName) {
      if (window.confirm(`Do you really want to delete all tags in ${repoName}`)) {
        window.location = `/${repoName}/delete-all`;
      }
    },
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
};
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
