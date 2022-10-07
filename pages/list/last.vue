<template>
  <div>
    <section id="actions" class="flex justify-between mt-6 ml-8">
      <NuxtLink to="/">
        <button class="font-bold text-theme-default hover:text-theme-default">
          Home
        </button>
      </NuxtLink>
    </section>

    <div class="flex flex-col items-center justify-center mb-40">
      <div class="w-full lg:w-8/12">
        <div class="flex flex-col items-center justify-center mb-40 text-theme-default">
          <div class="mb-24 text-4xl text-center">
            <p>
              {{ url }}
            </p>

            <NuxtLink to="/list" class="text-sm underline">
              View repositories
            </NuxtLink>
          </div>

          <div v-if="loading" class="lds-ring">
            <div /><div /><div /><div />
          </div>

          <div
            v-for="(repo, index) of filteredRepositories"
            v-else
            :key="index"
            class="flex items-center justify-between w-full px-4 py-2 text-sm font-bold text-center whitespace-no-wrap border-b border-theme-default"
            :class="{ 'opacity-50': hiddingRepositories.includes(repo.name) }"
          >
            <div class="w-5/12 text-xl text-left truncate">
              {{ repo.name }}
            </div>

            <div class="flex items-center justify-center">
              <p class="mr-4 text-xs italic text-right">
                {{ timeago(repo.created) }}
              </p>

              <div class="relative flex justify-end">
                <div class="p-1 px-2 mx-1 bg-gray-200 rounded-lg">
                  {{ repo.tag }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as timeago from 'timeago.js';
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

    this.provider = getCookie('fuzzy-engine-provider');

    this.hiddingRepositories = JSON.parse(localStorage.getItem('hiddingRepositories') || '[]');
    this.loading = false;

    if (this.$route.query['delete-all'] === 'success') {
      this.deleteAllSuccess();
      this.$router.push('/list');
    }

    const { data } = await this.$axios.get(`${new URL(window.location).origin}/api/repositories/latest`, { withCredentials: true });
    this.repositories = data;
  },
  methods: {
    timeago: timeago.format,
    downloadUrl (repo) {
      if (this.$store.state.provider === 'aws-ecr') {
        return `docker pull 440562349563.dkr.ecr.${this.$store.state.awsEcr.region}.amazonaws.com/${repo}`;
      }

      return `docker pull ${this.$store.state.url.data}/${repo}`;
    },
    toggleHiddingRepoMode () {
      this.hiddingRepoMode = !this.hiddingRepoMode;
      if (!this.hiddingRepoMode) {
        localStorage.setItem('hiddingRepositories', JSON.stringify(this.hiddingRepositories));
      }
    },
    onCopy (e) {
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
  width: 22rem;
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
