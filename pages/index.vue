<template>
  <div class="flex flex-col items-center justify-center flex-1 h-full mt-16 text-theme">
    <div>
      <h1 class="text-center title">
        fuzzy-engine
      </h1>
      <h2 class="text-center subtitle">
        Docker registry UI made with love
      </h2>

      <div class="flex justify-center w-full mt-16">
        <button
          class="px-4 py-2 font-bold text-white rounded bg-theme-lighter"
          :class="{
            'hover:bg-theme': connected,
            'bg-theme-lighter cursor-not-allowed': !connected
          }"
          :disabled="!connected"
          @click="openList"
        >
          Show Docker images
        </button>
      </div>

      <div class="flex justify-center mt-24">
        <form
          class="flex flex-col items-center justify-center w-full p-4"
          @submit="openList"
        >
          <input
            v-model="urlData"
            :disabled="urlEnv"
            type="text"
            class="w-2/3 p-1 px-2 mb-4 text-xl font-bold border rounded text-theme border-theme placeholder-theme-lighter"
            placeholder="registry.mydomain.com"
            @keyup="saveData"
          >

          <input
            v-model="usernameData"
            :disabled="usernameEnv"
            type="text"
            class="w-2/3 p-1 px-2 mb-4 text-xl font-bold border rounded text-theme border-theme placeholder-theme-lighter"
            placeholder="username"
            @keyup="saveData"
          >

          <div class="flex justify-center w-2/3">
            <input
              v-model="passwordData"
              class="w-full p-1 px-2 text-xl font-bold text-gray-700 border rounded-l text-theme border-theme docker-pull placeholder-theme-lighter"
              :type="revealed ? 'text': 'password'"
              placeholder="password"
              @keyup="saveData"
            >
            <button
              class="p-2 px-4 text-white border border-l-0 rounded-r border-theme bg-theme"
              type="button"
              @click="revealed = !revealed"
            >
              👁️
            </button>
          </div>

          <button class="invisible" type="submit" />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const { setCookie } = require('@/functions/cookies');

export default {
  data () {
    return {
      urlData: this.$store.state.url.data,
      urlEnv: this.$store.state.url.env,
      usernameData: this.$store.state.username.data,
      usernameEnv: this.$store.state.username.env,
      passwordData: this.$store.state.password.data,
      passwordEnv: this.$store.state.password.env,
      revealed: false,
    };
  },
  computed: {
    connected () {
      return this.urlData && this.urlData.length > 0 &&
      this.usernameData && this.usernameData.length > 0 &&
      this.passwordData && this.passwordData.length > 0;
    },
  },
  mounted () {
    if (this.$route.query.error === '401') {
      this.unauthorized();
      this.$router.push('/');
    } else if (this.$route.query.error === 'ENOTFOUND') {
      this.enotfound();
      this.$router.push('/');
    }
  },
  methods: {
    saveData () {
      setCookie('fuzzy-engine-ids', btoa(JSON.stringify({
        url: {
          data: this.urlData,
        },
        username: {
          data: this.usernameData,
        },
        password: {
          data: this.passwordData,
        },
      })));
    },
    openList (e) {
      e.preventDefault();
      window.location = '/list';
    },
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
};
</script>

<style>
.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 100px;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
