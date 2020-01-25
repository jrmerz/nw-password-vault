const {AppStateModel} = require('@ucd-lib/cork-app-state');
const AppStateStore = require('../stores/AppStateStore');
const queryString = require("query-string");

class ImplAppStateModel extends AppStateModel {

  constructor() {
    super();
    this.store = AppStateStore;

    this.startPage = 'select';
    window.addEventListener('hashchange', () => this._setLocation());
    this._setLocation();
  }

  _setLocation() {
    this.set({
      location : {
        pathname : window.location.hash.replace(/^#/, ''),
        path : window.location.hash.replace(/^#/, '')
          .replace(/(^\/|\/$)/g, '')
          .split('/')
          .filter(part => part ? true : false)
      }
    });
  }

  set(update) {
    if( update.location ) {
      let page = update.location.path.length ? update.location.path[0] : this.startPage;
      update.page = page;
    }

    return super.set(update);
  }

  setLocation(location) {
    window.location.hash = location;
  }

}

module.exports = new ImplAppStateModel();