import Vue from 'vue';
import Inject from './Inject.vue';

import { StorageTokens } from './common/definitions';
import KoboService from './common/kobo';
import StorageService from './common/storage';
import { addInPageContext, injectScript, backgroundRequest } from './common/utils';

console.debug('Content Script Injection');

const properties = Object.values(StorageTokens);
const storageService = new StorageService({ properties });
const koboService = new KoboService(storageService, backgroundRequest);

try {
  document.getElementById('header').remove();
} catch {
  console.error('No header...')
}
document.title = "Sign Into Kobo.com";

const bodyContent = document.getElementsByClassName('body-content');
const mountPoint = document.getElementById('content') || bodyContent[0];

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

function handleSignIn({ username, password, captcha }) {
  koboService.login({ username, password, captcha });
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
    addInPageContext(insertCaptcha, 'insertCaptcha');
    injectScript(
      '//www.google.com/recaptcha/api.js?onload=insertCaptcha',
      'grecaptcha-script');
    // koboService.login({
    //   username: '',
    //   password: '',
    //   captcha: '',
    // });
  },
}).$mount(mountPoint);

chrome.runtime.onMessage
  .addListener((request) => {
    console.log('Captcha response: ', request.response);
    vm.$set(vm, 'captcha', request.response);
  });
