import Vue from 'vue'

import App from './Popup.vue'
import { inject } from "./common/messenger";
import { StorageTokens } from './common/definitions';
import KoboService from './common/kobo';
import StorageService from './common/storage';

const properties = Object.values(StorageTokens);
const storageService = new StorageService({ properties });
const koboService = new KoboService(storageService);

Vue.config.productionTip = false

function makeVue() {
  return new Vue({
    render: h => h(App),
    provide: {
      koboService,
    },
  }).$mount('#app');
}

koboService
  .isLoggedIn()
  .then(loggedin => loggedin
    ? makeVue()
    : inject().then(() => window.close())
  );
