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

  var gui = window.require('nw.gui');
  win = gui.Window.get();
  var nativeMenuBar = new gui.Menu({ type: "menubar" });
  try {
    nativeMenuBar.createMacBuiltin("NW Password Vault");
    win.menu = nativeMenuBar;
  } catch (ex) {
    console.log(ex.message);
  }

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

  $('#edit-entry-delete-btn').on('click', function(){
    if( !confirm('Are you sure you want to completely remove: '+editName+'?') ) {
      return;
    }
    
    onSave({
      name : editName,
      remove : true
    });
  });
};

module.exports.hide = function() {
  $('#edit-entry-popup').modal('hide');
};

function add() {
  reset();
  $('#edit-entry-delete-btn').hide();

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

  $('#edit-entry-delete-btn').show();
  $('#edit-entry-popup-title').html('Edit Entry');

  $('#edit-entry-password-name').val(entry.name);
  $('#edit-entry-password-description').val(entry.description || '');
  $('#edit-entry-password').val(entry.password);
  $('#edit-entry-password-verify').val(entry.password);

  for( var key in entry ) {
    if( key == 'name' || key == 'password' || key == 'description' ) {
      continue;
    }

    addField(key, entry[key]);
  }

  show();
};

function addField(item, value) {
  var html =
    '<div class="form-group" id="edit-entry-password-'+otherCount+'-outer">'+
      '<label class="col-sm-3 control-label">'+
        '<input type="text" class="form-control" placeholder="Field Name" id="edit-entry-password-'+otherCount+'-name" style="text-align:right"/>'+
      '</label>'+
      '<div class="col-sm-9">'+
        '<input type="password" class="form-control" id="edit-entry-password-'+otherCount+'" placeholder="Password" />'+
        '<input type="password" class="form-control" id="edit-entry-password-'+otherCount+'-verify" placeholder="Verify Password" />'+
        '<span id="edit-entry-password-'+otherCount+'-msg"></span>'+
        '<a class="btn btn-link" index="'+otherCount+'"><i class="fa fa-trash"></i></a>'+
      '</div>'+
    '</div>';

  var ele = $(html);
  ele.find('input').on('blur', verify);
  ele.find('a').on('click',function() {
    if( confirm('Are you sure you want to delete: '+$('$edit-entry-password-'+$(this).attr('index')+'-name').val()) ) {
      $('#edit-entry-password-'+$(this).attr('index')+'-outer').remove();
    }
  });

  if( item !== undefined && value !== undefined ) {
    ele.find('#edit-entry-password-'+otherCount+'-name').val(item);
    ele.find('#edit-entry-password-'+otherCount).val(value);
    ele.find('#edit-entry-password-'+otherCount+'-verify').val(value);
  }

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
    var name = $(root+'-'+i+'-name').val();
    var pass = $(root+'-'+i).val();

    if( name === undefined || pass === undefined ) {
      continue;
    } else if( name == 'name' || name == 'password' || name == 'description' ) {
      continue;
    }
    entry[name] = pass;
  }

  return entry;
}

