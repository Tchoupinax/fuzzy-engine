import cookieparser from 'cookieparser';
import { serialize } from 'cookie';

export const state = () => {
  return {
    theme: 'one',
  };
};

export const mutations = {
  isLogged (state, bool) {
    state.isLogged = bool;
  },
  authenticate (state, { url, username, password }) {
    state.url = {
      env: process.env.DOCKER_REGISTRY_URL !== undefined,
      data: process.env.DOCKER_REGISTRY_URL || url.data,
    };
    state.username = {
      env: process.env.DOCKER_REGISTRY_USERNAME !== undefined,
      data: process.env.DOCKER_REGISTRY_USERNAME || username.data,
    };
    state.password = {
      env: process.env.DOCKER_REGISTRY_PASSWORD !== undefined,
      data: process.env.DOCKER_REGISTRY_PASSWORD || password.data,
    };
  },
  setTheme (state, theme) {
    state.theme = theme;
  },
};

export const actions = {
  nuxtServerInit: ({ commit }, { req, res, $axios, app: { $cookies, $apolloHelpers, apolloProvider } }) => {
    const { cookie } = req.headers;

    let data;
    if (cookie) {
      const { 'fuzzy-engine-ids': ids, 'fuzzy-engine-theme': theme } = cookieparser.parse(cookie);

      if (ids) {
        data = JSON.parse(Buffer.from(ids, 'base64').toString('utf-8') || '{}');
      }

      if (theme) {
        commit('setTheme', theme);
      }
    }

    data = data || {
      url: {
        env: process.env.DOCKER_REGISTRY_URL !== undefined,
        data: process.env.DOCKER_REGISTRY_URL,
      },
      username: {
        env: process.env.DOCKER_REGISTRY_USERNAME !== undefined,
        data: process.env.DOCKER_REGISTRY_USERNAME,
      },
      password: {
        env: process.env.DOCKER_REGISTRY_PASSWORD !== undefined,
        data: process.env.DOCKER_REGISTRY_PASSWORD,
      },
    };

    commit('authenticate', data);
    res.setHeader('Set-Cookie', [serialize('fuzzy-engine-ids', Buffer.from(JSON.stringify(data)).toString('base64'))]);
  },
};
