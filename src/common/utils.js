// https://stackoverflow.com/questions/8578617/inject-a-script-tag-with-remote-src-and-wait-for-it-to-execute
function injectScript(src, id, callback) {
  const s = 'script';
  const d = document;
  if (d.getElementById(id)) { return; }
  const js = d.createElement(s);
  js.id = id || src;
  js.onload = callback;
  js.src = src;
  d.getElementsByTagName('head')[0].appendChild(js);
}

// https://intoli.com/blog/sandbox-breakout/
// Breaks out of the content script context by injecting a specially
// constructed script tag and injecting it into the page.
const runInPageContext = (method, functionName = 'breakout') => {
  console.log('Inserting...');
  // The stringified method which will be parsed as a function object.
  const stringifiedMethod = method.toString();

  // The full content of the script tag.
  const scriptContent = `
    // Parse and run the method with its arguments.
    window.${functionName} = ${stringifiedMethod};
  `;

  // Create a script tag and inject it into the document.
  const scriptElement = document.createElement('script');
  scriptElement.innerHTML = scriptContent;
  document.documentElement.prepend(scriptElement);
};

export {
  injectScript,
  runInPageContext,
};
