import { LitElement } from 'lit-element';
import render from "./app-page-select.tpl.js"


export default class AppPageSelect extends Mixin(LitElement)
.with(LitCorkUtils) {

  static get properties() {
    return {
      vaults : {type: Array},
      selectedVault : {type: String}
    }
  }

  constructor() {
    super();
    
    this.vaults = [];

    this.render = render.bind(this);
    this._injectModel('SettingsModel');
  }

  firstUpdated() {
    this._onSettingsUpdate(this.SettingsModel.get());
  }

  _onSettingsUpdate(e) {
    this.data = e;
    this.vaults = e.vaults || [];
    this.selectedVault = this.vaults.length ? this.vaults[0] : '';
  }

  _onPasswordKeyup(e) {
    if( e.which !== 13 ) return;
    this.unlock();
  }

  unlock() {
    let password = this.shadowRoot.querySelector('#password').value;
    console.log(this.selectedVault, password);
  }

  _onSelectVaultChange(e) {
    this.selectedVault = e.currentTarget.value;
  }


}

customElements.define('app-page-select', AppPageSelect);
