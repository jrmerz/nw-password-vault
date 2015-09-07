var fs = NODE.fs;
var settings = require('../../settings');
var crypto = require('../../crypto');
var search = require('./search');
var edit = require('./edit');
var config;

var currentVault = {
  file : '',
  data : null
};

module.exports.init = function() {
  $('#use')[0].onShow = onShow;

  $('#unlock-popup').modal({show: false});
  $('#unlock-show-btn').on('click',function(){
    $('#unlock-popup-filename').html(Vault.active);
    $('#vault-popup-message').html('');
    $('#unlock-popup').modal('show');
    $('#unlock-popup-password').val('');
    setTimeout(function(){
      $('#unlock-popup-password').focus();
    }, 250);
  });

  $('#unlock-btn').on('click',function(){
    attemptUnlock();
  });
  $('#unlock-popup-password').on('keyup', function(e){
    if( e.which == 13 ) attemptUnlock();
  });
  $('#find-password-input').on('keyup', function(e){
    search.go(currentVault.data);
  });

  $('#vault-select').on('change', function(){
    currentVault.data = null;
    currentVault.location = '';
    Vault.active = $(this).val();
    resetUi();
  });

  search.init(edit);
  edit.init(onSave);

  settings.on('vaults-updated', function(vaults){
    createSelector();
  });

  onShow();
};

function resetUi() {
  $('#use-message').html('');
  $('#use-results').html('');
  $('#find-password').hide();
  $('#unlock-show-btn').show();
}

function onSave(info) {
  var i, item;

  // simple delete
  if( info.remove ) {
    for( i = 0; i < currentVault.data.items.length; i++ ) {
      if( currentVault.data.items[i].name == info.name ) {
        currentVault.data.items.splice(i, 1);
      }
    }

    save();
    search.go(currentVault.data);
    edit.hide();
    return;
  }

  // just a simple edit
  if( info.originalName == info.entry.name ) {
    updateEntry(info.entry);
    save();
    search.go(currentVault.data);
    edit.hide();
    return;
  }

  var isOverwrite = false;
  for( i = 0; i < currentVault.data.items.length; i++ ) {
    item = currentVault.data.items[i];
    if( item.name == info.entry.name ) {
      isOverwrite = true;
      break;
    }
  }

  if( isOverwrite && !confirm('"'+entry+'" already exists, are you sure you want to overwrite?!') ) {
    return;
  }

  if( info.isNew ) {
    currentVault.data.items.push(info.entry);
  } else {
    updateEntry(info.entry);
  }

  save();
  search.go(currentVault.data);
  edit.hide();
}

function updateEntry(entry) {
  for( i = 0; i < currentVault.data.items.length; i++ ) {
    item = currentVault.data.items[i];
    if( item.name == entry.name ) {
      currentVault.data.items[i] = entry;
      return;
    }
  }
}

function save() {
  var data = crypto.encrypt(JSON.stringify(currentVault.data));
  fs.writeFileSync(currentVault.file, data);
}

function createSelector() {
  if( !config.vaults ) return;

  var html = '';
  for( var i = 0; i < config.vaults.length; i++ ) {
    html += '<option value="'+config.vaults[i]+'" '+(config.vaults[i] == Vault.active ? 'selected' : '')+'>'+config.vaults[i]+'</option>';
  }
  $('#vault-select').html(html);
}

function onShow() {
  config = settings.get();
  resetUi();

  if( Vault.active ) {
    onVaultSet();
  } else if ( config.vaults && config.vaults.length > 0 ) {
    Vault.active = config.vaults[0];
    onVaultSet();
  } else {
    warn('You have no vaults.  You must first create one');
  }

  createSelector();
}

function onVaultSet() {
  if( Vault.active === currentVault.file && currentVault.data !== null ) {
    $('#unlock-show-btn').hide();
    $('#find-password').show();
    $('#find-password-input').focus();
    search.go(currentVault.data, '');
  } else {
    $('#unlock-show-btn').show();
  }
}

function attemptUnlock() {
  currentVault.data = null;
  crypto.setPassword($('#unlock-popup-password').val());
  var data = fs.readFileSync(Vault.active, 'utf8');

  try {
    data = JSON.parse(crypto.decrypt(data));
  } catch(e) {
    $('#vault-popup-message').html('<div class="alert alert-danger">Invalid Password</div>');
    return;
  }

  $('#vault-popup-message').html('<div class="alert alert-success">Success!</div>');


  currentVault.data = data;
  currentVault.file = Vault.active;
  onVaultSet();
  setTimeout(function(){
    $('#unlock-popup').modal('hide');
  }, 500);
}

function warn(msg) {
  if( !msg ) $('use-message').html('');
  else $('use-message').html('<div class="alert alert-warn">'+msg+'</div>');
}
