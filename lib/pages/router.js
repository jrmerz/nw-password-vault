var settings = require('../settings');

$(window).on('hashchange', updatePage);

function updatePage() {
  var parts = window.location.hash.replace(/#/,'').split('/');

  var config = settings.get();
  var page = parts[0];

  if( page === '' ) {
    page = 'use';
  }

  $('.page').hide();
  var ele = $('#'+page).show();

  $('li[role="presentation"]').removeClass('active');
  $('a[role="tab"][href="#'+page+'"]').parent().addClass('active');

  if( ele[0].onShow ) ele[0].onShow();

  if( page == 'manage' ) {
    $('.edit-element').hide();
    if( parts.length > 1 ) {
      if( parts[1] == 'import' ) $('app-import-vault').show();
      else $('app-create-new').show();
    } else {
      $('app-create-new').show();
    }
  }

}

updatePage();
