
const path = require('path');
const webpack = require('webpack'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  // very important: don't  bundle the template compiler
  // false is the default.  This is just a reminder.
  runtimeCompiler: false,
  pages: {
    popup: {
      entry: 'src/popup.js',
      template: 'public/popup.html',
      filename: 'popup.html',
    },
  },
  // only matters if you try to use yarn link
  chainWebpack: (config) => {
    config.resolve.set('symlinks', false);
  },
  // https://github.com/subdavis/vuejs-browser-extensions#other-problems
  configureWebpack: {
    devtool: 'cheap-source-map',
    entry: {
      background: './src/background.js',
      inject: './src/inject.js'
    }
  },
}
