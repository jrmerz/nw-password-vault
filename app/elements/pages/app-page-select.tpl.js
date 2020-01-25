import { html } from 'lit-element';

export default function render() { 
return html`

<style>
  :host {
    display: block;
  }
</style>

<div>
  <label for="password">Enter Password to unlock vault</label>
  <input type="password" 
    id="password" 
    name="password"
    @keyup="${this._onPasswordKeyup}"
  />
  <button @click="${this.unlock}">Unlock</button>
</div>

<div>
  <select @change="${this._onSelectVaultChange}">
    ${this.vaults.map(path => html`
      <option value="${path}">${path}</option>
    `)}
  </select>
</div>

`;}