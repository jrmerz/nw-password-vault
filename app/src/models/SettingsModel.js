const {BaseModel} = require('@ucd-lib/cork-app-utils');
const SettingsStore = require('../stores/SettingsStore');
const fs = require('fs-extra');
const path = require('path');

class SettingsModel extends BaseModel {

  constructor() {
    super();

    this.store = SettingsStore;
    this.MAIN_SETTINGS_FILE = '.passwordVault'
    
    this.init();

    this.register('SettingsModel');
  }

  init() {
    let p = path.join(this.getUserHome(), this.MAIN_SETTINGS_FILE);
    if( !fs.existsSync(p) ) {
      fs.writeFileSync(p, '{}');
    }
    this.store.set(JSON.parse(fs.readFileSync(p, 'utf-8')));
  }

  set(data) {
    this.store.set(data);
    fs.writeFileSync(path, JSON.stringify(this.store.get()));
    return this.store.get();
  }

  addVault(location) {
    let data = this.store.get().vaults || [];
    if( data.indexOf(location) > -1 ) {
      return;
    }
    this.set({vaults: data});
  }

  get() {
    return this.store.get();
  }

  getUserHome() {
    return window.process.env[(window.process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }

}

module.exports = new SettingsModel();