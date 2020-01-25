const {BaseStore} = require('@ucd-lib/cork-app-utils');
const path = require('path');

class VaultStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      loaded : false,
      metadata : {},
      passwords : []
    };
    this.events = {
      LOADED_VAULT_UPDATE : 'loaded-vault-update'
    };
  }

  setLoadedVault(vaultPath, passwords) {
    this.data = {
      loaded : true,
      metadata : path.parse(vaultPath),
      passwords
    }
    this.emit(this.events.LOADED_VAULT_UPDATE, this.data);
  }

  unload() {
    this.data = {
      loaded : false,
      metadata : {},
      passwords : []
    }
    this.emit(this.events.LOADED_VAULT_UPDATE, this.data);
  }

}

module.exports = new VaultStore();