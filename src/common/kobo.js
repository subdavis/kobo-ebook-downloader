import Axios from 'axios';

import { StorageTokens } from './definitions';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default class KoboService {

  constructor(storageService) {
    this.resources = null;
    this.Affiliate = "Kobo"
    this.ApplicationVersion = "8.11.24971"
    this.DefaultPlatformId = "00000000-0000-0000-0000-000000004000"
    this.DisplayProfile = "Android";
    this.storageService = storageService;
  }

  async initResources() {
    if (this.resources === null) {
      const { data } = await Axios.get("https://storeapi.kobo.com/v1/initialization");
      this.resources = data['Resources'];
    } 
  }

  async isDeviceAuthenticated() {
    const vals = await this.storageService.get([
      StorageTokens.DEVICE_ID,
      StorageTokens.ACCESS_TOKEN,
      StorageTokens.REFRESH_TOKEN,
    ]);
    return Object.values(vals).every(v => v.length > 0);
  }

  async isLoggedIn() {
    const vals = await this.storageService.get([
      StorageTokens.USER_ID,
      StorageTokens.USER_KEY,
    ]);
    console.log(vals);
    return Object.values(vals).every(v => v.length > 0);
  }

  async getExtraLoginParams() {
    await this.initResources();
    await this.authenticateDevice();
    const vals = await this.storageService.get([
      StorageTokens.DEVICE_ID,
    ]);
    const deviceId = vals[StorageTokens.DEVICE_ID];
    const signInUrl = this.resources['sign_in_page'];
    const parms = {
      "wsa": this.Affiliate,
      "pwsav": this.ApplicationVersion,
      "pwspip": this.DefaultPlatformId,
      "pwsdid": deviceId,
    };
  }

  async login({ username, password, captcha }) {
    const { signInUrl, workflowId, requestVerificationToken}
  }

  async authenticateDevice(force = false) {
    const vals = await this.storageService.get([
      StorageTokens.DEVICE_ID,
      StorageTokens.USER_KEY,
    ]);

    if (this.isDeviceAuthenticated() && !force) return;

    const deviceId = vals[StorageTokens.DEVICE_ID] || uuidv4();
    const userKey = vals[StorageTokens.USER_KEY];

    const postData = {
      "AffiliateName": this.Affiliate,
      "AppVersion": this.ApplicationVersion,
      "ClientKey": btoa(this.DefaultPlatformId),
      "DeviceId": deviceId,
      "PlatformId": this.DefaultPlatformId,
    }

    if (userKey.length > 0) {
      postData["UserKey"] = userKey;
    }

    const { data } = await Axios.post("https://storeapi.kobo.com/v1/auth/device", postData)

    const config = {
      [StorageTokens.DEVICE_ID]: deviceId,
      [StorageTokens.REFRESH_TOKEN]: data['RefreshToken'],
      [StorageTokens.ACCESS_TOKEN]: data['AccessToken'],
    };

    if (userKey.length > 0) {
      config[StorageTokens.USER_KEY] = data['UserKey'];
    }

    await this.storageService.set(config);
    return config;
  }
}
