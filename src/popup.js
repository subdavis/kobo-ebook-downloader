import Vue from 'vue'

import App from './Popup.vue'
import { inject } from "./common/utils";
import { StorageTokens } from './common/definitions';
import KoboService from './common/kobo';
import StorageService from './common/storage';

const properties = Object.values(StorageTokens);
const storageService = new StorageService({ properties });
const koboService = new KoboService(storageService);

Vue.config.productionTip = false;

async function init() {
  if (await koboService.isLoggedIn()) {
    new Vue({
      render: h => h(App),
      provide: { koboService },
    }).$mount('#app');
  } else {
    await inject();
    window.close();
  }
}

init();
