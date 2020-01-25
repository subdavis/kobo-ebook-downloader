import Axios from 'axios';
import { transformRequest } from './common/utils';

console.debug('Initializing background!');

/* Listen for external messages from un-sandboxed captcha, and forward it
 * to the sandox-safe content script
 */
chrome.runtime.onMessageExternal
  .addListener((message, sender) =>
    chrome.tabs.sendMessage(sender.tab.id, message)
  );

/* Listen for requests to send axios requests from
 * the content script
 */
chrome.runtime.onMessage
  .addListener((axiosConfig, sender, sendResponse) => {
    console.log('Recieved request', axiosConfig, sender);
    if (sender.tab) {
      // from the content script
      Axios.request(transformRequest(axiosConfig))
        .then(response => sendResponse({ response }))
        .catch(error => sendResponse({ error }))
      return true; // signal intent to respond asynchronously
    }
    return false;
  });

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    console.log('FIRE', details)
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (['User-Agent'].indexOf(details.requestHeaders[i].name) >= 0) {
        // console.log('Removing HEADER', details.requestHeaders[i].name);
        details.requestHeaders.splice(i, 1);
      }
    }
    return { requestHeaders: [] };
  },
  { urls: ["*://authorize.kobo.com/*"] },
  ["blocking", "requestHeaders", "extraHeaders"]);
