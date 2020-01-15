console.log('Initializing background!');

chrome.runtime.onMessageExternal
  .addListener((request) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { response: request.response });
    });
  });
