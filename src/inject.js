import Vue from 'vue';
import Inject from './Inject.vue';

import { StorageTokens } from './common/definitions';
import KoboService from './common/kobo';
import StorageService from './common/storage';
import { injectScript, runInPageContext } from './common/utils';

console.debug('Content Script Injection');

const properties = Object.values(StorageTokens);
const storageService = new StorageService({ properties });
const koboService = new KoboService(storageService);

document.getElementById('header').remove();
document.title = "Sign Into Kobo.com";

function insertCaptcha() {
  let extensionId = 'fmhmiaejopepamlcjkncpgpdjichnecm';
  let newCaptchaDiv = document.createElement('div');
  newCaptchaDiv.id = "new-grecaptcha-container";
  document.getElementById("grecaptcha-container").insertAdjacentElement('afterend', newCaptchaDiv);
  window.grecaptcha.render(newCaptchaDiv.id, {
    sitekey: '6LeEbUwUAAAAADJxtlhMsvgnR7SsFpMm4sirr1CJ',
    callback: (response) => {
      chrome.runtime.sendMessage(extensionId, { response });
    },
  });
}

function handleSignIn(args) {
  // koboService.
}

const vm = new Vue({
  data() {
    return {
      captcha: '',
    };
  },
  render(h) {
    return h(Inject, {
      props: { captcha: this.captcha },
      on: { signin: handleSignIn },
    });
  },
  provide: {
    koboService,
  },
  async mounted() {
    runInPageContext(insertCaptcha, 'insertCaptcha');
    injectScript(
      '//www.google.com/recaptcha/api.js?onload=insertCaptcha',
      'grecaptcha-script');

  },
}).$mount('#content');

chrome.runtime.onMessage
  .addListener((request) => {
    console.log(request.response);
    vm.$set(vm, 'captcha', request.response);
  });
