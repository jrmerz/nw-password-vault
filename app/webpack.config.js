const path = require('path');
const webpack = require('webpack');

let config = require('@ucd-lib/cork-app-build').watch({
  // root directory, all paths below will be relative to root
  root : __dirname,
  // path to your entry .js file
  entry : 'elements/password-vault-app.js',
  // folder where bundle.js will be written
  preview : '',
  // path your client (most likely installed via yarn) node_modules folder.
  // Due to the flat:true flag of yarn, it's normally best to separate 
  // client code/libraries from all other modules (ex: build tools such as this).
  clientModules : path.resolve('..', 'node_modules')
});

config.target = 'electron-renderer';

// config.plugins = [
//   new webpack.IgnorePlugin({resourceRegExp: /^pg-native$/})
// ];


module.exports = config;