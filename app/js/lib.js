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
var gui = window.require('nw.gui');
var clipboard = gui.Clipboard.get();

var current = [];

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
  current = [];
  var row = [];

  items.forEach(function(item){
    row = [];

    html +=
      '<div class="well"><div class="form-group">'+
        '<label class="col-sm-3 control-label" style="font-weight:bold">'+item.name+'</label>'+
        '<div class="col-sm-7">'+
          '<div style="'+(item.description ? 'padding:5px 0' : '')+'"><i>'+(item.description || '')+'</i></div>'+
          '<table class="table">';

    for( var key in item ) {
      if( key == 'name' || key == 'description' ) continue;
      html +=
        '<tr>'+
          '<td>'+(key === 'password' ? 'Password' : '')+'</td>'+
          '<td>'+
            '<a class="btn btn-link" name="Copy" index="'+current.length+'-'+row.length+'"><i class="fa fa-copy"></i></a>'+
            '<a class="btn btn-link" name="Show" index="'+current.length+'-'+row.length+'"><i class="fa fa-eye"></i></a>'+
            '<a class="btn btn-link" name="Edit" index="'+current.length+'-'+row.length+'"><i class="fa fa-pencil"></i></a>'+
            '<input type="text" class="form-control showPass" style="display:none" index="'+current.length+'-'+row.length+'" />'+
          '</td>'+
        '</tr>';
      row.push(item[key]);
    }

    current.push(row);
    html += '</table></div></div></div>';
  });

  var results = $('#use-results').html(html+'</div>');

  results.find('a[name="Copy"]').on('click', copy);
  results.find('a[name="Show"]').on('click', show);
  results.find('a[name="Edit"]').on('click', edit);
}

function show(e) {
  var ele = $(e.currentTarget);
  var id = ele.attr('index');

  if( ele.find('i').hasClass('fa-eye') ) {
    id = id.split('-');
    var row = parseInt(id[0]), col = parseInt(id[1]);
    ele.parent().find('.showPass').val(current[row][col]).show().select();
    ele.find('i').removeClass('fa-eye').addClass('fa-eye-slash');
  } else {
    ele.parent().find('.showPass').html('').hide();
    ele.find('i').removeClass('fa-eye-slash').addClass('fa-eye');
  }
}

function copy(e) {
  var ele = $(e.currentTarget);
  var id = ele.attr('index');
  id = id.split('-');
  var row = parseInt(id[0]), col = parseInt(id[1]);

  clipboard.set(current[row][col], 'text');
}

