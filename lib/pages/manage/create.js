var fs = NODE.fs;
var crypto = require('../../crypto');
var settings = require('../../settings');


module.exports.init = function() {
  $('#create-btn').on('click', create);
};

function create() {
  var info = {
    location : $('#new-location').val(),
    password : $('#new-password').val(),
    passwordVerify : $('#new-password-verify').val()
  };

  if( info.location.length === 0 ) {
    return error('You must provide a location for the vault.');
  }
  if( info.password !== info.passwordVerify ) {
    return error('Your passwords do not match.');
  }
  if( info.password.length < 8 ) {
    return error('Your password is less than 8 characters.');
  }

  info.location = info.location+'/pass.vault';
  success();

  var empty = {
    items : []
  };

  crypto.setPassword(info.password);
  var data = crypto.encrypt(JSON.stringify(empty));
  fs.writeFileSync(info.location, data);

  Vault.active = {
    location : info.location,
    password : info.password
  };

  settings.addVault(info.location);

  $('#new-location').val('');
  $('#new-password').val('');
  $('#new-password-verify').val('');

  window.location = '#use';
}

function success() {
  error('');
}

function error(msg) {
  if( !msg ) $('#new-message').html('');
  else $('#new-message').html('<div class="alert alert-danger">'+msg+'</div>');
}
