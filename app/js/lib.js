(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Vault = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js":[function(require,module,exports){
var crypto = NODE.crypto,
    algorithm = 'aes-256-ctr',
    password = '';

module.exports.encrypt = function(text){
  var cipher = crypto.createCipher(algorithm, password);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
};

module.exports.decrypt = function(text){
  var decipher = crypto.createDecipher(algorithm,password);
  var dec = decipher.update(text,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
};

module.exports.setPassword = function(pass) {
  password = pass;
};

},{}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/index.js":[function(require,module,exports){
module.exports.crypto = require('./crypto');

require('./init')();

},{"./crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","./init":"/Users/jrmerz/dev/personal/nw-password-vault/lib/init.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/init.js":[function(require,module,exports){
module.exports = function() {
  $(window).on('keyup', function(e) {
    if( e.which == 73 && e.ctrlKey ) {
      window.require('nw.gui').Window.get().showDevTools();
    } else if ( e.which == 91 && e.ctrlKey ) {
      window.reload();
    }
  });

  $(document).on('ready', function(){
    require('./pages/router');
    require('./pages/manage').init();
    require('./pages/use').init();
  });

};

},{"./pages/manage":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/index.js","./pages/router":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/router.js","./pages/use":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/create.js":[function(require,module,exports){
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

  var config = settings.get();
  if( !config.vaults ) config.vaults = [];
  config.vaults.push(info.location);

  settings.set('vaults', config.vaults);

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

},{"../../crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/index.js":[function(require,module,exports){
var utils = require('../../utils');
var create = require('./create');

module.exports.init = function(){
  create.init();
};

},{"../../utils":"/Users/jrmerz/dev/personal/nw-password-vault/lib/utils/index.js","./create":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/create.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/router.js":[function(require,module,exports){
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

},{"../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/edit.js":[function(require,module,exports){
var entry = null;
var isNew = false;
var editName = '';
var otherCount = 0;
var root = '#edit-entry-password';

module.exports.init = function(onSave) {
  $('#edit-entry-popup').modal({
    show: false,
    backdrop: 'static'
  });
  $('#add-entry-btn').on('click', add);
  $('#edit-entry-add-field-btn').on('click', function(){
    addField();
  });

  $('#edit-entry-password').on('blur', verify);
  $('#edit-entry-password-verify').on('blur', verify);

  $('#edit-entry-save-btn').on('click', function(){
    var hasError = verify();
    if( hasError ) return;

    var entry = getEntry();
    onSave({
      entry: entry,
      originalName : editName,
      isNew : isNew
    });
  });
};

module.exports.hide = function() {
  $('#edit-entry-popup').modal('hide');
};

function add() {
  reset();

  otherCount = 0;
  isNew = true;
  $('#edit-entry-popup-title').html('Add Entry');
  show();
}

module.exports.edit = function(entry) {
  reset();

  editName = entry.name;
  otherCount = 0;
  isNew = false;
  $('#edit-entry-popup-title').html('Edit Entry');
  show();
};

function addField(item) {
  var html =
    '<div class="form-group">'+
      '<label class="col-sm-3 control-label">'+
        '<input type="text" class="form-control" placeholder="Field Name" id="edit-entry-password-'+otherCount+'-name" style="text-align:right"/>'+
      '</label>'+
      '<div class="col-sm-9">'+
        '<input type="password" class="form-control" id="edit-entry-password-'+otherCount+'" placeholder="Password" />'+
        '<input type="password" class="form-control" id="edit-entry-password-'+otherCount+'-verify" placeholder="Verify Password" />'+
        '<span id="edit-entry-password-'+otherCount+'-msg"></span>'+
        '<a class="btn btn-link"><i class="fa fa-trash"></i></a>'+
      '</div>'+
    '</div>';

  var ele = $(html);
  ele.find('input').on('blur', verify);

  $('#edit-entry-other-fields').append(ele);
  otherCount++;
}

function verify() {
  var errors = [], i;
  errors.push(verifyItem());
  for( i = 0; i < otherCount; i++ ) {
    errors.push(verifyItem(i));
  }

  for( i = 0; i < errors.length; i++ ) {
    if( errors[i] ) return true;
  }

  return false;
}

function getEntry() {
  var entry = {
    name : $(root+'-name').val(),
    description : $(root+'-description').val(),
    password : $(root).val()
  };

  for( i = 0; i < otherCount; i++ ) {
    var name = $(root+'-'+otherCount+'-name').val();
    var pass = $(root+'-'+otherCount).val();

    if( name == 'name' || name == 'password' || name == 'description' ) {
      continue;
    }
    entry[name] = pass;
  }

  return entry;
}

function verifyItem(index) {
  var isCustom = false;

  if( index !== undefined ) {
    root += '-'+index;
    isCustom = true;
  }

  var name = $(root+'-name').val();
  var pass = $(root).val();
  var verifyPass = $(root+'-verify').val();
  var msg = $(root+'-msg');

  if( pass.length === 0 ) {
    error(msg, 'You did not provide a password');
    return true;
  } else if( verifyPass != pass ) {
    error(msg, 'Your items do not match');
    return true;
  } else if( name.length === 0 ) {
    error(msg, 'You must provide a name');
    return true;
  } else if( (name == 'name' || name == 'password' || name == 'description') && isCustom ) {
    error(msg, 'Invalid name');
    return true;
  }

  msg.html('<span class="text text-success"><i class="fa fa-check"></i></span>');

  return false;
}

function error(ele, msg) {
  ele.html('<div class="alert alert-danger">'+msg+'</div>');
}

function reset() {
  $('#edit-entry-name').val('');
  $('#edit-entry-description').val('');
  $('#edit-entry-password').val('');
  $('#edit-entry-password-verify').val('');
  $('#edit-entry-other-fields').html('');
  $('#edit-entry-password-msg').html('');
}

function show() {
  $('#edit-entry-popup').modal('show');
}

},{}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/index.js":[function(require,module,exports){
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
    search(currentVault.data);
  });

  edit.init(onSave);

  onShow();
};

function resetUi() {
  $('#use-message').html('');
  $('#use-results').html('');
  $('#find-password').hide();
  $('#unlock-show-btn').hide();
}

function onSave(info) {
  var i, item;

  // just a simple edit
  if( info.originalName == info.entry.name ) {
    updateEntry(info.entry);
    save();
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

},{"../../crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js","./edit":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/edit.js","./search":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js":[function(require,module,exports){
module.exports = function(data) {
  if( !data.items ) return;

  var text = $('#find-password-input').val();
  var re = new RegExp('.*'+text+'.*', 'i');

  var results = [];
  data.items.forEach(function(item){
    var name = item.name || '';
    var description = item.description || '';
    if( name.match(re) || description.match(re) ) {
      results.push(item);
    }
  });

  renderResults(results);
};

function renderResults(items) {
  if( items.length === 0 ) {
    $('#use-results').html('<div class="alert alert-warning">No matches found</div>');
    return;
  }

  var html = '<div class="form-horizontal">';
  items.forEach(function(item){
    html +=
      '<div class="form-group">'+
        '<label class="col-sm-3 control-label">'+item.name+'</label>'+
        '<div class="col-sm-7">'+
          '<div>'+(item.description || '')+'</div>'+
          '<table class="table">';

    for( var key in item ) {
      if( key == 'name' || key == 'description' ) continue;
      html +=
        '<tr>'+
          '<td>'+key+'</td>'+
          '<td><span></span>'+
            '<a class="btn btn-link" name="Copy to Clipboard"><i class="fa fa-copy"></i></a>'+
            '<a class="btn btn-link" name="Show"><i class="fa fa-eye"></i></a>'+
            '<a class="btn btn-link" name="Edit"><i class="fa fa-pencil"></i></a>'+
          '</td>'+
        '</tr>';
    }

    html += '</table></div></div>';
  });
  $('#use-results').html(html+'</div>');
}

},{}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js":[function(require,module,exports){
var utils = require('../utils');
var fs = NODE.fs;

var FILENAME = '.nwPasswordVault';

var path = utils.getUserHome()+'/'+FILENAME;
if( !fs.existsSync(path) ) {
  fs.writeFileSync(path, '{}');
}

var settings = JSON.parse(fs.readFileSync(path, 'utf-8'));

function get() {
  return settings;
}

function set(key, value) {
  settings[key] = value;
  fs.writeFileSync(path, JSON.stringify(settings));
}

module.exports = {
  get : get,
  set : set
};

},{"../utils":"/Users/jrmerz/dev/personal/nw-password-vault/lib/utils/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/utils/index.js":[function(require,module,exports){

module.exports.getUserHome = function() {
  return window.process.env[(window.process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

},{}]},{},["/Users/jrmerz/dev/personal/nw-password-vault/lib/index.js"])("/Users/jrmerz/dev/personal/nw-password-vault/lib/index.js")
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY3J5cHRvL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibGliL2luaXQuanMiLCJsaWIvcGFnZXMvbWFuYWdlL2NyZWF0ZS5qcyIsImxpYi9wYWdlcy9tYW5hZ2UvaW5kZXguanMiLCJsaWIvcGFnZXMvcm91dGVyLmpzIiwibGliL3BhZ2VzL3VzZS9lZGl0LmpzIiwibGliL3BhZ2VzL3VzZS9pbmRleC5qcyIsImxpYi9wYWdlcy91c2Uvc2VhcmNoLmpzIiwibGliL3NldHRpbmdzL2luZGV4LmpzIiwibGliL3V0aWxzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGNyeXB0byA9IE5PREUuY3J5cHRvLFxuICAgIGFsZ29yaXRobSA9ICdhZXMtMjU2LWN0cicsXG4gICAgcGFzc3dvcmQgPSAnJztcblxubW9kdWxlLmV4cG9ydHMuZW5jcnlwdCA9IGZ1bmN0aW9uKHRleHQpe1xuICB2YXIgY2lwaGVyID0gY3J5cHRvLmNyZWF0ZUNpcGhlcihhbGdvcml0aG0sIHBhc3N3b3JkKTtcbiAgdmFyIGNyeXB0ZWQgPSBjaXBoZXIudXBkYXRlKHRleHQsJ3V0ZjgnLCdoZXgnKTtcbiAgY3J5cHRlZCArPSBjaXBoZXIuZmluYWwoJ2hleCcpO1xuICByZXR1cm4gY3J5cHRlZDtcbn07XG5cbm1vZHVsZS5leHBvcnRzLmRlY3J5cHQgPSBmdW5jdGlvbih0ZXh0KXtcbiAgdmFyIGRlY2lwaGVyID0gY3J5cHRvLmNyZWF0ZURlY2lwaGVyKGFsZ29yaXRobSxwYXNzd29yZCk7XG4gIHZhciBkZWMgPSBkZWNpcGhlci51cGRhdGUodGV4dCwnaGV4JywndXRmOCcpO1xuICBkZWMgKz0gZGVjaXBoZXIuZmluYWwoJ3V0ZjgnKTtcbiAgcmV0dXJuIGRlYztcbn07XG5cbm1vZHVsZS5leHBvcnRzLnNldFBhc3N3b3JkID0gZnVuY3Rpb24ocGFzcykge1xuICBwYXNzd29yZCA9IHBhc3M7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMuY3J5cHRvID0gcmVxdWlyZSgnLi9jcnlwdG8nKTtcblxucmVxdWlyZSgnLi9pbml0JykoKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICQod2luZG93KS5vbigna2V5dXAnLCBmdW5jdGlvbihlKSB7XG4gICAgaWYoIGUud2hpY2ggPT0gNzMgJiYgZS5jdHJsS2V5ICkge1xuICAgICAgd2luZG93LnJlcXVpcmUoJ253Lmd1aScpLldpbmRvdy5nZXQoKS5zaG93RGV2VG9vbHMoKTtcbiAgICB9IGVsc2UgaWYgKCBlLndoaWNoID09IDkxICYmIGUuY3RybEtleSApIHtcbiAgICAgIHdpbmRvdy5yZWxvYWQoKTtcbiAgICB9XG4gIH0pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdyZWFkeScsIGZ1bmN0aW9uKCl7XG4gICAgcmVxdWlyZSgnLi9wYWdlcy9yb3V0ZXInKTtcbiAgICByZXF1aXJlKCcuL3BhZ2VzL21hbmFnZScpLmluaXQoKTtcbiAgICByZXF1aXJlKCcuL3BhZ2VzL3VzZScpLmluaXQoKTtcbiAgfSk7XG5cbn07XG4iLCJ2YXIgZnMgPSBOT0RFLmZzO1xudmFyIGNyeXB0byA9IHJlcXVpcmUoJy4uLy4uL2NyeXB0bycpO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vLi4vc2V0dGluZ3MnKTtcblxuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICQoJyNjcmVhdGUtYnRuJykub24oJ2NsaWNrJywgY3JlYXRlKTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgdmFyIGluZm8gPSB7XG4gICAgbG9jYXRpb24gOiAkKCcjbmV3LWxvY2F0aW9uJykudmFsKCksXG4gICAgcGFzc3dvcmQgOiAkKCcjbmV3LXBhc3N3b3JkJykudmFsKCksXG4gICAgcGFzc3dvcmRWZXJpZnkgOiAkKCcjbmV3LXBhc3N3b3JkLXZlcmlmeScpLnZhbCgpXG4gIH07XG5cbiAgaWYoIGluZm8ubG9jYXRpb24ubGVuZ3RoID09PSAwICkge1xuICAgIHJldHVybiBlcnJvcignWW91IG11c3QgcHJvdmlkZSBhIGxvY2F0aW9uIGZvciB0aGUgdmF1bHQuJyk7XG4gIH1cbiAgaWYoIGluZm8ucGFzc3dvcmQgIT09IGluZm8ucGFzc3dvcmRWZXJpZnkgKSB7XG4gICAgcmV0dXJuIGVycm9yKCdZb3VyIHBhc3N3b3JkcyBkbyBub3QgbWF0Y2guJyk7XG4gIH1cbiAgaWYoIGluZm8ucGFzc3dvcmQubGVuZ3RoIDwgOCApIHtcbiAgICByZXR1cm4gZXJyb3IoJ1lvdXIgcGFzc3dvcmQgaXMgbGVzcyB0aGFuIDggY2hhcmFjdGVycy4nKTtcbiAgfVxuXG4gIGluZm8ubG9jYXRpb24gPSBpbmZvLmxvY2F0aW9uKycvcGFzcy52YXVsdCc7XG4gIHN1Y2Nlc3MoKTtcblxuICB2YXIgZW1wdHkgPSB7XG4gICAgaXRlbXMgOiBbXVxuICB9O1xuXG4gIGNyeXB0by5zZXRQYXNzd29yZChpbmZvLnBhc3N3b3JkKTtcbiAgdmFyIGRhdGEgPSBjcnlwdG8uZW5jcnlwdChKU09OLnN0cmluZ2lmeShlbXB0eSkpO1xuICBmcy53cml0ZUZpbGVTeW5jKGluZm8ubG9jYXRpb24sIGRhdGEpO1xuXG4gIFZhdWx0LmFjdGl2ZSA9IHtcbiAgICBsb2NhdGlvbiA6IGluZm8ubG9jYXRpb24sXG4gICAgcGFzc3dvcmQgOiBpbmZvLnBhc3N3b3JkXG4gIH07XG5cbiAgdmFyIGNvbmZpZyA9IHNldHRpbmdzLmdldCgpO1xuICBpZiggIWNvbmZpZy52YXVsdHMgKSBjb25maWcudmF1bHRzID0gW107XG4gIGNvbmZpZy52YXVsdHMucHVzaChpbmZvLmxvY2F0aW9uKTtcblxuICBzZXR0aW5ncy5zZXQoJ3ZhdWx0cycsIGNvbmZpZy52YXVsdHMpO1xuXG4gICQoJyNuZXctbG9jYXRpb24nKS52YWwoJycpO1xuICAkKCcjbmV3LXBhc3N3b3JkJykudmFsKCcnKTtcbiAgJCgnI25ldy1wYXNzd29yZC12ZXJpZnknKS52YWwoJycpO1xuXG4gIHdpbmRvdy5sb2NhdGlvbiA9ICcjdXNlJztcbn1cblxuZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgZXJyb3IoJycpO1xufVxuXG5mdW5jdGlvbiBlcnJvcihtc2cpIHtcbiAgaWYoICFtc2cgKSAkKCcjbmV3LW1lc3NhZ2UnKS5odG1sKCcnKTtcbiAgZWxzZSAkKCcjbmV3LW1lc3NhZ2UnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCI+Jyttc2crJzwvZGl2PicpO1xufVxuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMnKTtcbnZhciBjcmVhdGUgPSByZXF1aXJlKCcuL2NyZWF0ZScpO1xuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKXtcbiAgY3JlYXRlLmluaXQoKTtcbn07XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi9zZXR0aW5ncycpO1xuXG4kKHdpbmRvdykub24oJ2hhc2hjaGFuZ2UnLCB1cGRhdGVQYWdlKTtcbnVwZGF0ZVBhZ2UoKTtcblxuZnVuY3Rpb24gdXBkYXRlUGFnZSgpIHtcbiAgdmFyIHBhcnRzID0gd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgvIy8sJycpLnNwbGl0KCcvJyk7XG5cbiAgdmFyIGNvbmZpZyA9IHNldHRpbmdzLmdldCgpO1xuICB2YXIgcGFnZSA9IHBhcnRzWzBdO1xuXG4gIGlmKCBwYWdlID09PSAnJyApIHtcbiAgICBpZiggY29uZmlnLmRlZmF1bHQgKSB7XG4gICAgICBwYWdlID0gJ3VzZSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2UgPSAnbWFuYWdlJztcbiAgICB9XG4gIH1cblxuICAkKCcucGFnZScpLmhpZGUoKTtcbiAgdmFyIGVsZSA9ICQoJyMnK3BhZ2UpLnNob3coKTtcblxuICBpZiggZWxlWzBdLm9uU2hvdyApIGVsZVswXS5vblNob3coKTtcbn1cbiIsInZhciBlbnRyeSA9IG51bGw7XG52YXIgaXNOZXcgPSBmYWxzZTtcbnZhciBlZGl0TmFtZSA9ICcnO1xudmFyIG90aGVyQ291bnQgPSAwO1xudmFyIHJvb3QgPSAnI2VkaXQtZW50cnktcGFzc3dvcmQnO1xuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24ob25TYXZlKSB7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwJykubW9kYWwoe1xuICAgIHNob3c6IGZhbHNlLFxuICAgIGJhY2tkcm9wOiAnc3RhdGljJ1xuICB9KTtcbiAgJCgnI2FkZC1lbnRyeS1idG4nKS5vbignY2xpY2snLCBhZGQpO1xuICAkKCcjZWRpdC1lbnRyeS1hZGQtZmllbGQtYnRuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICBhZGRGaWVsZCgpO1xuICB9KTtcblxuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZCcpLm9uKCdibHVyJywgdmVyaWZ5KTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtdmVyaWZ5Jykub24oJ2JsdXInLCB2ZXJpZnkpO1xuXG4gICQoJyNlZGl0LWVudHJ5LXNhdmUtYnRuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgaGFzRXJyb3IgPSB2ZXJpZnkoKTtcbiAgICBpZiggaGFzRXJyb3IgKSByZXR1cm47XG5cbiAgICB2YXIgZW50cnkgPSBnZXRFbnRyeSgpO1xuICAgIG9uU2F2ZSh7XG4gICAgICBlbnRyeTogZW50cnksXG4gICAgICBvcmlnaW5hbE5hbWUgOiBlZGl0TmFtZSxcbiAgICAgIGlzTmV3IDogaXNOZXdcbiAgICB9KTtcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwJykubW9kYWwoJ2hpZGUnKTtcbn07XG5cbmZ1bmN0aW9uIGFkZCgpIHtcbiAgcmVzZXQoKTtcblxuICBvdGhlckNvdW50ID0gMDtcbiAgaXNOZXcgPSB0cnVlO1xuICAkKCcjZWRpdC1lbnRyeS1wb3B1cC10aXRsZScpLmh0bWwoJ0FkZCBFbnRyeScpO1xuICBzaG93KCk7XG59XG5cbm1vZHVsZS5leHBvcnRzLmVkaXQgPSBmdW5jdGlvbihlbnRyeSkge1xuICByZXNldCgpO1xuXG4gIGVkaXROYW1lID0gZW50cnkubmFtZTtcbiAgb3RoZXJDb3VudCA9IDA7XG4gIGlzTmV3ID0gZmFsc2U7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwLXRpdGxlJykuaHRtbCgnRWRpdCBFbnRyeScpO1xuICBzaG93KCk7XG59O1xuXG5mdW5jdGlvbiBhZGRGaWVsZChpdGVtKSB7XG4gIHZhciBodG1sID1cbiAgICAnPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj4nK1xuICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbC1zbS0zIGNvbnRyb2wtbGFiZWxcIj4nK1xuICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBwbGFjZWhvbGRlcj1cIkZpZWxkIE5hbWVcIiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctbmFtZVwiIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiLz4nK1xuICAgICAgJzwvbGFiZWw+JytcbiAgICAgICc8ZGl2IGNsYXNzPVwiY29sLXNtLTlcIj4nK1xuICAgICAgICAnPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnXCIgcGxhY2Vob2xkZXI9XCJQYXNzd29yZFwiIC8+JytcbiAgICAgICAgJzxpbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy12ZXJpZnlcIiBwbGFjZWhvbGRlcj1cIlZlcmlmeSBQYXNzd29yZFwiIC8+JytcbiAgICAgICAgJzxzcGFuIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy1tc2dcIj48L3NwYW4+JytcbiAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT48L2E+JytcbiAgICAgICc8L2Rpdj4nK1xuICAgICc8L2Rpdj4nO1xuXG4gIHZhciBlbGUgPSAkKGh0bWwpO1xuICBlbGUuZmluZCgnaW5wdXQnKS5vbignYmx1cicsIHZlcmlmeSk7XG5cbiAgJCgnI2VkaXQtZW50cnktb3RoZXItZmllbGRzJykuYXBwZW5kKGVsZSk7XG4gIG90aGVyQ291bnQrKztcbn1cblxuZnVuY3Rpb24gdmVyaWZ5KCkge1xuICB2YXIgZXJyb3JzID0gW10sIGk7XG4gIGVycm9ycy5wdXNoKHZlcmlmeUl0ZW0oKSk7XG4gIGZvciggaSA9IDA7IGkgPCBvdGhlckNvdW50OyBpKysgKSB7XG4gICAgZXJyb3JzLnB1c2godmVyaWZ5SXRlbShpKSk7XG4gIH1cblxuICBmb3IoIGkgPSAwOyBpIDwgZXJyb3JzLmxlbmd0aDsgaSsrICkge1xuICAgIGlmKCBlcnJvcnNbaV0gKSByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0RW50cnkoKSB7XG4gIHZhciBlbnRyeSA9IHtcbiAgICBuYW1lIDogJChyb290KyctbmFtZScpLnZhbCgpLFxuICAgIGRlc2NyaXB0aW9uIDogJChyb290KyctZGVzY3JpcHRpb24nKS52YWwoKSxcbiAgICBwYXNzd29yZCA6ICQocm9vdCkudmFsKClcbiAgfTtcblxuICBmb3IoIGkgPSAwOyBpIDwgb3RoZXJDb3VudDsgaSsrICkge1xuICAgIHZhciBuYW1lID0gJChyb290KyctJytvdGhlckNvdW50KyctbmFtZScpLnZhbCgpO1xuICAgIHZhciBwYXNzID0gJChyb290KyctJytvdGhlckNvdW50KS52YWwoKTtcblxuICAgIGlmKCBuYW1lID09ICduYW1lJyB8fCBuYW1lID09ICdwYXNzd29yZCcgfHwgbmFtZSA9PSAnZGVzY3JpcHRpb24nICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGVudHJ5W25hbWVdID0gcGFzcztcbiAgfVxuXG4gIHJldHVybiBlbnRyeTtcbn1cblxuZnVuY3Rpb24gdmVyaWZ5SXRlbShpbmRleCkge1xuICB2YXIgaXNDdXN0b20gPSBmYWxzZTtcblxuICBpZiggaW5kZXggIT09IHVuZGVmaW5lZCApIHtcbiAgICByb290ICs9ICctJytpbmRleDtcbiAgICBpc0N1c3RvbSA9IHRydWU7XG4gIH1cblxuICB2YXIgbmFtZSA9ICQocm9vdCsnLW5hbWUnKS52YWwoKTtcbiAgdmFyIHBhc3MgPSAkKHJvb3QpLnZhbCgpO1xuICB2YXIgdmVyaWZ5UGFzcyA9ICQocm9vdCsnLXZlcmlmeScpLnZhbCgpO1xuICB2YXIgbXNnID0gJChyb290KyctbXNnJyk7XG5cbiAgaWYoIHBhc3MubGVuZ3RoID09PSAwICkge1xuICAgIGVycm9yKG1zZywgJ1lvdSBkaWQgbm90IHByb3ZpZGUgYSBwYXNzd29yZCcpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYoIHZlcmlmeVBhc3MgIT0gcGFzcyApIHtcbiAgICBlcnJvcihtc2csICdZb3VyIGl0ZW1zIGRvIG5vdCBtYXRjaCcpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYoIG5hbWUubGVuZ3RoID09PSAwICkge1xuICAgIGVycm9yKG1zZywgJ1lvdSBtdXN0IHByb3ZpZGUgYSBuYW1lJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggKG5hbWUgPT0gJ25hbWUnIHx8IG5hbWUgPT0gJ3Bhc3N3b3JkJyB8fCBuYW1lID09ICdkZXNjcmlwdGlvbicpICYmIGlzQ3VzdG9tICkge1xuICAgIGVycm9yKG1zZywgJ0ludmFsaWQgbmFtZScpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgbXNnLmh0bWwoJzxzcGFuIGNsYXNzPVwidGV4dCB0ZXh0LXN1Y2Nlc3NcIj48aSBjbGFzcz1cImZhIGZhLWNoZWNrXCI+PC9pPjwvc3Bhbj4nKTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGVycm9yKGVsZSwgbXNnKSB7XG4gIGVsZS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCI+Jyttc2crJzwvZGl2PicpO1xufVxuXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgJCgnI2VkaXQtZW50cnktbmFtZScpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LWRlc2NyaXB0aW9uJykudmFsKCcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQnKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC12ZXJpZnknKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1vdGhlci1maWVsZHMnKS5odG1sKCcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtbXNnJykuaHRtbCgnJyk7XG59XG5cbmZ1bmN0aW9uIHNob3coKSB7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwJykubW9kYWwoJ3Nob3cnKTtcbn1cbiIsInZhciBmcyA9IE5PREUuZnM7XG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi8uLi9zZXR0aW5ncycpO1xudmFyIGNyeXB0byA9IHJlcXVpcmUoJy4uLy4uL2NyeXB0bycpO1xudmFyIHNlYXJjaCA9IHJlcXVpcmUoJy4vc2VhcmNoJyk7XG52YXIgZWRpdCA9IHJlcXVpcmUoJy4vZWRpdCcpO1xudmFyIGNvbmZpZztcblxudmFyIGN1cnJlbnRWYXVsdCA9IHtcbiAgZmlsZSA6ICcnLFxuICBkYXRhIDogbnVsbFxufTtcblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAkKCcjdXNlJylbMF0ub25TaG93ID0gb25TaG93O1xuXG4gICQoJyN1bmxvY2stcG9wdXAnKS5tb2RhbCh7c2hvdzogZmFsc2V9KTtcbiAgJCgnI3VubG9jay1zaG93LWJ0bicpLm9uKCdjbGljaycsZnVuY3Rpb24oKXtcbiAgICAkKCcjdW5sb2NrLXBvcHVwLWZpbGVuYW1lJykuaHRtbChWYXVsdC5hY3RpdmUpO1xuICAgICQoJyN2YXVsdC1wb3B1cC1tZXNzYWdlJykuaHRtbCgnJyk7XG4gICAgJCgnI3VubG9jay1wb3B1cCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgJCgnI3VubG9jay1wb3B1cC1wYXNzd29yZCcpLnZhbCgnJyk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgJCgnI3VubG9jay1wb3B1cC1wYXNzd29yZCcpLmZvY3VzKCk7XG4gICAgfSwgMjUwKTtcbiAgfSk7XG5cbiAgJCgnI3VubG9jay1idG4nKS5vbignY2xpY2snLGZ1bmN0aW9uKCl7XG4gICAgYXR0ZW1wdFVubG9jaygpO1xuICB9KTtcbiAgJCgnI3VubG9jay1wb3B1cC1wYXNzd29yZCcpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpe1xuICAgIGlmKCBlLndoaWNoID09IDEzICkgYXR0ZW1wdFVubG9jaygpO1xuICB9KTtcbiAgJCgnI2ZpbmQtcGFzc3dvcmQtaW5wdXQnKS5vbigna2V5dXAnLCBmdW5jdGlvbihlKXtcbiAgICBzZWFyY2goY3VycmVudFZhdWx0LmRhdGEpO1xuICB9KTtcblxuICBlZGl0LmluaXQob25TYXZlKTtcblxuICBvblNob3coKTtcbn07XG5cbmZ1bmN0aW9uIHJlc2V0VWkoKSB7XG4gICQoJyN1c2UtbWVzc2FnZScpLmh0bWwoJycpO1xuICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCcnKTtcbiAgJCgnI2ZpbmQtcGFzc3dvcmQnKS5oaWRlKCk7XG4gICQoJyN1bmxvY2stc2hvdy1idG4nKS5oaWRlKCk7XG59XG5cbmZ1bmN0aW9uIG9uU2F2ZShpbmZvKSB7XG4gIHZhciBpLCBpdGVtO1xuXG4gIC8vIGp1c3QgYSBzaW1wbGUgZWRpdFxuICBpZiggaW5mby5vcmlnaW5hbE5hbWUgPT0gaW5mby5lbnRyeS5uYW1lICkge1xuICAgIHVwZGF0ZUVudHJ5KGluZm8uZW50cnkpO1xuICAgIHNhdmUoKTtcbiAgICBlZGl0LmhpZGUoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaXNPdmVyd3JpdGUgPSBmYWxzZTtcbiAgZm9yKCBpID0gMDsgaSA8IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLmxlbmd0aDsgaSsrICkge1xuICAgIGl0ZW0gPSBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXTtcbiAgICBpZiggaXRlbS5uYW1lID09IGluZm8uZW50cnkubmFtZSApIHtcbiAgICAgIGlzT3ZlcndyaXRlID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmKCBpc092ZXJ3cml0ZSAmJiAhY29uZmlybSgnXCInK2VudHJ5KydcIiBhbHJlYWR5IGV4aXN0cywgYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIG92ZXJ3cml0ZT8hJykgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYoIGluZm8uaXNOZXcgKSB7XG4gICAgY3VycmVudFZhdWx0LmRhdGEuaXRlbXMucHVzaChpbmZvLmVudHJ5KTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVFbnRyeShpbmZvLmVudHJ5KTtcbiAgfVxuXG4gIHNhdmUoKTtcbiAgZWRpdC5oaWRlKCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUVudHJ5KGVudHJ5KSB7XG4gIGZvciggaSA9IDA7IGkgPCBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICBpdGVtID0gY3VycmVudFZhdWx0LmRhdGEuaXRlbXNbaV07XG4gICAgaWYoIGl0ZW0ubmFtZSA9PSBlbnRyeS5uYW1lICkge1xuICAgICAgY3VycmVudFZhdWx0LmRhdGEuaXRlbXNbaV0gPSBlbnRyeTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2F2ZSgpIHtcbiAgdmFyIGRhdGEgPSBjcnlwdG8uZW5jcnlwdChKU09OLnN0cmluZ2lmeShjdXJyZW50VmF1bHQuZGF0YSkpO1xuICBmcy53cml0ZUZpbGVTeW5jKGN1cnJlbnRWYXVsdC5maWxlLCBkYXRhKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2VsZWN0b3IoKSB7XG4gIGlmKCAhY29uZmlnLnZhdWx0cyApIHJldHVybjtcblxuICB2YXIgaHRtbCA9ICcnO1xuICBmb3IoIHZhciBpID0gMDsgaSA8IGNvbmZpZy52YXVsdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIicrY29uZmlnLnZhdWx0c1tpXSsnXCIgJysoY29uZmlnLnZhdWx0c1tpXSA9PSBWYXVsdC5hY3RpdmUgPyAnc2VsZWN0ZWQnIDogJycpKyc+Jytjb25maWcudmF1bHRzW2ldKyc8L29wdGlvbj4nO1xuICB9XG4gICQoJyN2YXVsdC1zZWxlY3QnKS5odG1sKGh0bWwpO1xufVxuXG5mdW5jdGlvbiBvblNob3coKSB7XG4gIGNvbmZpZyA9IHNldHRpbmdzLmdldCgpO1xuICByZXNldFVpKCk7XG5cbiAgaWYoIFZhdWx0LmFjdGl2ZSApIHtcbiAgICBvblZhdWx0U2V0KCk7XG4gIH0gZWxzZSBpZiAoIGNvbmZpZy52YXVsdHMgJiYgY29uZmlnLnZhdWx0cy5sZW5ndGggPiAwICkge1xuICAgIFZhdWx0LmFjdGl2ZSA9IGNvbmZpZy52YXVsdHNbMF07XG4gICAgb25WYXVsdFNldCgpO1xuICB9IGVsc2Uge1xuICAgIHdhcm4oJ1lvdSBoYXZlIG5vIHZhdWx0cy4gIFlvdSBtdXN0IGZpcnN0IGNyZWF0ZSBvbmUnKTtcbiAgfVxuXG4gIGNyZWF0ZVNlbGVjdG9yKCk7XG59XG5cbmZ1bmN0aW9uIG9uVmF1bHRTZXQoKSB7XG4gIGlmKCBWYXVsdC5hY3RpdmUgPT09IGN1cnJlbnRWYXVsdC5maWxlICYmIGN1cnJlbnRWYXVsdC5kYXRhICE9PSBudWxsICkge1xuICAgICQoJyN1bmxvY2stc2hvdy1idG4nKS5oaWRlKCk7XG4gICAgJCgnI2ZpbmQtcGFzc3dvcmQnKS5zaG93KCk7XG4gICAgJCgnI2ZpbmQtcGFzc3dvcmQtaW5wdXQnKS5mb2N1cygpO1xuICB9IGVsc2Uge1xuICAgICQoJyN1bmxvY2stc2hvdy1idG4nKS5zaG93KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXR0ZW1wdFVubG9jaygpIHtcbiAgY3VycmVudFZhdWx0LmRhdGEgPSBudWxsO1xuICBjcnlwdG8uc2V0UGFzc3dvcmQoJCgnI3VubG9jay1wb3B1cC1wYXNzd29yZCcpLnZhbCgpKTtcbiAgdmFyIGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoVmF1bHQuYWN0aXZlLCAndXRmOCcpO1xuXG4gIHRyeSB7XG4gICAgZGF0YSA9IEpTT04ucGFyc2UoY3J5cHRvLmRlY3J5cHQoZGF0YSkpO1xuICB9IGNhdGNoKGUpIHtcbiAgICAkKCcjdmF1bHQtcG9wdXAtbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIj5JbnZhbGlkIFBhc3N3b3JkPC9kaXY+Jyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtc3VjY2Vzc1wiPlN1Y2Nlc3MhPC9kaXY+Jyk7XG5cblxuICBjdXJyZW50VmF1bHQuZGF0YSA9IGRhdGE7XG4gIGN1cnJlbnRWYXVsdC5maWxlID0gVmF1bHQuYWN0aXZlO1xuICBvblZhdWx0U2V0KCk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAkKCcjdW5sb2NrLXBvcHVwJykubW9kYWwoJ2hpZGUnKTtcbiAgfSwgNTAwKTtcbn1cblxuZnVuY3Rpb24gd2Fybihtc2cpIHtcbiAgaWYoICFtc2cgKSAkKCd1c2UtbWVzc2FnZScpLmh0bWwoJycpO1xuICBlbHNlICQoJ3VzZS1tZXNzYWdlJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXdhcm5cIj4nK21zZysnPC9kaXY+Jyk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgaWYoICFkYXRhLml0ZW1zICkgcmV0dXJuO1xuXG4gIHZhciB0ZXh0ID0gJCgnI2ZpbmQtcGFzc3dvcmQtaW5wdXQnKS52YWwoKTtcbiAgdmFyIHJlID0gbmV3IFJlZ0V4cCgnLionK3RleHQrJy4qJywgJ2knKTtcblxuICB2YXIgcmVzdWx0cyA9IFtdO1xuICBkYXRhLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgdmFyIG5hbWUgPSBpdGVtLm5hbWUgfHwgJyc7XG4gICAgdmFyIGRlc2NyaXB0aW9uID0gaXRlbS5kZXNjcmlwdGlvbiB8fCAnJztcbiAgICBpZiggbmFtZS5tYXRjaChyZSkgfHwgZGVzY3JpcHRpb24ubWF0Y2gocmUpICkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVuZGVyUmVzdWx0cyhyZXN1bHRzKTtcbn07XG5cbmZ1bmN0aW9uIHJlbmRlclJlc3VsdHMoaXRlbXMpIHtcbiAgaWYoIGl0ZW1zLmxlbmd0aCA9PT0gMCApIHtcbiAgICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FybmluZ1wiPk5vIG1hdGNoZXMgZm91bmQ8L2Rpdj4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaHRtbCA9ICc8ZGl2IGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCI+JztcbiAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICBodG1sICs9XG4gICAgICAnPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj4nK1xuICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29sLXNtLTMgY29udHJvbC1sYWJlbFwiPicraXRlbS5uYW1lKyc8L2xhYmVsPicrXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29sLXNtLTdcIj4nK1xuICAgICAgICAgICc8ZGl2PicrKGl0ZW0uZGVzY3JpcHRpb24gfHwgJycpKyc8L2Rpdj4nK1xuICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZVwiPic7XG5cbiAgICBmb3IoIHZhciBrZXkgaW4gaXRlbSApIHtcbiAgICAgIGlmKCBrZXkgPT0gJ25hbWUnIHx8IGtleSA9PSAnZGVzY3JpcHRpb24nICkgY29udGludWU7XG4gICAgICBodG1sICs9XG4gICAgICAgICc8dHI+JytcbiAgICAgICAgICAnPHRkPicra2V5Kyc8L3RkPicrXG4gICAgICAgICAgJzx0ZD48c3Bhbj48L3NwYW4+JytcbiAgICAgICAgICAgICc8YSBjbGFzcz1cImJ0biBidG4tbGlua1wiIG5hbWU9XCJDb3B5IHRvIENsaXBib2FyZFwiPjxpIGNsYXNzPVwiZmEgZmEtY29weVwiPjwvaT48L2E+JytcbiAgICAgICAgICAgICc8YSBjbGFzcz1cImJ0biBidG4tbGlua1wiIG5hbWU9XCJTaG93XCI+PGkgY2xhc3M9XCJmYSBmYS1leWVcIj48L2k+PC9hPicrXG4gICAgICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBuYW1lPVwiRWRpdFwiPjxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPjwvYT4nK1xuICAgICAgICAgICc8L3RkPicrXG4gICAgICAgICc8L3RyPic7XG4gICAgfVxuXG4gICAgaHRtbCArPSAnPC90YWJsZT48L2Rpdj48L2Rpdj4nO1xuICB9KTtcbiAgJCgnI3VzZS1yZXN1bHRzJykuaHRtbChodG1sKyc8L2Rpdj4nKTtcbn1cbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgZnMgPSBOT0RFLmZzO1xuXG52YXIgRklMRU5BTUUgPSAnLm53UGFzc3dvcmRWYXVsdCc7XG5cbnZhciBwYXRoID0gdXRpbHMuZ2V0VXNlckhvbWUoKSsnLycrRklMRU5BTUU7XG5pZiggIWZzLmV4aXN0c1N5bmMocGF0aCkgKSB7XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgJ3t9Jyk7XG59XG5cbnZhciBzZXR0aW5ncyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGgsICd1dGYtOCcpKTtcblxuZnVuY3Rpb24gZ2V0KCkge1xuICByZXR1cm4gc2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gIHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgZnMud3JpdGVGaWxlU3luYyhwYXRoLCBKU09OLnN0cmluZ2lmeShzZXR0aW5ncykpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IDogZ2V0LFxuICBzZXQgOiBzZXRcbn07XG4iLCJcbm1vZHVsZS5leHBvcnRzLmdldFVzZXJIb21lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB3aW5kb3cucHJvY2Vzcy5lbnZbKHdpbmRvdy5wcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMicpID8gJ1VTRVJQUk9GSUxFJyA6ICdIT01FJ107XG59O1xuIl19
