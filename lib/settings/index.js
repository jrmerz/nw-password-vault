var utils = require('../utils');

var events = require('events').EventEmitter;
events = new events();
events.setMaxListeners(1000);

var fs = NODE.fs;

var FILENAME = '.nwPasswordVault';

var path = utils.getUserHome()+'/'+FILENAME;
if( !fs.existsSync(path) ) {
  fs.writeFileSync(path, '{}');
}

var settings = JSON.parse(fs.readFileSync(path, 'utf-8'));

function get() {
  return settings;
}

function set(key, value) {
  settings[key] = value;
  fs.writeFileSync(path, JSON.stringify(settings));
}

function addVault(location) {
  if( !settings.vaults ) config.vaults = [];

  if( settings.vaults.indexOf(location) > -1 ) {
    return;
  }

  settings.vaults.push(location);

  set('vaults', settings.vaults);

  events.emit('vaults-updated', settings.vaults);
}

module.exports = {
  get : get,
  set : set,
  addVault : addVault,
  on : function(event, listener){
    events.on(event, listener);
  }
};
