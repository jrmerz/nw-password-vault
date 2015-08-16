var settings = require('../settings');

$(window).on('hashchange', updatePage);
updatePage();

function updatePage() {
  var parts = window.location.hash.replace(/#/,'').split('/');

  var config = settings.get();
  var page = parts[0];

  if( page === '' ) {
    if( config.default ) {
      page = 'use';
    } else {
      page = 'manage';
    }
  }

  $('.page').hide();
  var ele = $('#'+page).show();

  if( ele[0].onShow ) ele[0].onShow();
}
