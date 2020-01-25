import { LitElement } from 'lit-element';
import render from "./password-vault-app.tpl.js"

import '@ucd-lib/cork-app-utils'
import '../src'

import "@polymer/iron-pages"

import "./pages/app-page-select"

export default class PasswordVaultApp extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
      page : {type: String}
    }
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this._injectModel('AppStateModel');
  }

  _onAppStateUpdate(e) {
    this.page = e.page;
  }

}

customElements.define('password-vault-app', PasswordVaultApp);