function edit(e) {

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY3J5cHRvL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibGliL2luaXQuanMiLCJsaWIvcGFnZXMvbWFuYWdlL2NyZWF0ZS5qcyIsImxpYi9wYWdlcy9tYW5hZ2UvaW5kZXguanMiLCJsaWIvcGFnZXMvcm91dGVyLmpzIiwibGliL3BhZ2VzL3VzZS9lZGl0LmpzIiwibGliL3BhZ2VzL3VzZS9pbmRleC5qcyIsImxpYi9wYWdlcy91c2Uvc2VhcmNoLmpzIiwibGliL3NldHRpbmdzL2luZGV4LmpzIiwibGliL3V0aWxzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY3J5cHRvID0gTk9ERS5jcnlwdG8sXG4gICAgYWxnb3JpdGhtID0gJ2Flcy0yNTYtY3RyJyxcbiAgICBwYXNzd29yZCA9ICcnO1xuXG5tb2R1bGUuZXhwb3J0cy5lbmNyeXB0ID0gZnVuY3Rpb24odGV4dCl7XG4gIHZhciBjaXBoZXIgPSBjcnlwdG8uY3JlYXRlQ2lwaGVyKGFsZ29yaXRobSwgcGFzc3dvcmQpO1xuICB2YXIgY3J5cHRlZCA9IGNpcGhlci51cGRhdGUodGV4dCwndXRmOCcsJ2hleCcpO1xuICBjcnlwdGVkICs9IGNpcGhlci5maW5hbCgnaGV4Jyk7XG4gIHJldHVybiBjcnlwdGVkO1xufTtcblxubW9kdWxlLmV4cG9ydHMuZGVjcnlwdCA9IGZ1bmN0aW9uKHRleHQpe1xuICB2YXIgZGVjaXBoZXIgPSBjcnlwdG8uY3JlYXRlRGVjaXBoZXIoYWxnb3JpdGhtLHBhc3N3b3JkKTtcbiAgdmFyIGRlYyA9IGRlY2lwaGVyLnVwZGF0ZSh0ZXh0LCdoZXgnLCd1dGY4Jyk7XG4gIGRlYyArPSBkZWNpcGhlci5maW5hbCgndXRmOCcpO1xuICByZXR1cm4gZGVjO1xufTtcblxubW9kdWxlLmV4cG9ydHMuc2V0UGFzc3dvcmQgPSBmdW5jdGlvbihwYXNzKSB7XG4gIHBhc3N3b3JkID0gcGFzcztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cy5jcnlwdG8gPSByZXF1aXJlKCcuL2NyeXB0bycpO1xuXG5yZXF1aXJlKCcuL2luaXQnKSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgJCh3aW5kb3cpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiggZS53aGljaCA9PSA3MyAmJiBlLmN0cmxLZXkgKSB7XG4gICAgICB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJykuV2luZG93LmdldCgpLnNob3dEZXZUb29scygpO1xuICAgIH0gZWxzZSBpZiAoIGUud2hpY2ggPT0gOTEgJiYgZS5jdHJsS2V5ICkge1xuICAgICAgd2luZG93LnJlbG9hZCgpO1xuICAgIH1cbiAgfSk7XG5cbiAgJChkb2N1bWVudCkub24oJ3JlYWR5JywgZnVuY3Rpb24oKXtcbiAgICByZXF1aXJlKCcuL3BhZ2VzL3JvdXRlcicpO1xuICAgIHJlcXVpcmUoJy4vcGFnZXMvbWFuYWdlJykuaW5pdCgpO1xuICAgIHJlcXVpcmUoJy4vcGFnZXMvdXNlJykuaW5pdCgpO1xuICB9KTtcblxufTtcbiIsInZhciBmcyA9IE5PREUuZnM7XG52YXIgY3J5cHRvID0gcmVxdWlyZSgnLi4vLi4vY3J5cHRvJyk7XG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi8uLi9zZXR0aW5ncycpO1xuXG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgJCgnI2NyZWF0ZS1idG4nKS5vbignY2xpY2snLCBjcmVhdGUpO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlKCkge1xuICB2YXIgaW5mbyA9IHtcbiAgICBsb2NhdGlvbiA6ICQoJyNuZXctbG9jYXRpb24nKS52YWwoKSxcbiAgICBwYXNzd29yZCA6ICQoJyNuZXctcGFzc3dvcmQnKS52YWwoKSxcbiAgICBwYXNzd29yZFZlcmlmeSA6ICQoJyNuZXctcGFzc3dvcmQtdmVyaWZ5JykudmFsKClcbiAgfTtcblxuICBpZiggaW5mby5sb2NhdGlvbi5sZW5ndGggPT09IDAgKSB7XG4gICAgcmV0dXJuIGVycm9yKCdZb3UgbXVzdCBwcm92aWRlIGEgbG9jYXRpb24gZm9yIHRoZSB2YXVsdC4nKTtcbiAgfVxuICBpZiggaW5mby5wYXNzd29yZCAhPT0gaW5mby5wYXNzd29yZFZlcmlmeSApIHtcbiAgICByZXR1cm4gZXJyb3IoJ1lvdXIgcGFzc3dvcmRzIGRvIG5vdCBtYXRjaC4nKTtcbiAgfVxuICBpZiggaW5mby5wYXNzd29yZC5sZW5ndGggPCA4ICkge1xuICAgIHJldHVybiBlcnJvcignWW91ciBwYXNzd29yZCBpcyBsZXNzIHRoYW4gOCBjaGFyYWN0ZXJzLicpO1xuICB9XG5cbiAgaW5mby5sb2NhdGlvbiA9IGluZm8ubG9jYXRpb24rJy9wYXNzLnZhdWx0JztcbiAgc3VjY2VzcygpO1xuXG4gIHZhciBlbXB0eSA9IHtcbiAgICBpdGVtcyA6IFtdXG4gIH07XG5cbiAgY3J5cHRvLnNldFBhc3N3b3JkKGluZm8ucGFzc3dvcmQpO1xuICB2YXIgZGF0YSA9IGNyeXB0by5lbmNyeXB0KEpTT04uc3RyaW5naWZ5KGVtcHR5KSk7XG4gIGZzLndyaXRlRmlsZVN5bmMoaW5mby5sb2NhdGlvbiwgZGF0YSk7XG5cbiAgVmF1bHQuYWN0aXZlID0ge1xuICAgIGxvY2F0aW9uIDogaW5mby5sb2NhdGlvbixcbiAgICBwYXNzd29yZCA6IGluZm8ucGFzc3dvcmRcbiAgfTtcblxuICB2YXIgY29uZmlnID0gc2V0dGluZ3MuZ2V0KCk7XG4gIGlmKCAhY29uZmlnLnZhdWx0cyApIGNvbmZpZy52YXVsdHMgPSBbXTtcbiAgY29uZmlnLnZhdWx0cy5wdXNoKGluZm8ubG9jYXRpb24pO1xuXG4gIHNldHRpbmdzLnNldCgndmF1bHRzJywgY29uZmlnLnZhdWx0cyk7XG5cbiAgJCgnI25ldy1sb2NhdGlvbicpLnZhbCgnJyk7XG4gICQoJyNuZXctcGFzc3dvcmQnKS52YWwoJycpO1xuICAkKCcjbmV3LXBhc3N3b3JkLXZlcmlmeScpLnZhbCgnJyk7XG5cbiAgd2luZG93LmxvY2F0aW9uID0gJyN1c2UnO1xufVxuXG5mdW5jdGlvbiBzdWNjZXNzKCkge1xuICBlcnJvcignJyk7XG59XG5cbmZ1bmN0aW9uIGVycm9yKG1zZykge1xuICBpZiggIW1zZyApICQoJyNuZXctbWVzc2FnZScpLmh0bWwoJycpO1xuICBlbHNlICQoJyNuZXctbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIj4nK21zZysnPC9kaXY+Jyk7XG59XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscycpO1xudmFyIGNyZWF0ZSA9IHJlcXVpcmUoJy4vY3JlYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICBjcmVhdGUuaW5pdCgpO1xufTtcbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL3NldHRpbmdzJyk7XG5cbiQod2luZG93KS5vbignaGFzaGNoYW5nZScsIHVwZGF0ZVBhZ2UpO1xudXBkYXRlUGFnZSgpO1xuXG5mdW5jdGlvbiB1cGRhdGVQYWdlKCkge1xuICB2YXIgcGFydHMgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5yZXBsYWNlKC8jLywnJykuc3BsaXQoJy8nKTtcblxuICB2YXIgY29uZmlnID0gc2V0dGluZ3MuZ2V0KCk7XG4gIHZhciBwYWdlID0gcGFydHNbMF07XG5cbiAgaWYoIHBhZ2UgPT09ICcnICkge1xuICAgIGlmKCBjb25maWcuZGVmYXVsdCApIHtcbiAgICAgIHBhZ2UgPSAndXNlJztcbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZSA9ICdtYW5hZ2UnO1xuICAgIH1cbiAgfVxuXG4gICQoJy5wYWdlJykuaGlkZSgpO1xuICB2YXIgZWxlID0gJCgnIycrcGFnZSkuc2hvdygpO1xuXG4gIGlmKCBlbGVbMF0ub25TaG93ICkgZWxlWzBdLm9uU2hvdygpO1xufVxuIiwidmFyIGVudHJ5ID0gbnVsbDtcbnZhciBpc05ldyA9IGZhbHNlO1xudmFyIGVkaXROYW1lID0gJyc7XG52YXIgb3RoZXJDb3VudCA9IDA7XG52YXIgcm9vdCA9ICcjZWRpdC1lbnRyeS1wYXNzd29yZCc7XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbihvblNhdmUpIHtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAnKS5tb2RhbCh7XG4gICAgc2hvdzogZmFsc2UsXG4gICAgYmFja2Ryb3A6ICdzdGF0aWMnXG4gIH0pO1xuICAkKCcjYWRkLWVudHJ5LWJ0bicpLm9uKCdjbGljaycsIGFkZCk7XG4gICQoJyNlZGl0LWVudHJ5LWFkZC1maWVsZC1idG4nKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIGFkZEZpZWxkKCk7XG4gIH0pO1xuXG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkJykub24oJ2JsdXInLCB2ZXJpZnkpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC12ZXJpZnknKS5vbignYmx1cicsIHZlcmlmeSk7XG5cbiAgJCgnI2VkaXQtZW50cnktc2F2ZS1idG4nKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIHZhciBoYXNFcnJvciA9IHZlcmlmeSgpO1xuICAgIGlmKCBoYXNFcnJvciApIHJldHVybjtcblxuICAgIHZhciBlbnRyeSA9IGdldEVudHJ5KCk7XG4gICAgb25TYXZlKHtcbiAgICAgIGVudHJ5OiBlbnRyeSxcbiAgICAgIG9yaWdpbmFsTmFtZSA6IGVkaXROYW1lLFxuICAgICAgaXNOZXcgOiBpc05ld1xuICAgIH0pO1xuICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xufTtcblxuZnVuY3Rpb24gYWRkKCkge1xuICByZXNldCgpO1xuXG4gIG90aGVyQ291bnQgPSAwO1xuICBpc05ldyA9IHRydWU7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwLXRpdGxlJykuaHRtbCgnQWRkIEVudHJ5Jyk7XG4gIHNob3coKTtcbn1cblxubW9kdWxlLmV4cG9ydHMuZWRpdCA9IGZ1bmN0aW9uKGVudHJ5KSB7XG4gIHJlc2V0KCk7XG5cbiAgZWRpdE5hbWUgPSBlbnRyeS5uYW1lO1xuICBvdGhlckNvdW50ID0gMDtcbiAgaXNOZXcgPSBmYWxzZTtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAtdGl0bGUnKS5odG1sKCdFZGl0IEVudHJ5Jyk7XG4gIHNob3coKTtcbn07XG5cbmZ1bmN0aW9uIGFkZEZpZWxkKGl0ZW0pIHtcbiAgdmFyIGh0bWwgPVxuICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPicrXG4gICAgICAnPGxhYmVsIGNsYXNzPVwiY29sLXNtLTMgY29udHJvbC1sYWJlbFwiPicrXG4gICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIHBsYWNlaG9sZGVyPVwiRmllbGQgTmFtZVwiIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy1uYW1lXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIvPicrXG4gICAgICAnPC9sYWJlbD4nK1xuICAgICAgJzxkaXYgY2xhc3M9XCJjb2wtc20tOVwiPicrXG4gICAgICAgICc8aW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KydcIiBwbGFjZWhvbGRlcj1cIlBhc3N3b3JkXCIgLz4nK1xuICAgICAgICAnPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLXZlcmlmeVwiIHBsYWNlaG9sZGVyPVwiVmVyaWZ5IFBhc3N3b3JkXCIgLz4nK1xuICAgICAgICAnPHNwYW4gaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW1zZ1wiPjwvc3Bhbj4nK1xuICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoXCI+PC9pPjwvYT4nK1xuICAgICAgJzwvZGl2PicrXG4gICAgJzwvZGl2Pic7XG5cbiAgdmFyIGVsZSA9ICQoaHRtbCk7XG4gIGVsZS5maW5kKCdpbnB1dCcpLm9uKCdibHVyJywgdmVyaWZ5KTtcblxuICAkKCcjZWRpdC1lbnRyeS1vdGhlci1maWVsZHMnKS5hcHBlbmQoZWxlKTtcbiAgb3RoZXJDb3VudCsrO1xufVxuXG5mdW5jdGlvbiB2ZXJpZnkoKSB7XG4gIHZhciBlcnJvcnMgPSBbXSwgaTtcbiAgZXJyb3JzLnB1c2godmVyaWZ5SXRlbSgpKTtcbiAgZm9yKCBpID0gMDsgaSA8IG90aGVyQ291bnQ7IGkrKyApIHtcbiAgICBlcnJvcnMucHVzaCh2ZXJpZnlJdGVtKGkpKTtcbiAgfVxuXG4gIGZvciggaSA9IDA7IGkgPCBlcnJvcnMubGVuZ3RoOyBpKysgKSB7XG4gICAgaWYoIGVycm9yc1tpXSApIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXRFbnRyeSgpIHtcbiAgdmFyIGVudHJ5ID0ge1xuICAgIG5hbWUgOiAkKHJvb3QrJy1uYW1lJykudmFsKCksXG4gICAgZGVzY3JpcHRpb24gOiAkKHJvb3QrJy1kZXNjcmlwdGlvbicpLnZhbCgpLFxuICAgIHBhc3N3b3JkIDogJChyb290KS52YWwoKVxuICB9O1xuXG4gIGZvciggaSA9IDA7IGkgPCBvdGhlckNvdW50OyBpKysgKSB7XG4gICAgdmFyIG5hbWUgPSAkKHJvb3QrJy0nK290aGVyQ291bnQrJy1uYW1lJykudmFsKCk7XG4gICAgdmFyIHBhc3MgPSAkKHJvb3QrJy0nK290aGVyQ291bnQpLnZhbCgpO1xuXG4gICAgaWYoIG5hbWUgPT0gJ25hbWUnIHx8IG5hbWUgPT0gJ3Bhc3N3b3JkJyB8fCBuYW1lID09ICdkZXNjcmlwdGlvbicgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZW50cnlbbmFtZV0gPSBwYXNzO1xuICB9XG5cbiAgcmV0dXJuIGVudHJ5O1xufVxuXG5mdW5jdGlvbiB2ZXJpZnlJdGVtKGluZGV4KSB7XG4gIHZhciBpc0N1c3RvbSA9IGZhbHNlO1xuXG4gIGlmKCBpbmRleCAhPT0gdW5kZWZpbmVkICkge1xuICAgIHJvb3QgKz0gJy0nK2luZGV4O1xuICAgIGlzQ3VzdG9tID0gdHJ1ZTtcbiAgfVxuXG4gIHZhciBuYW1lID0gJChyb290KyctbmFtZScpLnZhbCgpO1xuICB2YXIgcGFzcyA9ICQocm9vdCkudmFsKCk7XG4gIHZhciB2ZXJpZnlQYXNzID0gJChyb290KyctdmVyaWZ5JykudmFsKCk7XG4gIHZhciBtc2cgPSAkKHJvb3QrJy1tc2cnKTtcblxuICBpZiggcGFzcy5sZW5ndGggPT09IDAgKSB7XG4gICAgZXJyb3IobXNnLCAnWW91IGRpZCBub3QgcHJvdmlkZSBhIHBhc3N3b3JkJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggdmVyaWZ5UGFzcyAhPSBwYXNzICkge1xuICAgIGVycm9yKG1zZywgJ1lvdXIgaXRlbXMgZG8gbm90IG1hdGNoJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggbmFtZS5sZW5ndGggPT09IDAgKSB7XG4gICAgZXJyb3IobXNnLCAnWW91IG11c3QgcHJvdmlkZSBhIG5hbWUnKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmKCAobmFtZSA9PSAnbmFtZScgfHwgbmFtZSA9PSAncGFzc3dvcmQnIHx8IG5hbWUgPT0gJ2Rlc2NyaXB0aW9uJykgJiYgaXNDdXN0b20gKSB7XG4gICAgZXJyb3IobXNnLCAnSW52YWxpZCBuYW1lJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBtc2cuaHRtbCgnPHNwYW4gY2xhc3M9XCJ0ZXh0IHRleHQtc3VjY2Vzc1wiPjxpIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj48L2k+PC9zcGFuPicpO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZXJyb3IoZWxlLCBtc2cpIHtcbiAgZWxlLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIj4nK21zZysnPC9kaXY+Jyk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0KCkge1xuICAkKCcjZWRpdC1lbnRyeS1uYW1lJykudmFsKCcnKTtcbiAgJCgnI2VkaXQtZW50cnktZGVzY3JpcHRpb24nKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZCcpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLXZlcmlmeScpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LW90aGVyLWZpZWxkcycpLmh0bWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC1tc2cnKS5odG1sKCcnKTtcbn1cblxuZnVuY3Rpb24gc2hvdygpIHtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAnKS5tb2RhbCgnc2hvdycpO1xufVxuIiwidmFyIGZzID0gTk9ERS5mcztcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uLy4uL3NldHRpbmdzJyk7XG52YXIgY3J5cHRvID0gcmVxdWlyZSgnLi4vLi4vY3J5cHRvJyk7XG52YXIgc2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2gnKTtcbnZhciBlZGl0ID0gcmVxdWlyZSgnLi9lZGl0Jyk7XG52YXIgY29uZmlnO1xuXG52YXIgY3VycmVudFZhdWx0ID0ge1xuICBmaWxlIDogJycsXG4gIGRhdGEgOiBudWxsXG59O1xuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICQoJyN1c2UnKVswXS5vblNob3cgPSBvblNob3c7XG5cbiAgJCgnI3VubG9jay1wb3B1cCcpLm1vZGFsKHtzaG93OiBmYWxzZX0pO1xuICAkKCcjdW5sb2NrLXNob3ctYnRuJykub24oJ2NsaWNrJyxmdW5jdGlvbigpe1xuICAgICQoJyN1bmxvY2stcG9wdXAtZmlsZW5hbWUnKS5odG1sKFZhdWx0LmFjdGl2ZSk7XG4gICAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCcnKTtcbiAgICAkKCcjdW5sb2NrLXBvcHVwJykubW9kYWwoJ3Nob3cnKTtcbiAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykudmFsKCcnKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykuZm9jdXMoKTtcbiAgICB9LCAyNTApO1xuICB9KTtcblxuICAkKCcjdW5sb2NrLWJ0bicpLm9uKCdjbGljaycsZnVuY3Rpb24oKXtcbiAgICBhdHRlbXB0VW5sb2NrKCk7XG4gIH0pO1xuICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykub24oJ2tleXVwJywgZnVuY3Rpb24oZSl7XG4gICAgaWYoIGUud2hpY2ggPT0gMTMgKSBhdHRlbXB0VW5sb2NrKCk7XG4gIH0pO1xuICAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpe1xuICAgIHNlYXJjaChjdXJyZW50VmF1bHQuZGF0YSk7XG4gIH0pO1xuXG4gIGVkaXQuaW5pdChvblNhdmUpO1xuXG4gIG9uU2hvdygpO1xufTtcblxuZnVuY3Rpb24gcmVzZXRVaSgpIHtcbiAgJCgnI3VzZS1tZXNzYWdlJykuaHRtbCgnJyk7XG4gICQoJyN1c2UtcmVzdWx0cycpLmh0bWwoJycpO1xuICAkKCcjZmluZC1wYXNzd29yZCcpLmhpZGUoKTtcbiAgJCgnI3VubG9jay1zaG93LWJ0bicpLmhpZGUoKTtcbn1cblxuZnVuY3Rpb24gb25TYXZlKGluZm8pIHtcbiAgdmFyIGksIGl0ZW07XG5cbiAgLy8ganVzdCBhIHNpbXBsZSBlZGl0XG4gIGlmKCBpbmZvLm9yaWdpbmFsTmFtZSA9PSBpbmZvLmVudHJ5Lm5hbWUgKSB7XG4gICAgdXBkYXRlRW50cnkoaW5mby5lbnRyeSk7XG4gICAgc2F2ZSgpO1xuICAgIGVkaXQuaGlkZSgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpc092ZXJ3cml0ZSA9IGZhbHNlO1xuICBmb3IoIGkgPSAwOyBpIDwgY3VycmVudFZhdWx0LmRhdGEuaXRlbXMubGVuZ3RoOyBpKysgKSB7XG4gICAgaXRlbSA9IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zW2ldO1xuICAgIGlmKCBpdGVtLm5hbWUgPT0gaW5mby5lbnRyeS5uYW1lICkge1xuICAgICAgaXNPdmVyd3JpdGUgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYoIGlzT3ZlcndyaXRlICYmICFjb25maXJtKCdcIicrZW50cnkrJ1wiIGFscmVhZHkgZXhpc3RzLCBhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gb3ZlcndyaXRlPyEnKSApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiggaW5mby5pc05ldyApIHtcbiAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5wdXNoKGluZm8uZW50cnkpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZUVudHJ5KGluZm8uZW50cnkpO1xuICB9XG5cbiAgc2F2ZSgpO1xuICBlZGl0LmhpZGUoKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW50cnkoZW50cnkpIHtcbiAgZm9yKCBpID0gMDsgaSA8IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLmxlbmd0aDsgaSsrICkge1xuICAgIGl0ZW0gPSBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXTtcbiAgICBpZiggaXRlbS5uYW1lID09IGVudHJ5Lm5hbWUgKSB7XG4gICAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXSA9IGVudHJ5O1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzYXZlKCkge1xuICB2YXIgZGF0YSA9IGNyeXB0by5lbmNyeXB0KEpTT04uc3RyaW5naWZ5KGN1cnJlbnRWYXVsdC5kYXRhKSk7XG4gIGZzLndyaXRlRmlsZVN5bmMoY3VycmVudFZhdWx0LmZpbGUsIGRhdGEpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZWxlY3RvcigpIHtcbiAgaWYoICFjb25maWcudmF1bHRzICkgcmV0dXJuO1xuXG4gIHZhciBodG1sID0gJyc7XG4gIGZvciggdmFyIGkgPSAwOyBpIDwgY29uZmlnLnZhdWx0cy5sZW5ndGg7IGkrKyApIHtcbiAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVlPVwiJytjb25maWcudmF1bHRzW2ldKydcIiAnKyhjb25maWcudmF1bHRzW2ldID09IFZhdWx0LmFjdGl2ZSA/ICdzZWxlY3RlZCcgOiAnJykrJz4nK2NvbmZpZy52YXVsdHNbaV0rJzwvb3B0aW9uPic7XG4gIH1cbiAgJCgnI3ZhdWx0LXNlbGVjdCcpLmh0bWwoaHRtbCk7XG59XG5cbmZ1bmN0aW9uIG9uU2hvdygpIHtcbiAgY29uZmlnID0gc2V0dGluZ3MuZ2V0KCk7XG4gIHJlc2V0VWkoKTtcblxuICBpZiggVmF1bHQuYWN0aXZlICkge1xuICAgIG9uVmF1bHRTZXQoKTtcbiAgfSBlbHNlIGlmICggY29uZmlnLnZhdWx0cyAmJiBjb25maWcudmF1bHRzLmxlbmd0aCA+IDAgKSB7XG4gICAgVmF1bHQuYWN0aXZlID0gY29uZmlnLnZhdWx0c1swXTtcbiAgICBvblZhdWx0U2V0KCk7XG4gIH0gZWxzZSB7XG4gICAgd2FybignWW91IGhhdmUgbm8gdmF1bHRzLiAgWW91IG11c3QgZmlyc3QgY3JlYXRlIG9uZScpO1xuICB9XG5cbiAgY3JlYXRlU2VsZWN0b3IoKTtcbn1cblxuZnVuY3Rpb24gb25WYXVsdFNldCgpIHtcbiAgaWYoIFZhdWx0LmFjdGl2ZSA9PT0gY3VycmVudFZhdWx0LmZpbGUgJiYgY3VycmVudFZhdWx0LmRhdGEgIT09IG51bGwgKSB7XG4gICAgJCgnI3VubG9jay1zaG93LWJ0bicpLmhpZGUoKTtcbiAgICAkKCcjZmluZC1wYXNzd29yZCcpLnNob3coKTtcbiAgICAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLmZvY3VzKCk7XG4gIH0gZWxzZSB7XG4gICAgJCgnI3VubG9jay1zaG93LWJ0bicpLnNob3coKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRlbXB0VW5sb2NrKCkge1xuICBjdXJyZW50VmF1bHQuZGF0YSA9IG51bGw7XG4gIGNyeXB0by5zZXRQYXNzd29yZCgkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykudmFsKCkpO1xuICB2YXIgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhWYXVsdC5hY3RpdmUsICd1dGY4Jyk7XG5cbiAgdHJ5IHtcbiAgICBkYXRhID0gSlNPTi5wYXJzZShjcnlwdG8uZGVjcnlwdChkYXRhKSk7XG4gIH0gY2F0Y2goZSkge1xuICAgICQoJyN2YXVsdC1wb3B1cC1tZXNzYWdlJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiPkludmFsaWQgUGFzc3dvcmQ8L2Rpdj4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAkKCcjdmF1bHQtcG9wdXAtbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1zdWNjZXNzXCI+U3VjY2VzcyE8L2Rpdj4nKTtcblxuXG4gIGN1cnJlbnRWYXVsdC5kYXRhID0gZGF0YTtcbiAgY3VycmVudFZhdWx0LmZpbGUgPSBWYXVsdC5hY3RpdmU7XG4gIG9uVmF1bHRTZXQoKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICQoJyN1bmxvY2stcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xuICB9LCA1MDApO1xufVxuXG5mdW5jdGlvbiB3YXJuKG1zZykge1xuICBpZiggIW1zZyApICQoJ3VzZS1tZXNzYWdlJykuaHRtbCgnJyk7XG4gIGVsc2UgJCgndXNlLW1lc3NhZ2UnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FyblwiPicrbXNnKyc8L2Rpdj4nKTtcbn1cbiIsInZhciBndWkgPSB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJyk7XG52YXIgY2xpcGJvYXJkID0gZ3VpLkNsaXBib2FyZC5nZXQoKTtcblxudmFyIGN1cnJlbnQgPSBbXTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhKSB7XG4gIGlmKCAhZGF0YS5pdGVtcyApIHJldHVybjtcblxuICB2YXIgdGV4dCA9ICQoJyNmaW5kLXBhc3N3b3JkLWlucHV0JykudmFsKCk7XG4gIHZhciByZSA9IG5ldyBSZWdFeHAoJy4qJyt0ZXh0KycuKicsICdpJyk7XG5cbiAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgZGF0YS5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHZhciBuYW1lID0gaXRlbS5uYW1lIHx8ICcnO1xuICAgIHZhciBkZXNjcmlwdGlvbiA9IGl0ZW0uZGVzY3JpcHRpb24gfHwgJyc7XG4gICAgaWYoIG5hbWUubWF0Y2gocmUpIHx8IGRlc2NyaXB0aW9uLm1hdGNoKHJlKSApIHtcbiAgICAgIHJlc3VsdHMucHVzaChpdGVtKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlbmRlclJlc3VsdHMocmVzdWx0cyk7XG59O1xuXG5mdW5jdGlvbiByZW5kZXJSZXN1bHRzKGl0ZW1zKSB7XG4gIGlmKCBpdGVtcy5sZW5ndGggPT09IDAgKSB7XG4gICAgJCgnI3VzZS1yZXN1bHRzJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXdhcm5pbmdcIj5ObyBtYXRjaGVzIGZvdW5kPC9kaXY+Jyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGh0bWwgPSAnPGRpdiBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiPic7XG4gIGN1cnJlbnQgPSBbXTtcbiAgdmFyIHJvdyA9IFtdO1xuXG4gIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgcm93ID0gW107XG5cbiAgICBodG1sICs9XG4gICAgICAnPGRpdiBjbGFzcz1cIndlbGxcIj48ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPicrXG4gICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb2wtc20tMyBjb250cm9sLWxhYmVsXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+JytpdGVtLm5hbWUrJzwvbGFiZWw+JytcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb2wtc20tN1wiPicrXG4gICAgICAgICAgJzxkaXYgc3R5bGU9XCInKyhpdGVtLmRlc2NyaXB0aW9uID8gJ3BhZGRpbmc6NXB4IDAnIDogJycpKydcIj48aT4nKyhpdGVtLmRlc2NyaXB0aW9uIHx8ICcnKSsnPC9pPjwvZGl2PicrXG4gICAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlXCI+JztcblxuICAgIGZvciggdmFyIGtleSBpbiBpdGVtICkge1xuICAgICAgaWYoIGtleSA9PSAnbmFtZScgfHwga2V5ID09ICdkZXNjcmlwdGlvbicgKSBjb250aW51ZTtcbiAgICAgIGh0bWwgKz1cbiAgICAgICAgJzx0cj4nK1xuICAgICAgICAgICc8dGQ+Jysoa2V5ID09PSAncGFzc3dvcmQnID8gJ1Bhc3N3b3JkJyA6ICcnKSsnPC90ZD4nK1xuICAgICAgICAgICc8dGQ+JytcbiAgICAgICAgICAgICc8YSBjbGFzcz1cImJ0biBidG4tbGlua1wiIG5hbWU9XCJDb3B5XCIgaW5kZXg9XCInK2N1cnJlbnQubGVuZ3RoKyctJytyb3cubGVuZ3RoKydcIj48aSBjbGFzcz1cImZhIGZhLWNvcHlcIj48L2k+PC9hPicrXG4gICAgICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBuYW1lPVwiU2hvd1wiIGluZGV4PVwiJytjdXJyZW50Lmxlbmd0aCsnLScrcm93Lmxlbmd0aCsnXCI+PGkgY2xhc3M9XCJmYSBmYS1leWVcIj48L2k+PC9hPicrXG4gICAgICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBuYW1lPVwiRWRpdFwiIGluZGV4PVwiJytjdXJyZW50Lmxlbmd0aCsnLScrcm93Lmxlbmd0aCsnXCI+PGkgY2xhc3M9XCJmYSBmYS1wZW5jaWxcIj48L2k+PC9hPicrXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgc2hvd1Bhc3NcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiIGluZGV4PVwiJytjdXJyZW50Lmxlbmd0aCsnLScrcm93Lmxlbmd0aCsnXCIgLz4nK1xuICAgICAgICAgICc8L3RkPicrXG4gICAgICAgICc8L3RyPic7XG4gICAgICByb3cucHVzaChpdGVtW2tleV0pO1xuICAgIH1cblxuICAgIGN1cnJlbnQucHVzaChyb3cpO1xuICAgIGh0bWwgKz0gJzwvdGFibGU+PC9kaXY+PC9kaXY+PC9kaXY+JztcbiAgfSk7XG5cbiAgdmFyIHJlc3VsdHMgPSAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKGh0bWwrJzwvZGl2PicpO1xuXG4gIHJlc3VsdHMuZmluZCgnYVtuYW1lPVwiQ29weVwiXScpLm9uKCdjbGljaycsIGNvcHkpO1xuICByZXN1bHRzLmZpbmQoJ2FbbmFtZT1cIlNob3dcIl0nKS5vbignY2xpY2snLCBzaG93KTtcbiAgcmVzdWx0cy5maW5kKCdhW25hbWU9XCJFZGl0XCJdJykub24oJ2NsaWNrJywgZWRpdCk7XG59XG5cbmZ1bmN0aW9uIHNob3coZSkge1xuICB2YXIgZWxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICB2YXIgaWQgPSBlbGUuYXR0cignaW5kZXgnKTtcblxuICBpZiggZWxlLmZpbmQoJ2knKS5oYXNDbGFzcygnZmEtZXllJykgKSB7XG4gICAgaWQgPSBpZC5zcGxpdCgnLScpO1xuICAgIHZhciByb3cgPSBwYXJzZUludChpZFswXSksIGNvbCA9IHBhcnNlSW50KGlkWzFdKTtcbiAgICBlbGUucGFyZW50KCkuZmluZCgnLnNob3dQYXNzJykudmFsKGN1cnJlbnRbcm93XVtjb2xdKS5zaG93KCkuc2VsZWN0KCk7XG4gICAgZWxlLmZpbmQoJ2knKS5yZW1vdmVDbGFzcygnZmEtZXllJykuYWRkQ2xhc3MoJ2ZhLWV5ZS1zbGFzaCcpO1xuICB9IGVsc2Uge1xuICAgIGVsZS5wYXJlbnQoKS5maW5kKCcuc2hvd1Bhc3MnKS5odG1sKCcnKS5oaWRlKCk7XG4gICAgZWxlLmZpbmQoJ2knKS5yZW1vdmVDbGFzcygnZmEtZXllLXNsYXNoJykuYWRkQ2xhc3MoJ2ZhLWV5ZScpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvcHkoZSkge1xuICB2YXIgZWxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICB2YXIgaWQgPSBlbGUuYXR0cignaW5kZXgnKTtcbiAgaWQgPSBpZC5zcGxpdCgnLScpO1xuICB2YXIgcm93ID0gcGFyc2VJbnQoaWRbMF0pLCBjb2wgPSBwYXJzZUludChpZFsxXSk7XG5cbiAgY2xpcGJvYXJkLnNldChjdXJyZW50W3Jvd11bY29sXSwgJ3RleHQnKTtcbn1cblxuZnVuY3Rpb24gZWRpdChlKSB7XG5cbn1cbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgZnMgPSBOT0RFLmZzO1xuXG52YXIgRklMRU5BTUUgPSAnLm53UGFzc3dvcmRWYXVsdCc7XG5cbnZhciBwYXRoID0gdXRpbHMuZ2V0VXNlckhvbWUoKSsnLycrRklMRU5BTUU7XG5pZiggIWZzLmV4aXN0c1N5bmMocGF0aCkgKSB7XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgJ3t9Jyk7XG59XG5cbnZhciBzZXR0aW5ncyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGgsICd1dGYtOCcpKTtcblxuZnVuY3Rpb24gZ2V0KCkge1xuICByZXR1cm4gc2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gIHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgZnMud3JpdGVGaWxlU3luYyhwYXRoLCBKU09OLnN0cmluZ2lmeShzZXR0aW5ncykpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IDogZ2V0LFxuICBzZXQgOiBzZXRcbn07XG4iLCJcbm1vZHVsZS5leHBvcnRzLmdldFVzZXJIb21lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB3aW5kb3cucHJvY2Vzcy5lbnZbKHdpbmRvdy5wcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMicpID8gJ1VTRVJQUk9GSUxFJyA6ICdIT01FJ107XG59O1xuIl19
