import { html } from 'lit-element';

export default function render() { 
return html`

<style>
  :host {
    display: block;
  }
</style>  

<iron-pages selected="${this.page}" attr-for-selected="page">
  <app-page-select page="select"></app-page-select>
</iron-pages>

`;}