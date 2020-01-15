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

  await new Promise((resolve) =>
    chrome.tabs.executeScript(tab.id, {
      'file': 'js/inject.js',
      'runAt': 'document_end',
    }, resolve)
  ),

  chrome.tabs.update(tab.id, { active: true, highlighted: true })
}


export {
  inject
};
