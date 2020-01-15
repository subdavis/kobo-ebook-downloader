async function inject() {
  // const tab = await new Promise((resolve) =>
  //   chrome.tabs.create({
  //     url: 'https://authorize.kobo.com',
  //     active: false,
  //   }, resolve)
  // );

  let tab = await new Promise((resolve) =>
    chrome.tabs.query({
      active: true,
      currentWindow: true,
    }, resolve)
  );
  tab = tab[0]
  await Promise.all([
    new Promise((resolve) =>
      chrome.tabs.executeScript(tab.id, {
        'file': 'js/chunk-vendors.js'
      }, resolve)
    ),
    new Promise((resolve) =>
      chrome.tabs.executeScript(tab.id, {
        'file': 'js/inject.js',
        'runAt': 'document_end',
      }, resolve)
    ),
  ]);

  chrome.tabs.update(tab.id, { active: true, highlighted: true })
}


export {
  inject
};
