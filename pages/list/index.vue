<template>
  <div class="list-page min-h-screen pb-24">
    <div
      v-if="syncingInProgress"
      class="sync-toast fixed right-6 bottom-24 z-40 px-4 py-2 text-sm font-bold text-theme-default bg-white/90 border border-theme-default/40 rounded-lg backdrop-blur"
    >
      Sync in progress…
    </div>

    <section
      id="actions"
      class="flex items-center justify-between gap-4 px-6 pt-6 lg:px-10"
    >
      <NuxtLink
        to="/"
        class="font-bold text-theme-default transition-opacity hover:opacity-70"
      >
        ← Home
      </NuxtLink>

      <button
        v-if="isScaleway && !loading"
        type="button"
        class="px-3 py-1.5 text-sm font-bold text-theme-default border border-theme-default rounded-md transition-colors hover:bg-theme-default hover:text-white"
        @click="showCleanupModal = true"
      >
        Tag cleanup
      </button>
    </section>

    <div class="flex flex-col items-center px-4 pt-6 mb-24">
      <div class="w-full max-w-5xl text-theme-default">
        <header v-if="!loading" class="mb-10 text-center">
          <p class="text-xs font-bold tracking-[0.2em] uppercase text-theme-lighter">
            Registry
          </p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight lg:text-4xl break-all">
            {{ url }}
          </h1>
          <NuxtLink
            to="/list/last"
            class="inline-block mt-3 text-sm font-bold text-theme-default underline decoration-theme-lighter underline-offset-4 transition-colors hover:decoration-theme-default"
          >
            View last pushed images
          </NuxtLink>
        </header>

        <div
          v-if="!loading && filteredRepositories.length > 0"
          class="grid grid-cols-2 gap-3 mb-8 lg:grid-cols-4"
        >
          <div
            v-for="stat in statistics"
            :key="stat.label"
            class="stat-tile flex flex-col items-center justify-center px-3 py-4 rounded-xl border border-theme-default/30"
          >
            <span class="text-2xl font-bold tabular-nums lg:text-3xl">
              {{ stat.value }}
            </span>
            <span class="mt-1 text-xs font-medium text-theme-lighter">
              {{ stat.label }}
            </span>
          </div>
        </div>

        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-20"
        >
          <div class="lds-ring">
            <div />
            <div />
            <div />
            <div />
          </div>
          <p class="mt-10 max-w-md text-center text-lg font-medium text-theme-lighter">
            We sent our messengers to get the list of repositories. Please be
            patient.
          </p>
        </div>

        <div v-if="!loading" class="mb-6">
          <label class="sr-only" for="repo-search">Search repositories</label>
          <input
            id="repo-search"
            v-model="imageName"
            type="search"
            class="search-input w-full px-4 py-3 text-lg font-bold bg-white/80 border border-theme-default/40 rounded-xl text-theme-default placeholder-theme-lighter transition-shadow focus:outline-none focus:border-theme-default focus:ring-2 focus:ring-theme-lighter/50"
            placeholder="Search by image name…"
            @keyup="searchImageByNameDebounce"
          />
        </div>

        <div
          v-if="!loading && filteredRepositories.length === 0"
          class="py-16 text-center text-theme-lighter font-medium"
        >
          No repositories found.
        </div>

        <ul v-if="!loading" class="repo-list divide-y divide-theme-default/20">
          <li
            v-for="(repo, index) of filteredRepositories"
            :key="index"
            class="repo-row group flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            :class="{ 'opacity-50': hiddingRepositories.includes(repo.name) }"
          >
            <div class="min-w-0 flex-1 text-left">
              <div class="flex items-baseline gap-3">
                <span class="text-lg font-bold truncate sm:text-xl">
                  {{ repo.name }}
                </span>
                <span
                  v-if="repo.size"
                  class="shrink-0 text-sm font-medium text-theme-lighter"
                >
                  {{ repo.size }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 sm:gap-3">
              <div class="hidden xl:flex items-center">
                <input
                  class="docker-pull px-2 py-1.5 text-xs bg-white/70 text-theme-default border border-theme-default/40 rounded-l-md"
                  type="text"
                  readonly
                  :value="downloadUrl(repo.name)"
                />
                <button
                  class="px-3 py-1.5 bg-theme-lighter/20 border border-l-0 border-theme-default/40 rounded-r-md transition-colors hover:bg-theme-lighter/40"
                  type="button"
                  title="Copy pull URL"
                  @click="onCopy(repo.name)"
                >
                  <img
                    class="w-4 opacity-70"
                    src="https://clipboardjs.com/assets/images/clippy.svg"
                    alt=""
                  />
                </button>
              </div>

              <NuxtLink
                v-if="repo?.name"
                :external="true"
                :to="`/${repo.name?.replace(/\//g, '--slash--')}/tags`"
                class="px-3 py-1.5 text-sm font-bold whitespace-nowrap rounded-md border border-transparent transition-colors hover:border-theme-default/40 hover:bg-theme-lighter/15"
              >
                Show tags
                <span class="text-theme-lighter">({{ repo.countOfTags }})</span>
              </NuxtLink>

              <button
                v-if="isScaleway"
                type="button"
                class="p-1.5 rounded-md text-theme-lighter transition-colors hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                :disabled="deletingRepositories.includes(repo.name)"
                title="Remove repository"
                aria-label="Remove repository"
                @click="deleteRepository(repo.name)"
              >
                <svg
                  class="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </li>
        </ul>

        <section
          v-if="isScaleway && !loading"
          class="danger-zone mt-16 mb-8"
          aria-labelledby="danger-zone-title"
        >
          <div class="danger-zone-inner px-5 py-6 sm:px-6">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div class="max-w-xl">
                <p class="text-xs font-bold tracking-[0.18em] uppercase text-red-600">
                  Irreversible
                </p>
                <h2
                  id="danger-zone-title"
                  class="mt-1 text-xl font-bold text-red-700 sm:text-2xl"
                >
                  Danger zone
                </h2>
                <p class="mt-2 text-sm font-medium text-stone-600 leading-relaxed">
                  Permanently delete every repository in this registry, including
                  all tags.
                </p>
              </div>

              <button
                type="button"
                class="self-start shrink-0 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-md transition-all hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                :disabled="deleteAllInProgress || repositories.length === 0"
                @click="deleteAllRepositories"
              >
                {{
                  deleteAllInProgress
                    ? "Deleting all repositories…"
                    : "Delete all repositories"
                }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="showCleanupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 z-0 bg-black/50"
        @click="showCleanupModal = false"
      />

      <div
        class="relative z-10 w-full max-w-lg p-6 bg-white rounded-lg border-2 border-theme-default text-theme-default shadow-xl"
        role="dialog"
        aria-labelledby="cleanup-modal-title"
        aria-modal="true"
      >
        <button
          type="button"
          class="absolute top-4 right-4 text-2xl leading-none text-theme-lighter hover:text-theme-default"
          aria-label="Close"
          @click="showCleanupModal = false"
        >
          ×
        </button>

        <h2 id="cleanup-modal-title" class="text-xl font-bold pr-8">
          Tag cleanup
        </h2>
        <p class="mt-2 text-sm font-medium text-theme-lighter">
          Remove non-semver tags older than the selected duration across all
          repositories.
        </p>

        <div class="mt-6">
          <label class="block mb-2 text-sm font-bold">Older than</label>
          <div class="flex">
            <input
              v-model.number="cleanupDurationValue"
              type="number"
              min="1"
              class="w-24 p-2 px-3 text-sm font-bold bg-gray-50 border rounded-l text-theme-default border-theme-default"
            />
            <select
              v-model="cleanupDurationUnit"
              class="flex-1 p-2 px-3 text-sm font-bold bg-gray-50 border-y border-r text-theme-default border-theme-default"
            >
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button
            type="button"
            class="px-4 py-2 text-sm font-bold border rounded border-theme-default text-theme-default hover:bg-gray-50"
            :disabled="cleanupInProgress"
            @click="showCleanupModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-bold text-white rounded border border-theme-default bg-theme-default hover:opacity-90 disabled:opacity-50"
            :disabled="cleanupInProgress"
            @click="cleanupNonSemverTags"
          >
            {{ cleanupInProgress ? "Cleaning…" : "Run cleanup" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Option } from "@swan-io/boxed";
import { getCookie, setCookie } from "~~/functions/cookies";
import { syncServerConfig } from "~~/functions/server-config";
import debounce from "lodash.debounce";
import { match } from "ts-pattern";

import type { Provider } from "../../types/provider";

import { DB } from "../../functions/db";

type State = {
  awsEcr: { accessKey: string; secretKey: string; region: string };
  dockerRegistry: { url: string; username: string; password: string };
  dockerhub: { username: string; password: string };
  cleanupDurationUnit: "days" | "months" | "weeks";
  cleanupDurationValue: number;
  cleanupInProgress: boolean;
  deleteAllInProgress: boolean;
  deletingRepositories: Array<string>;
  showCleanupModal: boolean;
  fetchAdditionalRepositoriesLoading: boolean;
  githubRegistry: { nickname: string; token: string };
  scalewayRegistry: { url: string; token: string };
  hasNext: boolean;
  hiddingRepoMode: false;
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
      scalewayRegistry: {
        token: "",
        url: "",
      },
      cleanupDurationUnit: "days",
      cleanupDurationValue: 30,
      cleanupInProgress: false,
      deleteAllInProgress: false,
      deletingRepositories: [],
      showCleanupModal: false,
      fetchAdditionalRepositoriesLoading: false,
      hasNext: false,
      hiddingRepoMode: false,
      hiddingRepositories: [],
      loading: true,
      repositories: [],
      syncingInProgress: false,
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
            .with("scaleway-registry", () => "Scaleway Registry")
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
    isScaleway(): boolean {
      return this.provider.getWithDefault("_") === "scaleway-registry";
    },
    statistics() {
      const repos = this.filteredRepositories;
      const totalTags = repos.reduce(
        (sum, repo) => sum + (repo.countOfTags ?? 0),
        0,
      );
      const withTags = repos.filter((repo) => repo.countOfTags > 0).length;
      const avgTags = repos.length
        ? (totalTags / repos.length).toFixed(1)
        : "0";

      return [
        { label: "Repositories", value: repos.length },
        { label: "Total tags", value: totalTags },
        { label: "With tags", value: withTags },
        { label: "Avg tags / repo", value: avgTags },
      ];
    },
  },
  async mounted() {
    await syncServerConfig();

    if (!getCookie("fuzzy-engine-provider")) {
      setCookie("fuzzy-engine-provider", "docker-registry-v2");
    }

    this.syncingInProgress = true;
    this.searchImageByNameDebounce = debounce(this.searchImage, 400);

    const db = new DB();
    this.provider = Option.fromNullable(
      getCookie("fuzzy-engine-provider") as Provider,
    );

    const storedData = db.findRepositories();
    if (storedData.isSome()) {
      this.loading = false;
      this.repositories = storedData.get();
    }

    this.initFromCookies();
    this.hiddingRepositories = JSON.parse(
      localStorage.getItem("hiddingRepositories") || "[]",
    );

    if (this.$route.query["delete-all"] === "success") {
      this.deleteAllSuccess();
      this.$router.push("/list");
    }

    await this.loadRepositories();
  },
  methods: {
    debounce,
    async loadRepositories() {
      this.syncingInProgress = true;

      const db = new DB();
      let repositories = [];
      const provider = getCookie("fuzzy-engine-provider");

      if (provider === "scaleway-registry") {
        const { data } = await $fetch(
          `${new URL(window.location.toString()).origin}/api/repositories?offset=0&limit=10`,
          { credentials: "include" },
        );
        repositories = data;
      } else {
        let hasNext = true;
        while (hasNext) {
          const { data, hasNext: localHasNext } = await $fetch(
            `${new URL(window.location.toString()).origin}/api/repositories?offset=${repositories.length}&limit=10`,
            { credentials: "include" },
          );

          repositories = [...repositories, ...data];
          hasNext = localHasNext;
        }
      }

      db.saveRepositoryImages(repositories);
      this.repositories = [...repositories];
      this.syncingInProgress = false;
      this.loading = false;
    },
    async deleteRepository(repositoryName: string) {
      if (
        !window.confirm(
          `Delete repository ${repositoryName} and all its tags? This cannot be undone.`,
        )
      ) {
        return;
      }

      this.deletingRepositories = [
        ...this.deletingRepositories,
        repositoryName,
      ];

      try {
        await $fetch(
          `${new URL(window.location.toString()).origin}/api/repositories/${repositoryName.replace(/\//g, "--slash--")}`,
          {
            credentials: "include",
            method: "DELETE",
          },
        );

        this.repositories = this.repositories.filter(
          (repo) => repo.name !== repositoryName,
        );
        this.deleteAllSuccess();
      } catch {
        this.deleteRepositoryFailed();
      } finally {
        this.deletingRepositories = this.deletingRepositories.filter(
          (name) => name !== repositoryName,
        );
      }
    },
    async deleteAllRepositories() {
      const count = this.repositories.length;
      if (
        !window.confirm(
          `Delete ALL ${count} repositories and every tag in this registry? This cannot be undone.`,
        )
      ) {
        return;
      }

      if (
        !window.confirm(
          "Final confirmation: permanently delete every repository?",
        )
      ) {
        return;
      }

      this.deleteAllInProgress = true;

      try {
        const result = await $fetch(
          `${new URL(window.location.toString()).origin}/api/repositories/delete-all`,
          {
            body: { confirm: "DELETE ALL" },
            credentials: "include",
            method: "POST",
          },
        );

        const failedCount = result.failed?.length ?? 0;
        this.deleteAllRepositoriesSuccess({
          message: `Deleted ${result.deleted} repository(ies)${failedCount > 0 ? ` (${failedCount} failed)` : ""}`,
        });
        await this.loadRepositories();
      } catch {
        this.deleteAllRepositoriesFailed();
      } finally {
        this.deleteAllInProgress = false;
      }
    },
    async cleanupNonSemverTags() {
      if (
        !window.confirm(
          `Delete all non-semver tags older than ${this.cleanupDurationValue} ${this.cleanupDurationUnit}?`,
        )
      ) {
        return;
      }

      this.cleanupInProgress = true;

      try {
        const result = await $fetch(
          `${new URL(window.location.toString()).origin}/api/repositories/cleanup-non-semver`,
          {
            body: {
              durationUnit: this.cleanupDurationUnit,
              durationValue: this.cleanupDurationValue,
            },
            credentials: "include",
            method: "POST",
          },
        );

        const failedCount = result.failed?.length ?? 0;
        this.cleanupSuccess({
          message: `Deleted ${result.deleted} tag(s) out of ${result.scanned} scanned${failedCount > 0 ? ` (${failedCount} failed)` : ""}`,
        });
        this.showCleanupModal = false;
        await this.loadRepositories();
      } catch {
        this.cleanupFailed();
      } finally {
        this.cleanupInProgress = false;
      }
    },
    downloadUrl(repositoryName: string): string {
      return this.provider.match({
        Some: (provider) =>
          match(provider)
            .with(
              "aws-ecr",
              () =>
                `${this.repositories[0].url}.dkr.ecr.${this.awsEcr.region}.amazonaws.com/${repositoryName}`,
            )
            .with(
              "docker-registry-v2",
              () => `${this.dockerRegistry.url}/${repositoryName}`,
            )
            .with(
              "dockerhub",
              () => `docker.io/${this.dockerhub.username}/${repositoryName}`,
            )
            .with(
              "github-ecr",
              () => `ghcr.io/${this.githubRegistry.nickname}/${repositoryName}`,
            )
            .with("scaleway-registry", () => `${this.scalewayRegistry.url}/${repositoryName}`)
            .exhaustive(),
        None: () => "Non available",
      });
    },
    initFromCookies() {
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
      if (getCookie("fuzzy-engine-scaleway-registry")) {
        const { url, token } = JSON.parse(
          atob(getCookie("fuzzy-engine-scaleway-registry")),
        );
        this.scalewayRegistry.url = url;
        this.scalewayRegistry.token = token;
      }
    },
    onCopy(repositoryName: string) {
      this.copiedSuccesfully();
      navigator.clipboard.writeText(this.downloadUrl(repositoryName));
    },
    async searchImage() {
      this.fetchAdditionalRepositoriesLoading = true;

      const { data, hasNext } = await $fetch(
        `${new URL(window.location.toString()).origin}/api/repositories?limit=10&name=${this.imageName}`,
        { credentials: "include" },
      );

      this.repositories = [...data];
      this.fetchAdditionalRepositoriesLoading = false;
      this.hasNext = hasNext;
    },
  },
  notifications: {
    copiedSuccesfully: {
      title: "Copied!",
      type: "success",
    },
    deleteAllSuccess: {
      title: "Delete",
      message: "Successfully deleted the repository",
      type: "success",
    },
    deleteRepositoryFailed: {
      title: "Delete failed",
      message: "Could not delete the repository",
      type: "error",
    },
    deleteAllRepositoriesSuccess: {
      title: "Delete all complete",
      message: "Repositories deleted",
      type: "success",
    },
    deleteAllRepositoriesFailed: {
      title: "Delete all failed",
      message: "Could not delete all repositories",
      type: "error",
    },
    cleanupSuccess: {
      title: "Cleanup complete",
      message: "Cleanup finished",
      type: "success",
    },
    cleanupFailed: {
      title: "Cleanup failed",
      message: "Could not delete non-semver tags",
      type: "error",
    },
  },
};
</script>

<style scoped>
.list-page {
  background:
    radial-gradient(
      1200px 500px at 50% -10%,
      color-mix(in srgb, var(--color-theme-lighter) 28%, transparent),
      transparent 70%
    ),
    linear-gradient(180deg, #fafafa 0%, #ffffff 40%, #f7f7f8 100%);
}

.stat-tile {
  background: color-mix(in srgb, var(--color-theme-lighter) 12%, white);
  transition: transform 180ms ease, border-color 180ms ease;
}

.stat-tile:hover {
  transform: translateY(-2px);
  border-color: var(--color-theme);
}

.repo-row {
  transition: background-color 160ms ease;
  border-radius: 0.75rem;
  padding-inline: 0.75rem;
  margin-inline: -0.75rem;
}

.repo-row:hover {
  background: color-mix(in srgb, var(--color-theme-lighter) 10%, transparent);
}

.danger-zone-inner {
  border: 1.5px dashed color-mix(in srgb, #ef4444 55%, transparent);
  border-radius: 1rem;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, #ef4444 6%, white),
      color-mix(in srgb, #ef4444 2%, white)
    );
}

.sync-toast {
  animation: sync-in 220ms ease-out;
}

.docker-pull {
  width: 18rem;
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

@keyframes sync-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
