import { StorageTokens } from './definitions';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default class KoboService {

  constructor(storageService, requestService) {
    this.resources = null;
    this.Affiliate = "Kobo"
    this.ApplicationVersion = "8.11.24971"
    this.DefaultPlatformId = "00000000-0000-0000-0000-000000004000"
    this.DisplayProfile = "Android";
    this.storageService = storageService;
    this.requestService = requestService;
  }

  async reauthenticate() {
    const config = await this.getHeaderWithAccessToken();
    const vals = await this.storageService.get([StorageTokens.REFRESH_TOKEN]);
    const postData = {
      'AppVersion': this.ApplicationVersion,
      'ClientKey': btoa(this.DefaultPlatformId),
      'PlatformId': this.DefaultPlatformId,
      'RefreshToken': vals[StorageTokens.REFRESH_TOKEN],
    };
    const { data } = await this.requestService({
      url: 'https://storeapi.kobo.com/v1/auth/refresh',
      data: postData,
      ...config,
    });
    if (data['TokenType'] !== 'Bearer') {
      throw new Error(`Refresh returned unsupported Token type: ${data['TokenType']}`);
    }
    return this.storageService.set({
      [StorageTokens.ACCESS_TOKEN]: data['AccessToken'],
      [StorageTokens.REFRESH_TOKEN]: data['RefreshToken'],
    });
  }

  async requestWithReauth(axiosConfig) {
    try {
      return await this.requestService(axiosConfig);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Unauthorized, try reauth
        console.log('Attempting reauthorization...');
        await this.reauthenticate();
        const newConfig = this.getHeaderWithAccessToken();
        return this.requestService({ axiosConfig, ...newConfig });
      } else {
        throw error;
      }
    }
  }

  async getHeaderWithAccessToken() {
    const vals = await this.storageService.get([StorageTokens.ACCESS_TOKEN]);
    return {
      headers: {
        'Authorization': `Bearer ${vals[StorageTokens.ACCESS_TOKEN]}`,
        // 'Cookie': null,
        // 'Host': null,
        // 'Origin': null,
        // 'User-Agent': null,
      },
    };
  }

  async initResources() {
    if (this.resources === null) {
      const config = await this.getHeaderWithAccessToken();
      const { data } = await this.requestWithReauth({
        url: 'https://storeapi.kobo.com/v1/initialization',
        ...config
      });
      this.resources = data['Resources'];
    }
  }

  /**
   * @return Boolean
   */
  async isDeviceAuthenticated() {
    const vals = await this.storageService.get([
      StorageTokens.DEVICE_ID,
      StorageTokens.ACCESS_TOKEN,
      StorageTokens.REFRESH_TOKEN,
    ]);
    return Object
      .values(vals)
      .every(v => v.length > 0);
  }

  /**
   * @return Boolean
   */
  async isLoggedIn() {
    const vals = await this.storageService.get([
      StorageTokens.USER_ID,
      StorageTokens.USER_KEY,
    ]);
    return Object
      .values(vals)
      .every(v => v.length > 0);
  }

  /**
   * @return {{
   *  signInUrl: String,
   *  workflowId: String,
   *  requestVerificationToken: String,
   * }}
   */
  async getExtraLoginParams() {
    await this.authenticateDevice();
    await this.initResources();
    const vals = await this.storageService.get([
      StorageTokens.DEVICE_ID,
    ]);
    const deviceId = vals[StorageTokens.DEVICE_ID];
    const signInUrl = this.resources['sign_in_page'];
    const params = {
      "wsa": this.Affiliate,
      "pwsav": this.ApplicationVersion,
      "pwspip": this.DefaultPlatformId,
      "pwsdid": deviceId,
    };
    const response = await this.requestService({
      url: signInUrl,
      params,
      method: 'get',
    });
    console.log('Pre-auth request ', response);

    const workflowMatch = response.data.match(/\?workflowId=(?<id>[^"]{36})/)
    if (workflowMatch === null) {
      throw new Error(`Could not find worflow in ${response.data}`);
    }
    const workflowId = workflowMatch.groups.id;

    const tokenMatch = response.data.match(/<input name="__RequestVerificationToken" type="hidden" value="(?<token>[^"]+)" \/>/);
    if (tokenMatch === null) {
      throw new Error(`Could not find request verification token in ${response.data}`);
    }
    const requestVerificationToken = tokenMatch.groups.token;

    const a = document.createElement('a');
    a.setAttribute('href', signInUrl);
    a.pathname = '/ww/en/signin/signin/kobo'
    a.search = '';
    
    return {
      signInUrl: a.href,
      workflowId,
      requestVerificationToken,
    };
  }

  /**
   * @param {{
   *   username: String,
   *   password: String,
   *   captcha: String,
   * }} loginDetails
   */
  async login({ username, password, captcha }) {
    const loginParams = await this.getExtraLoginParams();
    const postData = {
      "LogInModel.WorkflowId": loginParams.workflowId,
			"LogInModel.Provider": this.Affiliate,
			"ReturnUrl": "",
			"__RequestVerificationToken": loginParams.requestVerificationToken,
			"LogInModel.UserName": username,
			"LogInModel.Password": password,
			"g-recaptcha-response": captcha
    };

    const response = await this.requestService({
      url: loginParams.signInUrl,
      method: 'post',
      data: postData,
    });

    const urlMatch = response.data.match(/'(?<userauth>kobo:\/\/UserAuthenticated\?[^']+)';/);
    if (urlMatch === null) {
      throw new Error(`Authenticated user url can't be found in ${response.data}`);
    }
    const a = document.createElement('a');
    a.href = urlMatch.groups.userauth;
    const urlParams = new URLSearchParams(a.search);
    const userKey = urlParams.get('userKey');
    const userId = urlParams.get('userId');
    await this.storageService.set({
      [StorageTokens.USER_ID]: userId, 
      [StorageTokens.USER_KEY]: userKey,
    });
    await this.authenticateDevice(true);
    console.log('Logged In!');
  }

  /**
   * @param {Boolean} force - force reauthorization of device
   */
  async authenticateDevice(force = false) {
    if (await this.isDeviceAuthenticated() && !force) return;
    const vals = await this.storageService.get([
      StorageTokens.DEVICE_ID,
      StorageTokens.USER_KEY,
    ]);

    console.log('Authenticating Device');

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

    const { data } = await this.requestService({
      url: 'https://storeapi.kobo.com/v1/auth/device',
      data: postData,
      method: 'post',
    });

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
