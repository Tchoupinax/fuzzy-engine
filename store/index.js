import cookieparser from 'cookieparser';
import { serialize } from 'cookie';

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
};

export const actions = {
  nuxtServerInit: ({ commit }, { req, res, $axios, app: { $cookies, $apolloHelpers, apolloProvider } }) => {
    const { cookie } = req.headers;

    if (cookie) {
      const { ids } = cookieparser.parse(cookie);

      const data = JSON.parse(Buffer.from(ids, 'base64').toString('utf-8') || '{}');

      commit('authenticate', data);
    } else {
      const data = {
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

      res.setHeader('Set-Cookie', [serialize('ids', Buffer.from(JSON.stringify(data)).toString('base64'))]);
    }
  },
};
