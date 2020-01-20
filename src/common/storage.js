/**
 * Storage service persists relevant data to localStorage
 */

export default class AsyncStorage {
  constructor({ properties = [] }) {
    this.properties = properties;
  }

  get(keyArr) {
    return new Promise((resolve) =>
      chrome.storage.local.get(keyArr, (result) => {
        keyArr.forEach((p) => {
          if (!(p in result)){
            result[p] = '';
          }
        });
        resolve(result);
      })
    );
  }

  set(obj) {
    return new Promise((resolve) =>
      chrome.storage.local.set(obj, resolve)
    );
  }
}
