const {BaseModel} = require('@ucd-lib/cork-app-utils');
const VaultStore = require('../stores/VaultStore');
const fs = require('fs');
const crypto = require('./CryptoModel');
const AppStateModel = require('./AppStateModel')

class VaultModel extends BaseModel {

  constructor() {
    super();

    this.store = VaultStore;
      
    this.register('VaultModel');
  }

  load(path, password) {
    crypto.setPassword(password);
    let data = fs.readFileSync(path, 'utf-8')
    data = JSON.parse(crypto.decrypt(data));
    this.store.setLoadedVault(path, data.items || []);
    this.AppStateModel.setLocation('vault');
  }
  
  unload() {
    this.store.unload();
    crypto.setPassword('');
    this.AppStateModel.setLocation('select');
  }

  search(txt) {
    let re = new RegExp('.*'+txt+'.*', 'i');
    let results = [];
    this.store.data.passwords.items.forEach(function(item){
      if( (item.name || '').match(re) || 
          (item.description || '').match(re) ) {
        results.push(item);
      }
    });
    return results;
  };

}

module.exports = new VaultModel();