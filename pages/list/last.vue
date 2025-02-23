<template>
  <div>
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
    </section>

    <div class="flex flex-col items-center justify-center mb-40">
      <div class="w-full lg:w-8/12">
        <div
          class="flex flex-col items-center justify-center mb-40 text-theme-default"
        >
          <div v-if="!loading" class="mb-16 mt-8 xl:mt-0 text-4xl text-center">
            <p>
              {{ url }}
            </p>

            <NuxtLink to="/list" class="text-sm underline">
              View repositories
            </NuxtLink>
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
            <div class="flex items-center justify-center">
              <p class="mr-4 text-xs italic text-right">
                {{ timeago(repo.createdAt) }}
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

<script lang="ts">
import { match } from "ts-pattern";
import { Option } from "@swan-io/boxed";
import * as timeago from "timeago.js";
import type { Provider } from "../../types/provider";
import { DB } from "../../functions/db";
import { getCookie } from "~~/functions/cookies";

type State = {
  awsEcr: { accessKey: string; secretKey: string; region: string };
  dockerRegistry: { url: string; username: string; password: string };
  dockerhub: { username: string; password: string };
  fetchAdditionalRepositoriesLoading: boolean;
  githubRegistry: { nickname: string; token: string };
  hiddingRepoMode: boolean;
  hiddingRepositories: Array<any>;
  imageName: string;
  loading: boolean;
  provider: Option<Provider>;
  repositories: Array<any>;
  syncingInProgress: boolean;
};

export default {
  name: "ListPage",
  data(): State {
    return {
      provider: Option.None(),
      dockerRegistry: {
        url: "",
        username: "",
        password: "",
      },
      imageName: "",
      awsEcr: {
        accessKey: "",
        secretKey: "",
        region: "",
      },
      githubRegistry: {
        nickname: "",
        token: "",
      },
      dockerhub: {
        username: "",
        password: "",
      },
      fetchAdditionalRepositoriesLoading: false,
      hiddingRepoMode: false,
      hiddingRepositories: [],
      repositories: [],
      syncingInProgress: false,
      loading: true,
    };
  },
  computed: {
    url(): string {
      return this.provider.match({
        Some: (provider) =>
          match(provider)
            .with(
              "aws-ecr",
              () =>
                `AWS - ${this.repositories?.[0]?.url?.split(".")?.[0]} - ${this.awsEcr.region}`,
            )
            .with("docker-registry-v2", () => this.dockerRegistry.url)
            .with("dockerhub", () => `DockerHub - ${this.dockerhub.username}`)
            .with("github-ecr", () => "Github repository")
            .with("scaleway-registry", () => "Scaleway repository")
            .exhaustive(),
        None: () => "",
      });
    },
    filteredRepositories() {
      if (this.hiddingRepoMode) {
        return this.repositories;
      }

      return this.repositories.filter((n) => {
        return !this.hiddingRepositories.includes(n.name);
      });
    },
  },
  async mounted() {
    const db = new DB();
    this.provider = Option.fromNullable(
      getCookie("fuzzy-engine-provider") as Provider,
    );

    const storedData = db.findLatestRepositories();
    if (storedData.isSome()) {
      this.syncingInProgress = true;
      this.repositories = storedData.get();
      this.loading = false;
    }

    if (getCookie("fuzzy-engine-github-ecr")) {
      const { nickname, token } = JSON.parse(
        atob(getCookie("fuzzy-engine-github-ecr")),
      );
      this.githubRegistry.nickname = nickname;
      this.githubRegistry.token = token;
    }

    if (getCookie("fuzzy-engine-aws-ecr")) {
      const { accessKey, secretKey, region } = JSON.parse(
        atob(getCookie("fuzzy-engine-aws-ecr")),
      );
      this.awsEcr.accessKey = accessKey;
      this.awsEcr.secretKey = secretKey;
      this.awsEcr.region = region;
    }

    if (getCookie("fuzzy-engine-dockerhub")) {
      const { username, password } = JSON.parse(
        atob(getCookie("fuzzy-engine-dockerhub")),
      );
      this.dockerhub.username = username;
      this.dockerhub.password = password;
    }

    if (getCookie("fuzzy-engine-docker-v2")) {
      const { url, username, password } = JSON.parse(
        atob(getCookie("fuzzy-engine-docker-v2")),
      );
      this.dockerRegistry.url = url;
      this.dockerRegistry.username = username;
      this.dockerRegistry.password = password;
    }

    const data = await $fetch(
      `${new URL((window as any).location).origin}/api/repositories/latest`,
      { credentials: "include" },
    );

    const repositories = db.saveLatestRepositories(data);
    if (repositories.isSome()) {
      this.repositories = repositories.get();
    }

    this.loading = false;
    this.syncingInProgress = false;
  },
  methods: {
    timeago: timeago.format,
    downloadUrl(repositoryName: string) {
      // @ts-ignore
      return `docker pull ${this.$store.state.url.data}/${repositoryName}`;
    },
    toggleHiddingRepoMode() {
      this.hiddingRepoMode = !this.hiddingRepoMode;
      if (!this.hiddingRepoMode) {
        localStorage.setItem(
          "hiddingRepositories",
          JSON.stringify(this.hiddingRepositories),
        );
      }
    },
    onCopy() {
      // @ts-ignore
      this.copiedSuccesfully();
    },
    hideRepo(name: string) {
      this.hiddingRepositories.push(name);
    },
    showRepo(name: string) {
      this.hiddingRepositories.splice(
        this.hiddingRepositories.findIndex((n) => n === name),
        1,
      );
    },
    deleteAllImage(repositoryName: string) {
      if (
        window.confirm(
          `Do you really want to delete all tags in ${repositoryName}`,
        )
      ) {
        // @ts-ignore
        window.location = `/${repositoryName}/delete-all)`;
      }
    },
  },
  notifications: {
    copiedSuccesfully: {
      title: "Copied!",
      type: "success",
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