function verifyItem(index) {
  var isCustom = false;
  var query = root;

  if( index !== undefined ) {
    query += '-'+index;
    isCustom = true;
  }

  var name = $(query+'-name').val();
  var pass = $(query).val();

  if( name === undefined || pass === undefined ) {
    return false; // item has been deleted
  }

  var verifyPass = $(query+'-verify').val();
  var msg = $(query+'-msg');

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
  $('#edit-entry-password-name').val('');
  $('#edit-entry-password-description').val('');
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
    search.go(currentVault.data);
  });

  search.init(edit);
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

},{"../../crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js","./edit":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/edit.js","./search":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js":[function(require,module,exports){
var gui = window.require('nw.gui');
var clipboard = gui.Clipboard.get();

var current = [], currentData;
var editModule;

module.exports.init = function(edit) {
  editModule = edit;
};

module.exports.go = function(data, txt) {
  if( !data.items ) return;
  currentData = data.items;

  var text = txt || $('#find-password-input').val();
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
        '<label class="col-sm-3 control-label"><h5>'+item.name+'</h5></label>'+
        '<div class="col-sm-7">'+
          '<div class="'+(item.description ? 'help-block' : '')+'">'+
            '<i>'+(item.description || '')+'</i>'+
            '<a class="btn btn-link" name="Edit" index="'+current.length+'"><i class="fa fa-pencil"></i></a>'+
          '</div>'+
          '<table class="table">';

    for( var key in item ) {
      if( key == 'name' || key == 'description' ) continue;
      html +=
        '<tr>'+
          '<td style="width:65%">'+(key === 'password' ? 'Password' : key)+'</td>'+
          '<td>'+
            '<a class="btn btn-link" name="Copy" index="'+current.length+'-'+row.length+'"><i class="fa fa-copy"></i></a>'+
            '<a class="btn btn-link" name="Show" index="'+current.length+'-'+row.length+'"><i class="fa fa-eye"></i></a>'+
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

var hideTimer = -1;
function copy(e) {
  var ele = $(e.currentTarget);
  var id = ele.attr('index');
  id = id.split('-');
  var row = parseInt(id[0]), col = parseInt(id[1]);

  clipboard.set(current[row][col], 'text');

  $('#toast').html('<div class="alert alert-success">Copied to clipboard</div>').show();

  if( hideTimer != -1 ) clearTimeout(hideTimer);
  hideTimer = setTimeout(function(){
    clearTimeout(hideTimer);
    $('#toast').hide();
  }, 2000);
}

function edit(e) {
  var ele = $(e.currentTarget);
  var row = parseInt(ele.attr('index'));
  editModule.edit(currentData[row]);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY3J5cHRvL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibGliL2luaXQuanMiLCJsaWIvcGFnZXMvbWFuYWdlL2NyZWF0ZS5qcyIsImxpYi9wYWdlcy9tYW5hZ2UvaW5kZXguanMiLCJsaWIvcGFnZXMvcm91dGVyLmpzIiwibGliL3BhZ2VzL3VzZS9lZGl0LmpzIiwibGliL3BhZ2VzL3VzZS9pbmRleC5qcyIsImxpYi9wYWdlcy91c2Uvc2VhcmNoLmpzIiwibGliL3NldHRpbmdzL2luZGV4LmpzIiwibGliL3V0aWxzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY3J5cHRvID0gTk9ERS5jcnlwdG8sXG4gICAgYWxnb3JpdGhtID0gJ2Flcy0yNTYtY3RyJyxcbiAgICBwYXNzd29yZCA9ICcnO1xuXG5tb2R1bGUuZXhwb3J0cy5lbmNyeXB0ID0gZnVuY3Rpb24odGV4dCl7XG4gIHZhciBjaXBoZXIgPSBjcnlwdG8uY3JlYXRlQ2lwaGVyKGFsZ29yaXRobSwgcGFzc3dvcmQpO1xuICB2YXIgY3J5cHRlZCA9IGNpcGhlci51cGRhdGUodGV4dCwndXRmOCcsJ2hleCcpO1xuICBjcnlwdGVkICs9IGNpcGhlci5maW5hbCgnaGV4Jyk7XG4gIHJldHVybiBjcnlwdGVkO1xufTtcblxubW9kdWxlLmV4cG9ydHMuZGVjcnlwdCA9IGZ1bmN0aW9uKHRleHQpe1xuICB2YXIgZGVjaXBoZXIgPSBjcnlwdG8uY3JlYXRlRGVjaXBoZXIoYWxnb3JpdGhtLHBhc3N3b3JkKTtcbiAgdmFyIGRlYyA9IGRlY2lwaGVyLnVwZGF0ZSh0ZXh0LCdoZXgnLCd1dGY4Jyk7XG4gIGRlYyArPSBkZWNpcGhlci5maW5hbCgndXRmOCcpO1xuICByZXR1cm4gZGVjO1xufTtcblxubW9kdWxlLmV4cG9ydHMuc2V0UGFzc3dvcmQgPSBmdW5jdGlvbihwYXNzKSB7XG4gIHBhc3N3b3JkID0gcGFzcztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cy5jcnlwdG8gPSByZXF1aXJlKCcuL2NyeXB0bycpO1xuXG5yZXF1aXJlKCcuL2luaXQnKSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgJCh3aW5kb3cpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiggZS53aGljaCA9PSA3MyAmJiBlLmN0cmxLZXkgKSB7XG4gICAgICB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJykuV2luZG93LmdldCgpLnNob3dEZXZUb29scygpO1xuICAgIH0gZWxzZSBpZiAoIGUud2hpY2ggPT0gOTEgJiYgZS5jdHJsS2V5ICkge1xuICAgICAgd2luZG93LnJlbG9hZCgpO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIGd1aSA9IHdpbmRvdy5yZXF1aXJlKCdudy5ndWknKTtcbiAgd2luID0gZ3VpLldpbmRvdy5nZXQoKTtcbiAgdmFyIG5hdGl2ZU1lbnVCYXIgPSBuZXcgZ3VpLk1lbnUoeyB0eXBlOiBcIm1lbnViYXJcIiB9KTtcbiAgdHJ5IHtcbiAgICBuYXRpdmVNZW51QmFyLmNyZWF0ZU1hY0J1aWx0aW4oXCJOVyBQYXNzd29yZCBWYXVsdFwiKTtcbiAgICB3aW4ubWVudSA9IG5hdGl2ZU1lbnVCYXI7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5sb2coZXgubWVzc2FnZSk7XG4gIH1cblxuICAkKGRvY3VtZW50KS5vbigncmVhZHknLCBmdW5jdGlvbigpe1xuICAgIHJlcXVpcmUoJy4vcGFnZXMvcm91dGVyJyk7XG4gICAgcmVxdWlyZSgnLi9wYWdlcy9tYW5hZ2UnKS5pbml0KCk7XG4gICAgcmVxdWlyZSgnLi9wYWdlcy91c2UnKS5pbml0KCk7XG4gIH0pO1xuXG59O1xuIiwidmFyIGZzID0gTk9ERS5mcztcbnZhciBjcnlwdG8gPSByZXF1aXJlKCcuLi8uLi9jcnlwdG8nKTtcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uLy4uL3NldHRpbmdzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAkKCcjY3JlYXRlLWJ0bicpLm9uKCdjbGljaycsIGNyZWF0ZSk7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGUoKSB7XG4gIHZhciBpbmZvID0ge1xuICAgIGxvY2F0aW9uIDogJCgnI25ldy1sb2NhdGlvbicpLnZhbCgpLFxuICAgIHBhc3N3b3JkIDogJCgnI25ldy1wYXNzd29yZCcpLnZhbCgpLFxuICAgIHBhc3N3b3JkVmVyaWZ5IDogJCgnI25ldy1wYXNzd29yZC12ZXJpZnknKS52YWwoKVxuICB9O1xuXG4gIGlmKCBpbmZvLmxvY2F0aW9uLmxlbmd0aCA9PT0gMCApIHtcbiAgICByZXR1cm4gZXJyb3IoJ1lvdSBtdXN0IHByb3ZpZGUgYSBsb2NhdGlvbiBmb3IgdGhlIHZhdWx0LicpO1xuICB9XG4gIGlmKCBpbmZvLnBhc3N3b3JkICE9PSBpbmZvLnBhc3N3b3JkVmVyaWZ5ICkge1xuICAgIHJldHVybiBlcnJvcignWW91ciBwYXNzd29yZHMgZG8gbm90IG1hdGNoLicpO1xuICB9XG4gIGlmKCBpbmZvLnBhc3N3b3JkLmxlbmd0aCA8IDggKSB7XG4gICAgcmV0dXJuIGVycm9yKCdZb3VyIHBhc3N3b3JkIGlzIGxlc3MgdGhhbiA4IGNoYXJhY3RlcnMuJyk7XG4gIH1cblxuICBpbmZvLmxvY2F0aW9uID0gaW5mby5sb2NhdGlvbisnL3Bhc3MudmF1bHQnO1xuICBzdWNjZXNzKCk7XG5cbiAgdmFyIGVtcHR5ID0ge1xuICAgIGl0ZW1zIDogW11cbiAgfTtcblxuICBjcnlwdG8uc2V0UGFzc3dvcmQoaW5mby5wYXNzd29yZCk7XG4gIHZhciBkYXRhID0gY3J5cHRvLmVuY3J5cHQoSlNPTi5zdHJpbmdpZnkoZW1wdHkpKTtcbiAgZnMud3JpdGVGaWxlU3luYyhpbmZvLmxvY2F0aW9uLCBkYXRhKTtcblxuICBWYXVsdC5hY3RpdmUgPSB7XG4gICAgbG9jYXRpb24gOiBpbmZvLmxvY2F0aW9uLFxuICAgIHBhc3N3b3JkIDogaW5mby5wYXNzd29yZFxuICB9O1xuXG4gIHZhciBjb25maWcgPSBzZXR0aW5ncy5nZXQoKTtcbiAgaWYoICFjb25maWcudmF1bHRzICkgY29uZmlnLnZhdWx0cyA9IFtdO1xuICBjb25maWcudmF1bHRzLnB1c2goaW5mby5sb2NhdGlvbik7XG5cbiAgc2V0dGluZ3Muc2V0KCd2YXVsdHMnLCBjb25maWcudmF1bHRzKTtcblxuICAkKCcjbmV3LWxvY2F0aW9uJykudmFsKCcnKTtcbiAgJCgnI25ldy1wYXNzd29yZCcpLnZhbCgnJyk7XG4gICQoJyNuZXctcGFzc3dvcmQtdmVyaWZ5JykudmFsKCcnKTtcblxuICB3aW5kb3cubG9jYXRpb24gPSAnI3VzZSc7XG59XG5cbmZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gIGVycm9yKCcnKTtcbn1cblxuZnVuY3Rpb24gZXJyb3IobXNnKSB7XG4gIGlmKCAhbXNnICkgJCgnI25ldy1tZXNzYWdlJykuaHRtbCgnJyk7XG4gIGVsc2UgJCgnI25ldy1tZXNzYWdlJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiPicrbXNnKyc8L2Rpdj4nKTtcbn1cbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzJyk7XG52YXIgY3JlYXRlID0gcmVxdWlyZSgnLi9jcmVhdGUnKTtcblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gIGNyZWF0ZS5pbml0KCk7XG59O1xuIiwidmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vc2V0dGluZ3MnKTtcblxuJCh3aW5kb3cpLm9uKCdoYXNoY2hhbmdlJywgdXBkYXRlUGFnZSk7XG51cGRhdGVQYWdlKCk7XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2UoKSB7XG4gIHZhciBwYXJ0cyA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnJlcGxhY2UoLyMvLCcnKS5zcGxpdCgnLycpO1xuXG4gIHZhciBjb25maWcgPSBzZXR0aW5ncy5nZXQoKTtcbiAgdmFyIHBhZ2UgPSBwYXJ0c1swXTtcblxuICBpZiggcGFnZSA9PT0gJycgKSB7XG4gICAgaWYoIGNvbmZpZy5kZWZhdWx0ICkge1xuICAgICAgcGFnZSA9ICd1c2UnO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYWdlID0gJ21hbmFnZSc7XG4gICAgfVxuICB9XG5cbiAgJCgnLnBhZ2UnKS5oaWRlKCk7XG4gIHZhciBlbGUgPSAkKCcjJytwYWdlKS5zaG93KCk7XG5cbiAgaWYoIGVsZVswXS5vblNob3cgKSBlbGVbMF0ub25TaG93KCk7XG59XG4iLCJ2YXIgZW50cnkgPSBudWxsO1xudmFyIGlzTmV3ID0gZmFsc2U7XG52YXIgZWRpdE5hbWUgPSAnJztcbnZhciBvdGhlckNvdW50ID0gMDtcbnZhciByb290ID0gJyNlZGl0LWVudHJ5LXBhc3N3b3JkJztcblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKG9uU2F2ZSkge1xuICAkKCcjZWRpdC1lbnRyeS1wb3B1cCcpLm1vZGFsKHtcbiAgICBzaG93OiBmYWxzZSxcbiAgICBiYWNrZHJvcDogJ3N0YXRpYydcbiAgfSk7XG4gICQoJyNhZGQtZW50cnktYnRuJykub24oJ2NsaWNrJywgYWRkKTtcbiAgJCgnI2VkaXQtZW50cnktYWRkLWZpZWxkLWJ0bicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgYWRkRmllbGQoKTtcbiAgfSk7XG5cbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQnKS5vbignYmx1cicsIHZlcmlmeSk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLXZlcmlmeScpLm9uKCdibHVyJywgdmVyaWZ5KTtcblxuICAkKCcjZWRpdC1lbnRyeS1zYXZlLWJ0bicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGhhc0Vycm9yID0gdmVyaWZ5KCk7XG4gICAgaWYoIGhhc0Vycm9yICkgcmV0dXJuO1xuXG4gICAgdmFyIGVudHJ5ID0gZ2V0RW50cnkoKTtcbiAgICBvblNhdmUoe1xuICAgICAgZW50cnk6IGVudHJ5LFxuICAgICAgb3JpZ2luYWxOYW1lIDogZWRpdE5hbWUsXG4gICAgICBpc05ldyA6IGlzTmV3XG4gICAgfSk7XG4gIH0pO1xuXG4gICQoJyNlZGl0LWVudHJ5LWRlbGV0ZS1idG4nKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIGlmKCAhY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGNvbXBsZXRlbHkgcmVtb3ZlOiAnK2VkaXROYW1lKyc/JykgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIG9uU2F2ZSh7XG4gICAgICBuYW1lIDogZWRpdE5hbWUsXG4gICAgICByZW1vdmUgOiB0cnVlXG4gICAgfSk7XG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICAkKCcjZWRpdC1lbnRyeS1wb3B1cCcpLm1vZGFsKCdoaWRlJyk7XG59O1xuXG5mdW5jdGlvbiBhZGQoKSB7XG4gIHJlc2V0KCk7XG4gICQoJyNlZGl0LWVudHJ5LWRlbGV0ZS1idG4nKS5oaWRlKCk7XG5cbiAgb3RoZXJDb3VudCA9IDA7XG4gIGlzTmV3ID0gdHJ1ZTtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAtdGl0bGUnKS5odG1sKCdBZGQgRW50cnknKTtcbiAgc2hvdygpO1xufVxuXG5tb2R1bGUuZXhwb3J0cy5lZGl0ID0gZnVuY3Rpb24oZW50cnkpIHtcbiAgcmVzZXQoKTtcblxuICBlZGl0TmFtZSA9IGVudHJ5Lm5hbWU7XG4gIG90aGVyQ291bnQgPSAwO1xuICBpc05ldyA9IGZhbHNlO1xuXG4gICQoJyNlZGl0LWVudHJ5LWRlbGV0ZS1idG4nKS5zaG93KCk7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwLXRpdGxlJykuaHRtbCgnRWRpdCBFbnRyeScpO1xuXG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLW5hbWUnKS52YWwoZW50cnkubmFtZSk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLWRlc2NyaXB0aW9uJykudmFsKGVudHJ5LmRlc2NyaXB0aW9uIHx8ICcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQnKS52YWwoZW50cnkucGFzc3dvcmQpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC12ZXJpZnknKS52YWwoZW50cnkucGFzc3dvcmQpO1xuXG4gIGZvciggdmFyIGtleSBpbiBlbnRyeSApIHtcbiAgICBpZigga2V5ID09ICduYW1lJyB8fCBrZXkgPT0gJ3Bhc3N3b3JkJyB8fCBrZXkgPT0gJ2Rlc2NyaXB0aW9uJyApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGFkZEZpZWxkKGtleSwgZW50cnlba2V5XSk7XG4gIH1cblxuICBzaG93KCk7XG59O1xuXG5mdW5jdGlvbiBhZGRGaWVsZChpdGVtLCB2YWx1ZSkge1xuICB2YXIgaHRtbCA9XG4gICAgJzxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCIgaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW91dGVyXCI+JytcbiAgICAgICc8bGFiZWwgY2xhc3M9XCJjb2wtc20tMyBjb250cm9sLWxhYmVsXCI+JytcbiAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgcGxhY2Vob2xkZXI9XCJGaWVsZCBOYW1lXCIgaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW5hbWVcIiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIi8+JytcbiAgICAgICc8L2xhYmVsPicrXG4gICAgICAnPGRpdiBjbGFzcz1cImNvbC1zbS05XCI+JytcbiAgICAgICAgJzxpbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJ1wiIHBsYWNlaG9sZGVyPVwiUGFzc3dvcmRcIiAvPicrXG4gICAgICAgICc8aW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctdmVyaWZ5XCIgcGxhY2Vob2xkZXI9XCJWZXJpZnkgUGFzc3dvcmRcIiAvPicrXG4gICAgICAgICc8c3BhbiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctbXNnXCI+PC9zcGFuPicrXG4gICAgICAgICc8YSBjbGFzcz1cImJ0biBidG4tbGlua1wiIGluZGV4PVwiJytvdGhlckNvdW50KydcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoXCI+PC9pPjwvYT4nK1xuICAgICAgJzwvZGl2PicrXG4gICAgJzwvZGl2Pic7XG5cbiAgdmFyIGVsZSA9ICQoaHRtbCk7XG4gIGVsZS5maW5kKCdpbnB1dCcpLm9uKCdibHVyJywgdmVyaWZ5KTtcbiAgZWxlLmZpbmQoJ2EnKS5vbignY2xpY2snLGZ1bmN0aW9uKCkge1xuICAgIGlmKCBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlOiAnKyQoJyRlZGl0LWVudHJ5LXBhc3N3b3JkLScrJCh0aGlzKS5hdHRyKCdpbmRleCcpKyctbmFtZScpLnZhbCgpKSApIHtcbiAgICAgICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLScrJCh0aGlzKS5hdHRyKCdpbmRleCcpKyctb3V0ZXInKS5yZW1vdmUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmKCBpdGVtICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCApIHtcbiAgICBlbGUuZmluZCgnI2VkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctbmFtZScpLnZhbChpdGVtKTtcbiAgICBlbGUuZmluZCgnI2VkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KS52YWwodmFsdWUpO1xuICAgIGVsZS5maW5kKCcjZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy12ZXJpZnknKS52YWwodmFsdWUpO1xuICB9XG5cbiAgJCgnI2VkaXQtZW50cnktb3RoZXItZmllbGRzJykuYXBwZW5kKGVsZSk7XG4gIG90aGVyQ291bnQrKztcbn1cblxuZnVuY3Rpb24gdmVyaWZ5KCkge1xuICB2YXIgZXJyb3JzID0gW10sIGk7XG4gIGVycm9ycy5wdXNoKHZlcmlmeUl0ZW0oKSk7XG4gIGZvciggaSA9IDA7IGkgPCBvdGhlckNvdW50OyBpKysgKSB7XG4gICAgZXJyb3JzLnB1c2godmVyaWZ5SXRlbShpKSk7XG4gIH1cblxuICBmb3IoIGkgPSAwOyBpIDwgZXJyb3JzLmxlbmd0aDsgaSsrICkge1xuICAgIGlmKCBlcnJvcnNbaV0gKSByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0RW50cnkoKSB7XG4gIHZhciBlbnRyeSA9IHtcbiAgICBuYW1lIDogJChyb290KyctbmFtZScpLnZhbCgpLFxuICAgIGRlc2NyaXB0aW9uIDogJChyb290KyctZGVzY3JpcHRpb24nKS52YWwoKSxcbiAgICBwYXNzd29yZCA6ICQocm9vdCkudmFsKClcbiAgfTtcblxuICBmb3IoIGkgPSAwOyBpIDwgb3RoZXJDb3VudDsgaSsrICkge1xuICAgIHZhciBuYW1lID0gJChyb290KyctJytpKyctbmFtZScpLnZhbCgpO1xuICAgIHZhciBwYXNzID0gJChyb290KyctJytpKS52YWwoKTtcblxuICAgIGlmKCBuYW1lID09PSB1bmRlZmluZWQgfHwgcGFzcyA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmKCBuYW1lID09ICduYW1lJyB8fCBuYW1lID09ICdwYXNzd29yZCcgfHwgbmFtZSA9PSAnZGVzY3JpcHRpb24nICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGVudHJ5W25hbWVdID0gcGFzcztcbiAgfVxuXG4gIHJldHVybiBlbnRyeTtcbn1cblxuZnVuY3Rpb24gdmVyaWZ5SXRlbShpbmRleCkge1xuICB2YXIgaXNDdXN0b20gPSBmYWxzZTtcbiAgdmFyIHF1ZXJ5ID0gcm9vdDtcblxuICBpZiggaW5kZXggIT09IHVuZGVmaW5lZCApIHtcbiAgICBxdWVyeSArPSAnLScraW5kZXg7XG4gICAgaXNDdXN0b20gPSB0cnVlO1xuICB9XG5cbiAgdmFyIG5hbWUgPSAkKHF1ZXJ5KyctbmFtZScpLnZhbCgpO1xuICB2YXIgcGFzcyA9ICQocXVlcnkpLnZhbCgpO1xuXG4gIGlmKCBuYW1lID09PSB1bmRlZmluZWQgfHwgcGFzcyA9PT0gdW5kZWZpbmVkICkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gaXRlbSBoYXMgYmVlbiBkZWxldGVkXG4gIH1cblxuICB2YXIgdmVyaWZ5UGFzcyA9ICQocXVlcnkrJy12ZXJpZnknKS52YWwoKTtcbiAgdmFyIG1zZyA9ICQocXVlcnkrJy1tc2cnKTtcblxuICBpZiggcGFzcy5sZW5ndGggPT09IDAgKSB7XG4gICAgZXJyb3IobXNnLCAnWW91IGRpZCBub3QgcHJvdmlkZSBhIHBhc3N3b3JkJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggdmVyaWZ5UGFzcyAhPSBwYXNzICkge1xuICAgIGVycm9yKG1zZywgJ1lvdXIgaXRlbXMgZG8gbm90IG1hdGNoJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggbmFtZS5sZW5ndGggPT09IDAgKSB7XG4gICAgZXJyb3IobXNnLCAnWW91IG11c3QgcHJvdmlkZSBhIG5hbWUnKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmKCAobmFtZSA9PSAnbmFtZScgfHwgbmFtZSA9PSAncGFzc3dvcmQnIHx8IG5hbWUgPT0gJ2Rlc2NyaXB0aW9uJykgJiYgaXNDdXN0b20gKSB7XG4gICAgZXJyb3IobXNnLCAnSW52YWxpZCBuYW1lJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBtc2cuaHRtbCgnPHNwYW4gY2xhc3M9XCJ0ZXh0IHRleHQtc3VjY2Vzc1wiPjxpIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj48L2k+PC9zcGFuPicpO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZXJyb3IoZWxlLCBtc2cpIHtcbiAgZWxlLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIj4nK21zZysnPC9kaXY+Jyk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0KCkge1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC1uYW1lJykudmFsKCcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtZGVzY3JpcHRpb24nKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZCcpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLXZlcmlmeScpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LW90aGVyLWZpZWxkcycpLmh0bWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC1tc2cnKS5odG1sKCcnKTtcbn1cblxuZnVuY3Rpb24gc2hvdygpIHtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAnKS5tb2RhbCgnc2hvdycpO1xufVxuIiwidmFyIGZzID0gTk9ERS5mcztcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uLy4uL3NldHRpbmdzJyk7XG52YXIgY3J5cHRvID0gcmVxdWlyZSgnLi4vLi4vY3J5cHRvJyk7XG52YXIgc2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2gnKTtcbnZhciBlZGl0ID0gcmVxdWlyZSgnLi9lZGl0Jyk7XG52YXIgY29uZmlnO1xuXG52YXIgY3VycmVudFZhdWx0ID0ge1xuICBmaWxlIDogJycsXG4gIGRhdGEgOiBudWxsXG59O1xuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICQoJyN1c2UnKVswXS5vblNob3cgPSBvblNob3c7XG5cbiAgJCgnI3VubG9jay1wb3B1cCcpLm1vZGFsKHtzaG93OiBmYWxzZX0pO1xuICAkKCcjdW5sb2NrLXNob3ctYnRuJykub24oJ2NsaWNrJyxmdW5jdGlvbigpe1xuICAgICQoJyN1bmxvY2stcG9wdXAtZmlsZW5hbWUnKS5odG1sKFZhdWx0LmFjdGl2ZSk7XG4gICAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCcnKTtcbiAgICAkKCcjdW5sb2NrLXBvcHVwJykubW9kYWwoJ3Nob3cnKTtcbiAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykudmFsKCcnKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykuZm9jdXMoKTtcbiAgICB9LCAyNTApO1xuICB9KTtcblxuICAkKCcjdW5sb2NrLWJ0bicpLm9uKCdjbGljaycsZnVuY3Rpb24oKXtcbiAgICBhdHRlbXB0VW5sb2NrKCk7XG4gIH0pO1xuICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykub24oJ2tleXVwJywgZnVuY3Rpb24oZSl7XG4gICAgaWYoIGUud2hpY2ggPT0gMTMgKSBhdHRlbXB0VW5sb2NrKCk7XG4gIH0pO1xuICAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpe1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gIH0pO1xuXG4gIHNlYXJjaC5pbml0KGVkaXQpO1xuICBlZGl0LmluaXQob25TYXZlKTtcblxuICBvblNob3coKTtcbn07XG5cbmZ1bmN0aW9uIHJlc2V0VWkoKSB7XG4gICQoJyN1c2UtbWVzc2FnZScpLmh0bWwoJycpO1xuICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCcnKTtcbiAgJCgnI2ZpbmQtcGFzc3dvcmQnKS5oaWRlKCk7XG4gICQoJyN1bmxvY2stc2hvdy1idG4nKS5oaWRlKCk7XG59XG5cbmZ1bmN0aW9uIG9uU2F2ZShpbmZvKSB7XG4gIHZhciBpLCBpdGVtO1xuXG4gIC8vIHNpbXBsZSBkZWxldGVcbiAgaWYoIGluZm8ucmVtb3ZlICkge1xuICAgIGZvciggaSA9IDA7IGkgPCBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgIGlmKCBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXS5uYW1lID09IGluZm8ubmFtZSApIHtcbiAgICAgICAgY3VycmVudFZhdWx0LmRhdGEuaXRlbXMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNhdmUoKTtcbiAgICBzZWFyY2guZ28oY3VycmVudFZhdWx0LmRhdGEpO1xuICAgIGVkaXQuaGlkZSgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGp1c3QgYSBzaW1wbGUgZWRpdFxuICBpZiggaW5mby5vcmlnaW5hbE5hbWUgPT0gaW5mby5lbnRyeS5uYW1lICkge1xuICAgIHVwZGF0ZUVudHJ5KGluZm8uZW50cnkpO1xuICAgIHNhdmUoKTtcbiAgICBzZWFyY2guZ28oY3VycmVudFZhdWx0LmRhdGEpO1xuICAgIGVkaXQuaGlkZSgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpc092ZXJ3cml0ZSA9IGZhbHNlO1xuICBmb3IoIGkgPSAwOyBpIDwgY3VycmVudFZhdWx0LmRhdGEuaXRlbXMubGVuZ3RoOyBpKysgKSB7XG4gICAgaXRlbSA9IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zW2ldO1xuICAgIGlmKCBpdGVtLm5hbWUgPT0gaW5mby5lbnRyeS5uYW1lICkge1xuICAgICAgaXNPdmVyd3JpdGUgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYoIGlzT3ZlcndyaXRlICYmICFjb25maXJtKCdcIicrZW50cnkrJ1wiIGFscmVhZHkgZXhpc3RzLCBhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gb3ZlcndyaXRlPyEnKSApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiggaW5mby5pc05ldyApIHtcbiAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5wdXNoKGluZm8uZW50cnkpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZUVudHJ5KGluZm8uZW50cnkpO1xuICB9XG5cbiAgc2F2ZSgpO1xuICBzZWFyY2guZ28oY3VycmVudFZhdWx0LmRhdGEpO1xuICBlZGl0LmhpZGUoKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW50cnkoZW50cnkpIHtcbiAgZm9yKCBpID0gMDsgaSA8IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLmxlbmd0aDsgaSsrICkge1xuICAgIGl0ZW0gPSBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXTtcbiAgICBpZiggaXRlbS5uYW1lID09IGVudHJ5Lm5hbWUgKSB7XG4gICAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXSA9IGVudHJ5O1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzYXZlKCkge1xuICB2YXIgZGF0YSA9IGNyeXB0by5lbmNyeXB0KEpTT04uc3RyaW5naWZ5KGN1cnJlbnRWYXVsdC5kYXRhKSk7XG4gIGZzLndyaXRlRmlsZVN5bmMoY3VycmVudFZhdWx0LmZpbGUsIGRhdGEpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZWxlY3RvcigpIHtcbiAgaWYoICFjb25maWcudmF1bHRzICkgcmV0dXJuO1xuXG4gIHZhciBodG1sID0gJyc7XG4gIGZvciggdmFyIGkgPSAwOyBpIDwgY29uZmlnLnZhdWx0cy5sZW5ndGg7IGkrKyApIHtcbiAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVlPVwiJytjb25maWcudmF1bHRzW2ldKydcIiAnKyhjb25maWcudmF1bHRzW2ldID09IFZhdWx0LmFjdGl2ZSA/ICdzZWxlY3RlZCcgOiAnJykrJz4nK2NvbmZpZy52YXVsdHNbaV0rJzwvb3B0aW9uPic7XG4gIH1cbiAgJCgnI3ZhdWx0LXNlbGVjdCcpLmh0bWwoaHRtbCk7XG59XG5cbmZ1bmN0aW9uIG9uU2hvdygpIHtcbiAgY29uZmlnID0gc2V0dGluZ3MuZ2V0KCk7XG4gIHJlc2V0VWkoKTtcblxuICBpZiggVmF1bHQuYWN0aXZlICkge1xuICAgIG9uVmF1bHRTZXQoKTtcbiAgfSBlbHNlIGlmICggY29uZmlnLnZhdWx0cyAmJiBjb25maWcudmF1bHRzLmxlbmd0aCA+IDAgKSB7XG4gICAgVmF1bHQuYWN0aXZlID0gY29uZmlnLnZhdWx0c1swXTtcbiAgICBvblZhdWx0U2V0KCk7XG4gIH0gZWxzZSB7XG4gICAgd2FybignWW91IGhhdmUgbm8gdmF1bHRzLiAgWW91IG11c3QgZmlyc3QgY3JlYXRlIG9uZScpO1xuICB9XG5cbiAgY3JlYXRlU2VsZWN0b3IoKTtcbn1cblxuZnVuY3Rpb24gb25WYXVsdFNldCgpIHtcbiAgaWYoIFZhdWx0LmFjdGl2ZSA9PT0gY3VycmVudFZhdWx0LmZpbGUgJiYgY3VycmVudFZhdWx0LmRhdGEgIT09IG51bGwgKSB7XG4gICAgJCgnI3VubG9jay1zaG93LWJ0bicpLmhpZGUoKTtcbiAgICAkKCcjZmluZC1wYXNzd29yZCcpLnNob3coKTtcbiAgICAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLmZvY3VzKCk7XG4gICAgc2VhcmNoLmdvKGN1cnJlbnRWYXVsdC5kYXRhLCAnJyk7XG4gIH0gZWxzZSB7XG4gICAgJCgnI3VubG9jay1zaG93LWJ0bicpLnNob3coKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRlbXB0VW5sb2NrKCkge1xuICBjdXJyZW50VmF1bHQuZGF0YSA9IG51bGw7XG4gIGNyeXB0by5zZXRQYXNzd29yZCgkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykudmFsKCkpO1xuICB2YXIgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhWYXVsdC5hY3RpdmUsICd1dGY4Jyk7XG5cbiAgdHJ5IHtcbiAgICBkYXRhID0gSlNPTi5wYXJzZShjcnlwdG8uZGVjcnlwdChkYXRhKSk7XG4gIH0gY2F0Y2goZSkge1xuICAgICQoJyN2YXVsdC1wb3B1cC1tZXNzYWdlJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiPkludmFsaWQgUGFzc3dvcmQ8L2Rpdj4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAkKCcjdmF1bHQtcG9wdXAtbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1zdWNjZXNzXCI+U3VjY2VzcyE8L2Rpdj4nKTtcblxuXG4gIGN1cnJlbnRWYXVsdC5kYXRhID0gZGF0YTtcbiAgY3VycmVudFZhdWx0LmZpbGUgPSBWYXVsdC5hY3RpdmU7XG4gIG9uVmF1bHRTZXQoKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICQoJyN1bmxvY2stcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xuICB9LCA1MDApO1xufVxuXG5mdW5jdGlvbiB3YXJuKG1zZykge1xuICBpZiggIW1zZyApICQoJ3VzZS1tZXNzYWdlJykuaHRtbCgnJyk7XG4gIGVsc2UgJCgndXNlLW1lc3NhZ2UnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FyblwiPicrbXNnKyc8L2Rpdj4nKTtcbn1cbiIsInZhciBndWkgPSB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJyk7XG52YXIgY2xpcGJvYXJkID0gZ3VpLkNsaXBib2FyZC5nZXQoKTtcblxudmFyIGN1cnJlbnQgPSBbXSwgY3VycmVudERhdGE7XG52YXIgZWRpdE1vZHVsZTtcblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKGVkaXQpIHtcbiAgZWRpdE1vZHVsZSA9IGVkaXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5nbyA9IGZ1bmN0aW9uKGRhdGEsIHR4dCkge1xuICBpZiggIWRhdGEuaXRlbXMgKSByZXR1cm47XG4gIGN1cnJlbnREYXRhID0gZGF0YS5pdGVtcztcblxuICB2YXIgdGV4dCA9IHR4dCB8fCAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLnZhbCgpO1xuICB2YXIgcmUgPSBuZXcgUmVnRXhwKCcuKicrdGV4dCsnLionLCAnaScpO1xuXG4gIHZhciByZXN1bHRzID0gW107XG4gIGRhdGEuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICB2YXIgbmFtZSA9IGl0ZW0ubmFtZSB8fCAnJztcbiAgICB2YXIgZGVzY3JpcHRpb24gPSBpdGVtLmRlc2NyaXB0aW9uIHx8ICcnO1xuICAgIGlmKCBuYW1lLm1hdGNoKHJlKSB8fCBkZXNjcmlwdGlvbi5tYXRjaChyZSkgKSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlbSk7XG4gICAgfVxuICB9KTtcblxuICByZW5kZXJSZXN1bHRzKHJlc3VsdHMpO1xufTtcblxuXG5cbmZ1bmN0aW9uIHJlbmRlclJlc3VsdHMoaXRlbXMpIHtcbiAgaWYoIGl0ZW1zLmxlbmd0aCA9PT0gMCApIHtcbiAgICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FybmluZ1wiPk5vIG1hdGNoZXMgZm91bmQ8L2Rpdj4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaHRtbCA9ICc8ZGl2IGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCI+JztcbiAgY3VycmVudCA9IFtdO1xuICB2YXIgcm93ID0gW107XG5cbiAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICByb3cgPSBbXTtcblxuICAgIGh0bWwgKz1cbiAgICAgICc8ZGl2IGNsYXNzPVwid2VsbFwiPjxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCI+JytcbiAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbC1zbS0zIGNvbnRyb2wtbGFiZWxcIj48aDU+JytpdGVtLm5hbWUrJzwvaDU+PC9sYWJlbD4nK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbC1zbS03XCI+JytcbiAgICAgICAgICAnPGRpdiBjbGFzcz1cIicrKGl0ZW0uZGVzY3JpcHRpb24gPyAnaGVscC1ibG9jaycgOiAnJykrJ1wiPicrXG4gICAgICAgICAgICAnPGk+JysoaXRlbS5kZXNjcmlwdGlvbiB8fCAnJykrJzwvaT4nK1xuICAgICAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCIgbmFtZT1cIkVkaXRcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJ1wiPjxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPjwvYT4nK1xuICAgICAgICAgICc8L2Rpdj4nK1xuICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZVwiPic7XG5cbiAgICBmb3IoIHZhciBrZXkgaW4gaXRlbSApIHtcbiAgICAgIGlmKCBrZXkgPT0gJ25hbWUnIHx8IGtleSA9PSAnZGVzY3JpcHRpb24nICkgY29udGludWU7XG4gICAgICBodG1sICs9XG4gICAgICAgICc8dHI+JytcbiAgICAgICAgICAnPHRkIHN0eWxlPVwid2lkdGg6NjUlXCI+Jysoa2V5ID09PSAncGFzc3dvcmQnID8gJ1Bhc3N3b3JkJyA6IGtleSkrJzwvdGQ+JytcbiAgICAgICAgICAnPHRkPicrXG4gICAgICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBuYW1lPVwiQ29weVwiIGluZGV4PVwiJytjdXJyZW50Lmxlbmd0aCsnLScrcm93Lmxlbmd0aCsnXCI+PGkgY2xhc3M9XCJmYSBmYS1jb3B5XCI+PC9pPjwvYT4nK1xuICAgICAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCIgbmFtZT1cIlNob3dcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJy0nK3Jvdy5sZW5ndGgrJ1wiPjxpIGNsYXNzPVwiZmEgZmEtZXllXCI+PC9pPjwvYT4nK1xuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIHNob3dQYXNzXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJy0nK3Jvdy5sZW5ndGgrJ1wiIC8+JytcbiAgICAgICAgICAnPC90ZD4nK1xuICAgICAgICAnPC90cj4nO1xuICAgICAgcm93LnB1c2goaXRlbVtrZXldKTtcbiAgICB9XG5cbiAgICBjdXJyZW50LnB1c2gocm93KTtcbiAgICBodG1sICs9ICc8L3RhYmxlPjwvZGl2PjwvZGl2PjwvZGl2Pic7XG4gIH0pO1xuXG4gIHZhciByZXN1bHRzID0gJCgnI3VzZS1yZXN1bHRzJykuaHRtbChodG1sKyc8L2Rpdj4nKTtcblxuICByZXN1bHRzLmZpbmQoJ2FbbmFtZT1cIkNvcHlcIl0nKS5vbignY2xpY2snLCBjb3B5KTtcbiAgcmVzdWx0cy5maW5kKCdhW25hbWU9XCJTaG93XCJdJykub24oJ2NsaWNrJywgc2hvdyk7XG4gIHJlc3VsdHMuZmluZCgnYVtuYW1lPVwiRWRpdFwiXScpLm9uKCdjbGljaycsIGVkaXQpO1xufVxuXG5mdW5jdGlvbiBzaG93KGUpIHtcbiAgdmFyIGVsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgdmFyIGlkID0gZWxlLmF0dHIoJ2luZGV4Jyk7XG5cbiAgaWYoIGVsZS5maW5kKCdpJykuaGFzQ2xhc3MoJ2ZhLWV5ZScpICkge1xuICAgIGlkID0gaWQuc3BsaXQoJy0nKTtcbiAgICB2YXIgcm93ID0gcGFyc2VJbnQoaWRbMF0pLCBjb2wgPSBwYXJzZUludChpZFsxXSk7XG4gICAgZWxlLnBhcmVudCgpLmZpbmQoJy5zaG93UGFzcycpLnZhbChjdXJyZW50W3Jvd11bY29sXSkuc2hvdygpLnNlbGVjdCgpO1xuICAgIGVsZS5maW5kKCdpJykucmVtb3ZlQ2xhc3MoJ2ZhLWV5ZScpLmFkZENsYXNzKCdmYS1leWUtc2xhc2gnKTtcbiAgfSBlbHNlIHtcbiAgICBlbGUucGFyZW50KCkuZmluZCgnLnNob3dQYXNzJykuaHRtbCgnJykuaGlkZSgpO1xuICAgIGVsZS5maW5kKCdpJykucmVtb3ZlQ2xhc3MoJ2ZhLWV5ZS1zbGFzaCcpLmFkZENsYXNzKCdmYS1leWUnKTtcbiAgfVxufVxuXG52YXIgaGlkZVRpbWVyID0gLTE7XG5mdW5jdGlvbiBjb3B5KGUpIHtcbiAgdmFyIGVsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgdmFyIGlkID0gZWxlLmF0dHIoJ2luZGV4Jyk7XG4gIGlkID0gaWQuc3BsaXQoJy0nKTtcbiAgdmFyIHJvdyA9IHBhcnNlSW50KGlkWzBdKSwgY29sID0gcGFyc2VJbnQoaWRbMV0pO1xuXG4gIGNsaXBib2FyZC5zZXQoY3VycmVudFtyb3ddW2NvbF0sICd0ZXh0Jyk7XG5cbiAgJCgnI3RvYXN0JykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIj5Db3BpZWQgdG8gY2xpcGJvYXJkPC9kaXY+Jykuc2hvdygpO1xuXG4gIGlmKCBoaWRlVGltZXIgIT0gLTEgKSBjbGVhclRpbWVvdXQoaGlkZVRpbWVyKTtcbiAgaGlkZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgIGNsZWFyVGltZW91dChoaWRlVGltZXIpO1xuICAgICQoJyN0b2FzdCcpLmhpZGUoKTtcbiAgfSwgMjAwMCk7XG59XG5cbmZ1bmN0aW9uIGVkaXQoZSkge1xuICB2YXIgZWxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICB2YXIgcm93ID0gcGFyc2VJbnQoZWxlLmF0dHIoJ2luZGV4JykpO1xuICBlZGl0TW9kdWxlLmVkaXQoY3VycmVudERhdGFbcm93XSk7XG59XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xudmFyIGZzID0gTk9ERS5mcztcblxudmFyIEZJTEVOQU1FID0gJy5ud1Bhc3N3b3JkVmF1bHQnO1xuXG52YXIgcGF0aCA9IHV0aWxzLmdldFVzZXJIb21lKCkrJy8nK0ZJTEVOQU1FO1xuaWYoICFmcy5leGlzdHNTeW5jKHBhdGgpICkge1xuICBmcy53cml0ZUZpbGVTeW5jKHBhdGgsICd7fScpO1xufVxuXG52YXIgc2V0dGluZ3MgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLCAndXRmLTgnKSk7XG5cbmZ1bmN0aW9uIGdldCgpIHtcbiAgcmV0dXJuIHNldHRpbmdzO1xufVxuXG5mdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICBzZXR0aW5nc1trZXldID0gdmFsdWU7XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldCA6IGdldCxcbiAgc2V0IDogc2V0XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cy5nZXRVc2VySG9tZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gd2luZG93LnByb2Nlc3MuZW52Wyh3aW5kb3cucHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInKSA/ICdVU0VSUFJPRklMRScgOiAnSE9NRSddO1xufTtcbiJdfQ==
