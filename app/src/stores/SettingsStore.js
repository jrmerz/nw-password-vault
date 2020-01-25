const {BaseStore} = require('@ucd-lib/cork-app-utils');

class SettingsStore extends BaseStore {

  constructor() {
    super();

    this.data = {};
    this.events = {
      SETTINGS_UPDATE : 'settings-update'
    };
  }

  set(data) {
    this.data = Object.assign({}, this.data, data);
    this.emit(this.events.SETTINGS_UPDATE, this.data);
  }

  get() {
    return this.data;
  }

}

module.exports = new SettingsStore();