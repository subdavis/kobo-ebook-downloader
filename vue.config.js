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
  configureWebpack: {
    // https://github.com/subdavis/vuejs-browser-extensions#other-problems
    devtool: 'cheap-source-map',
    // add entrypoints to page-less scripts
    entry: {
      background: './src/background.js',
      inject: './src/inject.js'
    },
    // disable code-splitting so injection doesn't require multiple files.
    optimization: {
      splitChunks: {
        minSize: Infinity,
      }
    }
  },
}
