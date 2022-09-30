import VueNotifications from 'vue-notifications';
import Vue from 'vue';

import miniToastr from 'mini-toastr';

const toastTypes = {
  success: 'success',
  error: 'error',
  info: 'info',
  warn: 'warn',
};

miniToastr.init({ types: toastTypes, appendTarget: document.body });

function toast ({ title, message, type, timeout, cb }) {
  return miniToastr[type](message, title, timeout, cb);
}

const options = {
  success: toast,
  error: toast,
  info: toast,
  warn: toast,
};

Vue.use(VueNotifications, options);
