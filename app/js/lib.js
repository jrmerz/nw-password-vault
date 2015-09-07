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
module.exports = {
  crypto : require('./crypto'),
  behaviors : {
    ImportVault : require('./pages/manage/import')
  }
};


require('./init')();

},{"./crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","./init":"/Users/jrmerz/dev/personal/nw-password-vault/lib/init.js","./pages/manage/import":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/import.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/init.js":[function(require,module,exports){
module.exports = function() {
  $(window).on('keyup', function(e) {
    if( e.which == 73 && e.ctrlKey ) {
      window.require('nw.gui').Window.get().showDevTools();
    } else if ( e.which == 82 && e.ctrlKey ) {
      location.reload();
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

},{"../../crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/import.js":[function(require,module,exports){
var settings = require('../../settings');

function importFile(file) {
  settings.addVault(file);
}

module.exports = {
  import : importFile
}

},{"../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/index.js":[function(require,module,exports){
var utils = require('../../utils');
var create = require('./create');

module.exports.init = function(){
  create.init();
};

},{"../../utils":"/Users/jrmerz/dev/personal/nw-password-vault/lib/utils/index.js","./create":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/create.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/router.js":[function(require,module,exports){
var settings = require('../settings');

$(window).on('hashchange', updatePage);

function updatePage() {
  var parts = window.location.hash.replace(/#/,'').split('/');

  var config = settings.get();
  var page = parts[0];

  if( page === '' ) {
    //if( config.default ) {
      page = 'use';
    //} else {
    //  page = 'manage';
    //}
  }



  $('.page').hide();
  var ele = $('#'+page).show();

  $('li[role="presentation"]').removeClass('active');
  $('a[role="tab"][href="#'+page+'"]').parent().addClass('active');

  if( ele[0].onShow ) ele[0].onShow();
}

updatePage();

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
  $('#edit-entry-password-username').val(entry.username || '');
  $('#edit-entry-password').val(entry.password);
  $('#edit-entry-password-verify').val(entry.password);

  for( var key in entry ) {
    if( key == 'name' || key == 'password' || key == 'description' || key == 'username' ) {
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
    username : $(root+'-username').val(),
    password : $(root).val()
  };

  for( i = 0; i < otherCount; i++ ) {
    var name = $(root+'-'+i+'-name').val();
    var pass = $(root+'-'+i).val();

    if( name === undefined || pass === undefined ) {
      continue;
    } else if( name == 'name' || name == 'password' || name == 'description' || name == 'username' ) {
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
  } else if( (name == 'name' || name == 'password' || name == 'description' || name == 'username') && isCustom ) {
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
  $('#edit-entry-password-username').val('');
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

},{"../../crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js","./edit":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/edit.js","./search":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js":[function(require,module,exports){
var gui = window.require('nw.gui');
var clipboard = gui.Clipboard.get();

var current = [], currentData, currentItems;
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
  currentItems = items;

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

    if( item.username ) {
      html += '<tr>'+
        '<td style="width:65%">Username</td>'+
        '<td>'+
          item.username +
        '</td>'+
      '</tr>';
    }

    for( var key in item ) {
      if( key == 'name' || key == 'description' || key == 'username' ) continue;

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
  editModule.edit(currentItems[row]);
}

},{}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js":[function(require,module,exports){
var utils = require('../utils');

var events = require('events').EventEmitter;
events = new events();
events.setMaxListeners(1000);

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

function addVault(location) {
  if( !settings.vaults ) config.vaults = [];

  if( settings.vaults.indexOf(location) > -1 ) {
    return;
  }

  settings.vaults.push(location);

  set('vaults', settings.vaults);

  events.emit('vaults-updated', settings.vaults);
}

module.exports = {
  get : get,
  set : set,
  addVault : addVault,
  on : function(event, listener){
    events.on(event, listener);
  }
};

},{"../utils":"/Users/jrmerz/dev/personal/nw-password-vault/lib/utils/index.js","events":"/Users/jrmerz/dev/personal/nw-password-vault/node_modules/grunt-browserify/node_modules/browserify/node_modules/events/events.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/utils/index.js":[function(require,module,exports){

module.exports.getUserHome = function() {
  return window.process.env[(window.process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

},{}],"/Users/jrmerz/dev/personal/nw-password-vault/node_modules/grunt-browserify/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},["/Users/jrmerz/dev/personal/nw-password-vault/lib/index.js"])("/Users/jrmerz/dev/personal/nw-password-vault/lib/index.js")
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY3J5cHRvL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibGliL2luaXQuanMiLCJsaWIvcGFnZXMvbWFuYWdlL2NyZWF0ZS5qcyIsImxpYi9wYWdlcy9tYW5hZ2UvaW1wb3J0LmpzIiwibGliL3BhZ2VzL21hbmFnZS9pbmRleC5qcyIsImxpYi9wYWdlcy9yb3V0ZXIuanMiLCJsaWIvcGFnZXMvdXNlL2VkaXQuanMiLCJsaWIvcGFnZXMvdXNlL2luZGV4LmpzIiwibGliL3BhZ2VzL3VzZS9zZWFyY2guanMiLCJsaWIvc2V0dGluZ3MvaW5kZXguanMiLCJsaWIvdXRpbHMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY3J5cHRvID0gTk9ERS5jcnlwdG8sXG4gICAgYWxnb3JpdGhtID0gJ2Flcy0yNTYtY3RyJyxcbiAgICBwYXNzd29yZCA9ICcnO1xuXG5tb2R1bGUuZXhwb3J0cy5lbmNyeXB0ID0gZnVuY3Rpb24odGV4dCl7XG4gIHZhciBjaXBoZXIgPSBjcnlwdG8uY3JlYXRlQ2lwaGVyKGFsZ29yaXRobSwgcGFzc3dvcmQpO1xuICB2YXIgY3J5cHRlZCA9IGNpcGhlci51cGRhdGUodGV4dCwndXRmOCcsJ2hleCcpO1xuICBjcnlwdGVkICs9IGNpcGhlci5maW5hbCgnaGV4Jyk7XG4gIHJldHVybiBjcnlwdGVkO1xufTtcblxubW9kdWxlLmV4cG9ydHMuZGVjcnlwdCA9IGZ1bmN0aW9uKHRleHQpe1xuICB2YXIgZGVjaXBoZXIgPSBjcnlwdG8uY3JlYXRlRGVjaXBoZXIoYWxnb3JpdGhtLHBhc3N3b3JkKTtcbiAgdmFyIGRlYyA9IGRlY2lwaGVyLnVwZGF0ZSh0ZXh0LCdoZXgnLCd1dGY4Jyk7XG4gIGRlYyArPSBkZWNpcGhlci5maW5hbCgndXRmOCcpO1xuICByZXR1cm4gZGVjO1xufTtcblxubW9kdWxlLmV4cG9ydHMuc2V0UGFzc3dvcmQgPSBmdW5jdGlvbihwYXNzKSB7XG4gIHBhc3N3b3JkID0gcGFzcztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3J5cHRvIDogcmVxdWlyZSgnLi9jcnlwdG8nKSxcbiAgYmVoYXZpb3JzIDoge1xuICAgIEltcG9ydFZhdWx0IDogcmVxdWlyZSgnLi9wYWdlcy9tYW5hZ2UvaW1wb3J0JylcbiAgfVxufTtcblxuXG5yZXF1aXJlKCcuL2luaXQnKSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgJCh3aW5kb3cpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiggZS53aGljaCA9PSA3MyAmJiBlLmN0cmxLZXkgKSB7XG4gICAgICB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJykuV2luZG93LmdldCgpLnNob3dEZXZUb29scygpO1xuICAgIH0gZWxzZSBpZiAoIGUud2hpY2ggPT0gODIgJiYgZS5jdHJsS2V5ICkge1xuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfVxuICB9KTtcblxuICB2YXIgZ3VpID0gd2luZG93LnJlcXVpcmUoJ253Lmd1aScpO1xuICB3aW4gPSBndWkuV2luZG93LmdldCgpO1xuICB2YXIgbmF0aXZlTWVudUJhciA9IG5ldyBndWkuTWVudSh7IHR5cGU6IFwibWVudWJhclwiIH0pO1xuICB0cnkge1xuICAgIG5hdGl2ZU1lbnVCYXIuY3JlYXRlTWFjQnVpbHRpbihcIk5XIFBhc3N3b3JkIFZhdWx0XCIpO1xuICAgIHdpbi5tZW51ID0gbmF0aXZlTWVudUJhcjtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmxvZyhleC5tZXNzYWdlKTtcbiAgfVxuXG4gICQoZG9jdW1lbnQpLm9uKCdyZWFkeScsIGZ1bmN0aW9uKCl7XG4gICAgcmVxdWlyZSgnLi9wYWdlcy9yb3V0ZXInKTtcbiAgICByZXF1aXJlKCcuL3BhZ2VzL21hbmFnZScpLmluaXQoKTtcbiAgICByZXF1aXJlKCcuL3BhZ2VzL3VzZScpLmluaXQoKTtcbiAgfSk7XG5cbn07XG4iLCJ2YXIgZnMgPSBOT0RFLmZzO1xudmFyIGNyeXB0byA9IHJlcXVpcmUoJy4uLy4uL2NyeXB0bycpO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vLi4vc2V0dGluZ3MnKTtcblxuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICQoJyNjcmVhdGUtYnRuJykub24oJ2NsaWNrJywgY3JlYXRlKTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgdmFyIGluZm8gPSB7XG4gICAgbG9jYXRpb24gOiAkKCcjbmV3LWxvY2F0aW9uJykudmFsKCksXG4gICAgcGFzc3dvcmQgOiAkKCcjbmV3LXBhc3N3b3JkJykudmFsKCksXG4gICAgcGFzc3dvcmRWZXJpZnkgOiAkKCcjbmV3LXBhc3N3b3JkLXZlcmlmeScpLnZhbCgpXG4gIH07XG5cbiAgaWYoIGluZm8ubG9jYXRpb24ubGVuZ3RoID09PSAwICkge1xuICAgIHJldHVybiBlcnJvcignWW91IG11c3QgcHJvdmlkZSBhIGxvY2F0aW9uIGZvciB0aGUgdmF1bHQuJyk7XG4gIH1cbiAgaWYoIGluZm8ucGFzc3dvcmQgIT09IGluZm8ucGFzc3dvcmRWZXJpZnkgKSB7XG4gICAgcmV0dXJuIGVycm9yKCdZb3VyIHBhc3N3b3JkcyBkbyBub3QgbWF0Y2guJyk7XG4gIH1cbiAgaWYoIGluZm8ucGFzc3dvcmQubGVuZ3RoIDwgOCApIHtcbiAgICByZXR1cm4gZXJyb3IoJ1lvdXIgcGFzc3dvcmQgaXMgbGVzcyB0aGFuIDggY2hhcmFjdGVycy4nKTtcbiAgfVxuXG4gIGluZm8ubG9jYXRpb24gPSBpbmZvLmxvY2F0aW9uKycvcGFzcy52YXVsdCc7XG4gIHN1Y2Nlc3MoKTtcblxuICB2YXIgZW1wdHkgPSB7XG4gICAgaXRlbXMgOiBbXVxuICB9O1xuXG4gIGNyeXB0by5zZXRQYXNzd29yZChpbmZvLnBhc3N3b3JkKTtcbiAgdmFyIGRhdGEgPSBjcnlwdG8uZW5jcnlwdChKU09OLnN0cmluZ2lmeShlbXB0eSkpO1xuICBmcy53cml0ZUZpbGVTeW5jKGluZm8ubG9jYXRpb24sIGRhdGEpO1xuXG4gIFZhdWx0LmFjdGl2ZSA9IHtcbiAgICBsb2NhdGlvbiA6IGluZm8ubG9jYXRpb24sXG4gICAgcGFzc3dvcmQgOiBpbmZvLnBhc3N3b3JkXG4gIH07XG5cbiAgc2V0dGluZ3MuYWRkVmF1bHQoaW5mby5sb2NhdGlvbik7XG5cbiAgJCgnI25ldy1sb2NhdGlvbicpLnZhbCgnJyk7XG4gICQoJyNuZXctcGFzc3dvcmQnKS52YWwoJycpO1xuICAkKCcjbmV3LXBhc3N3b3JkLXZlcmlmeScpLnZhbCgnJyk7XG5cbiAgd2luZG93LmxvY2F0aW9uID0gJyN1c2UnO1xufVxuXG5mdW5jdGlvbiBzdWNjZXNzKCkge1xuICBlcnJvcignJyk7XG59XG5cbmZ1bmN0aW9uIGVycm9yKG1zZykge1xuICBpZiggIW1zZyApICQoJyNuZXctbWVzc2FnZScpLmh0bWwoJycpO1xuICBlbHNlICQoJyNuZXctbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIj4nK21zZysnPC9kaXY+Jyk7XG59XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi8uLi9zZXR0aW5ncycpO1xuXG5mdW5jdGlvbiBpbXBvcnRGaWxlKGZpbGUpIHtcbiAgc2V0dGluZ3MuYWRkVmF1bHQoZmlsZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbXBvcnQgOiBpbXBvcnRGaWxlXG59XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscycpO1xudmFyIGNyZWF0ZSA9IHJlcXVpcmUoJy4vY3JlYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpe1xuICBjcmVhdGUuaW5pdCgpO1xufTtcbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL3NldHRpbmdzJyk7XG5cbiQod2luZG93KS5vbignaGFzaGNoYW5nZScsIHVwZGF0ZVBhZ2UpO1xuXG5mdW5jdGlvbiB1cGRhdGVQYWdlKCkge1xuICB2YXIgcGFydHMgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5yZXBsYWNlKC8jLywnJykuc3BsaXQoJy8nKTtcblxuICB2YXIgY29uZmlnID0gc2V0dGluZ3MuZ2V0KCk7XG4gIHZhciBwYWdlID0gcGFydHNbMF07XG5cbiAgaWYoIHBhZ2UgPT09ICcnICkge1xuICAgIC8vaWYoIGNvbmZpZy5kZWZhdWx0ICkge1xuICAgICAgcGFnZSA9ICd1c2UnO1xuICAgIC8vfSBlbHNlIHtcbiAgICAvLyAgcGFnZSA9ICdtYW5hZ2UnO1xuICAgIC8vfVxuICB9XG5cblxuXG4gICQoJy5wYWdlJykuaGlkZSgpO1xuICB2YXIgZWxlID0gJCgnIycrcGFnZSkuc2hvdygpO1xuXG4gICQoJ2xpW3JvbGU9XCJwcmVzZW50YXRpb25cIl0nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICQoJ2Fbcm9sZT1cInRhYlwiXVtocmVmPVwiIycrcGFnZSsnXCJdJykucGFyZW50KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuXG4gIGlmKCBlbGVbMF0ub25TaG93ICkgZWxlWzBdLm9uU2hvdygpO1xufVxuXG51cGRhdGVQYWdlKCk7XG4iLCJ2YXIgZW50cnkgPSBudWxsO1xudmFyIGlzTmV3ID0gZmFsc2U7XG52YXIgZWRpdE5hbWUgPSAnJztcbnZhciBvdGhlckNvdW50ID0gMDtcbnZhciByb290ID0gJyNlZGl0LWVudHJ5LXBhc3N3b3JkJztcblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKG9uU2F2ZSkge1xuICAkKCcjZWRpdC1lbnRyeS1wb3B1cCcpLm1vZGFsKHtcbiAgICBzaG93OiBmYWxzZSxcbiAgICBiYWNrZHJvcDogJ3N0YXRpYydcbiAgfSk7XG4gICQoJyNhZGQtZW50cnktYnRuJykub24oJ2NsaWNrJywgYWRkKTtcbiAgJCgnI2VkaXQtZW50cnktYWRkLWZpZWxkLWJ0bicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgYWRkRmllbGQoKTtcbiAgfSk7XG5cbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQnKS5vbignYmx1cicsIHZlcmlmeSk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLXZlcmlmeScpLm9uKCdibHVyJywgdmVyaWZ5KTtcblxuICAkKCcjZWRpdC1lbnRyeS1zYXZlLWJ0bicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGhhc0Vycm9yID0gdmVyaWZ5KCk7XG4gICAgaWYoIGhhc0Vycm9yICkgcmV0dXJuO1xuXG4gICAgdmFyIGVudHJ5ID0gZ2V0RW50cnkoKTtcbiAgICBvblNhdmUoe1xuICAgICAgZW50cnk6IGVudHJ5LFxuICAgICAgb3JpZ2luYWxOYW1lIDogZWRpdE5hbWUsXG4gICAgICBpc05ldyA6IGlzTmV3XG4gICAgfSk7XG4gIH0pO1xuXG4gICQoJyNlZGl0LWVudHJ5LWRlbGV0ZS1idG4nKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgIGlmKCAhY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGNvbXBsZXRlbHkgcmVtb3ZlOiAnK2VkaXROYW1lKyc/JykgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb25TYXZlKHtcbiAgICAgIG5hbWUgOiBlZGl0TmFtZSxcbiAgICAgIHJlbW92ZSA6IHRydWVcbiAgICB9KTtcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwJykubW9kYWwoJ2hpZGUnKTtcbn07XG5cbmZ1bmN0aW9uIGFkZCgpIHtcbiAgcmVzZXQoKTtcbiAgJCgnI2VkaXQtZW50cnktZGVsZXRlLWJ0bicpLmhpZGUoKTtcblxuICBvdGhlckNvdW50ID0gMDtcbiAgaXNOZXcgPSB0cnVlO1xuICAkKCcjZWRpdC1lbnRyeS1wb3B1cC10aXRsZScpLmh0bWwoJ0FkZCBFbnRyeScpO1xuICBzaG93KCk7XG59XG5cbm1vZHVsZS5leHBvcnRzLmVkaXQgPSBmdW5jdGlvbihlbnRyeSkge1xuICByZXNldCgpO1xuXG4gIGVkaXROYW1lID0gZW50cnkubmFtZTtcbiAgb3RoZXJDb3VudCA9IDA7XG4gIGlzTmV3ID0gZmFsc2U7XG5cbiAgJCgnI2VkaXQtZW50cnktZGVsZXRlLWJ0bicpLnNob3coKTtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAtdGl0bGUnKS5odG1sKCdFZGl0IEVudHJ5Jyk7XG5cbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtbmFtZScpLnZhbChlbnRyeS5uYW1lKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtZGVzY3JpcHRpb24nKS52YWwoZW50cnkuZGVzY3JpcHRpb24gfHwgJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC11c2VybmFtZScpLnZhbChlbnRyeS51c2VybmFtZSB8fCAnJyk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkJykudmFsKGVudHJ5LnBhc3N3b3JkKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtdmVyaWZ5JykudmFsKGVudHJ5LnBhc3N3b3JkKTtcblxuICBmb3IoIHZhciBrZXkgaW4gZW50cnkgKSB7XG4gICAgaWYoIGtleSA9PSAnbmFtZScgfHwga2V5ID09ICdwYXNzd29yZCcgfHwga2V5ID09ICdkZXNjcmlwdGlvbicgfHwga2V5ID09ICd1c2VybmFtZScgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBhZGRGaWVsZChrZXksIGVudHJ5W2tleV0pO1xuICB9XG5cbiAgc2hvdygpO1xufTtcblxuZnVuY3Rpb24gYWRkRmllbGQoaXRlbSwgdmFsdWUpIHtcbiAgdmFyIGh0bWwgPVxuICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy1vdXRlclwiPicrXG4gICAgICAnPGxhYmVsIGNsYXNzPVwiY29sLXNtLTMgY29udHJvbC1sYWJlbFwiPicrXG4gICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIHBsYWNlaG9sZGVyPVwiRmllbGQgTmFtZVwiIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy1uYW1lXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIvPicrXG4gICAgICAnPC9sYWJlbD4nK1xuICAgICAgJzxkaXYgY2xhc3M9XCJjb2wtc20tOVwiPicrXG4gICAgICAgICc8aW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KydcIiBwbGFjZWhvbGRlcj1cIlBhc3N3b3JkXCIgLz4nK1xuICAgICAgICAnPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLXZlcmlmeVwiIHBsYWNlaG9sZGVyPVwiVmVyaWZ5IFBhc3N3b3JkXCIgLz4nK1xuICAgICAgICAnPHNwYW4gaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW1zZ1wiPjwvc3Bhbj4nK1xuICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBpbmRleD1cIicrb3RoZXJDb3VudCsnXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT48L2E+JytcbiAgICAgICc8L2Rpdj4nK1xuICAgICc8L2Rpdj4nO1xuXG4gIHZhciBlbGUgPSAkKGh0bWwpO1xuICBlbGUuZmluZCgnaW5wdXQnKS5vbignYmx1cicsIHZlcmlmeSk7XG4gIGVsZS5maW5kKCdhJykub24oJ2NsaWNrJyxmdW5jdGlvbigpIHtcbiAgICBpZiggY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZTogJyskKCckZWRpdC1lbnRyeS1wYXNzd29yZC0nKyQodGhpcykuYXR0cignaW5kZXgnKSsnLW5hbWUnKS52YWwoKSkgKSB7XG4gICAgICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC0nKyQodGhpcykuYXR0cignaW5kZXgnKSsnLW91dGVyJykucmVtb3ZlKCk7XG4gICAgfVxuICB9KTtcblxuICBpZiggaXRlbSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSB1bmRlZmluZWQgKSB7XG4gICAgZWxlLmZpbmQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW5hbWUnKS52YWwoaXRlbSk7XG4gICAgZWxlLmZpbmQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCkudmFsKHZhbHVlKTtcbiAgICBlbGUuZmluZCgnI2VkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctdmVyaWZ5JykudmFsKHZhbHVlKTtcbiAgfVxuXG4gICQoJyNlZGl0LWVudHJ5LW90aGVyLWZpZWxkcycpLmFwcGVuZChlbGUpO1xuICBvdGhlckNvdW50Kys7XG59XG5cbmZ1bmN0aW9uIHZlcmlmeSgpIHtcbiAgdmFyIGVycm9ycyA9IFtdLCBpO1xuICBlcnJvcnMucHVzaCh2ZXJpZnlJdGVtKCkpO1xuICBmb3IoIGkgPSAwOyBpIDwgb3RoZXJDb3VudDsgaSsrICkge1xuICAgIGVycm9ycy5wdXNoKHZlcmlmeUl0ZW0oaSkpO1xuICB9XG5cbiAgZm9yKCBpID0gMDsgaSA8IGVycm9ycy5sZW5ndGg7IGkrKyApIHtcbiAgICBpZiggZXJyb3JzW2ldICkgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGdldEVudHJ5KCkge1xuICB2YXIgZW50cnkgPSB7XG4gICAgbmFtZSA6ICQocm9vdCsnLW5hbWUnKS52YWwoKSxcbiAgICBkZXNjcmlwdGlvbiA6ICQocm9vdCsnLWRlc2NyaXB0aW9uJykudmFsKCksXG4gICAgdXNlcm5hbWUgOiAkKHJvb3QrJy11c2VybmFtZScpLnZhbCgpLFxuICAgIHBhc3N3b3JkIDogJChyb290KS52YWwoKVxuICB9O1xuXG4gIGZvciggaSA9IDA7IGkgPCBvdGhlckNvdW50OyBpKysgKSB7XG4gICAgdmFyIG5hbWUgPSAkKHJvb3QrJy0nK2krJy1uYW1lJykudmFsKCk7XG4gICAgdmFyIHBhc3MgPSAkKHJvb3QrJy0nK2kpLnZhbCgpO1xuXG4gICAgaWYoIG5hbWUgPT09IHVuZGVmaW5lZCB8fCBwYXNzID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYoIG5hbWUgPT0gJ25hbWUnIHx8IG5hbWUgPT0gJ3Bhc3N3b3JkJyB8fCBuYW1lID09ICdkZXNjcmlwdGlvbicgfHwgbmFtZSA9PSAndXNlcm5hbWUnICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGVudHJ5W25hbWVdID0gcGFzcztcbiAgfVxuXG4gIHJldHVybiBlbnRyeTtcbn1cblxuZnVuY3Rpb24gdmVyaWZ5SXRlbShpbmRleCkge1xuICB2YXIgaXNDdXN0b20gPSBmYWxzZTtcbiAgdmFyIHF1ZXJ5ID0gcm9vdDtcblxuICBpZiggaW5kZXggIT09IHVuZGVmaW5lZCApIHtcbiAgICBxdWVyeSArPSAnLScraW5kZXg7XG4gICAgaXNDdXN0b20gPSB0cnVlO1xuICB9XG5cbiAgdmFyIG5hbWUgPSAkKHF1ZXJ5KyctbmFtZScpLnZhbCgpO1xuICB2YXIgcGFzcyA9ICQocXVlcnkpLnZhbCgpO1xuXG4gIGlmKCBuYW1lID09PSB1bmRlZmluZWQgfHwgcGFzcyA9PT0gdW5kZWZpbmVkICkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gaXRlbSBoYXMgYmVlbiBkZWxldGVkXG4gIH1cblxuICB2YXIgdmVyaWZ5UGFzcyA9ICQocXVlcnkrJy12ZXJpZnknKS52YWwoKTtcbiAgdmFyIG1zZyA9ICQocXVlcnkrJy1tc2cnKTtcblxuICBpZiggcGFzcy5sZW5ndGggPT09IDAgKSB7XG4gICAgZXJyb3IobXNnLCAnWW91IGRpZCBub3QgcHJvdmlkZSBhIHBhc3N3b3JkJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggdmVyaWZ5UGFzcyAhPSBwYXNzICkge1xuICAgIGVycm9yKG1zZywgJ1lvdXIgaXRlbXMgZG8gbm90IG1hdGNoJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggbmFtZS5sZW5ndGggPT09IDAgKSB7XG4gICAgZXJyb3IobXNnLCAnWW91IG11c3QgcHJvdmlkZSBhIG5hbWUnKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmKCAobmFtZSA9PSAnbmFtZScgfHwgbmFtZSA9PSAncGFzc3dvcmQnIHx8IG5hbWUgPT0gJ2Rlc2NyaXB0aW9uJyB8fCBuYW1lID09ICd1c2VybmFtZScpICYmIGlzQ3VzdG9tICkge1xuICAgIGVycm9yKG1zZywgJ0ludmFsaWQgbmFtZScpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgbXNnLmh0bWwoJzxzcGFuIGNsYXNzPVwidGV4dCB0ZXh0LXN1Y2Nlc3NcIj48aSBjbGFzcz1cImZhIGZhLWNoZWNrXCI+PC9pPjwvc3Bhbj4nKTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGVycm9yKGVsZSwgbXNnKSB7XG4gIGVsZS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCI+Jyttc2crJzwvZGl2PicpO1xufVxuXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtbmFtZScpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLWRlc2NyaXB0aW9uJykudmFsKCcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtdXNlcm5hbWUnKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZCcpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLXZlcmlmeScpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LW90aGVyLWZpZWxkcycpLmh0bWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC1tc2cnKS5odG1sKCcnKTtcbn1cblxuZnVuY3Rpb24gc2hvdygpIHtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAnKS5tb2RhbCgnc2hvdycpO1xufVxuIiwidmFyIGZzID0gTk9ERS5mcztcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uLy4uL3NldHRpbmdzJyk7XG52YXIgY3J5cHRvID0gcmVxdWlyZSgnLi4vLi4vY3J5cHRvJyk7XG52YXIgc2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2gnKTtcbnZhciBlZGl0ID0gcmVxdWlyZSgnLi9lZGl0Jyk7XG52YXIgY29uZmlnO1xuXG52YXIgY3VycmVudFZhdWx0ID0ge1xuICBmaWxlIDogJycsXG4gIGRhdGEgOiBudWxsXG59O1xuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICQoJyN1c2UnKVswXS5vblNob3cgPSBvblNob3c7XG5cbiAgJCgnI3VubG9jay1wb3B1cCcpLm1vZGFsKHtzaG93OiBmYWxzZX0pO1xuICAkKCcjdW5sb2NrLXNob3ctYnRuJykub24oJ2NsaWNrJyxmdW5jdGlvbigpe1xuICAgICQoJyN1bmxvY2stcG9wdXAtZmlsZW5hbWUnKS5odG1sKFZhdWx0LmFjdGl2ZSk7XG4gICAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCcnKTtcbiAgICAkKCcjdW5sb2NrLXBvcHVwJykubW9kYWwoJ3Nob3cnKTtcbiAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykudmFsKCcnKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykuZm9jdXMoKTtcbiAgICB9LCAyNTApO1xuICB9KTtcblxuICAkKCcjdW5sb2NrLWJ0bicpLm9uKCdjbGljaycsZnVuY3Rpb24oKXtcbiAgICBhdHRlbXB0VW5sb2NrKCk7XG4gIH0pO1xuICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykub24oJ2tleXVwJywgZnVuY3Rpb24oZSl7XG4gICAgaWYoIGUud2hpY2ggPT0gMTMgKSBhdHRlbXB0VW5sb2NrKCk7XG4gIH0pO1xuICAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpe1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gIH0pO1xuXG4gICQoJyN2YXVsdC1zZWxlY3QnKS5vbignY2hhbmdlJywgZnVuY3Rpb24oKXtcbiAgICBjdXJyZW50VmF1bHQuZGF0YSA9IG51bGw7XG4gICAgY3VycmVudFZhdWx0LmxvY2F0aW9uID0gJyc7XG4gICAgVmF1bHQuYWN0aXZlID0gJCh0aGlzKS52YWwoKTtcbiAgICByZXNldFVpKCk7XG4gIH0pO1xuXG4gIHNlYXJjaC5pbml0KGVkaXQpO1xuICBlZGl0LmluaXQob25TYXZlKTtcblxuICBzZXR0aW5ncy5vbigndmF1bHRzLXVwZGF0ZWQnLCBmdW5jdGlvbih2YXVsdHMpe1xuICAgIGNyZWF0ZVNlbGVjdG9yKCk7XG4gIH0pO1xuXG4gIG9uU2hvdygpO1xufTtcblxuZnVuY3Rpb24gcmVzZXRVaSgpIHtcbiAgJCgnI3VzZS1tZXNzYWdlJykuaHRtbCgnJyk7XG4gICQoJyN1c2UtcmVzdWx0cycpLmh0bWwoJycpO1xuICAkKCcjZmluZC1wYXNzd29yZCcpLmhpZGUoKTtcbiAgJCgnI3VubG9jay1zaG93LWJ0bicpLnNob3coKTtcbn1cblxuZnVuY3Rpb24gb25TYXZlKGluZm8pIHtcbiAgdmFyIGksIGl0ZW07XG5cbiAgLy8gc2ltcGxlIGRlbGV0ZVxuICBpZiggaW5mby5yZW1vdmUgKSB7XG4gICAgZm9yKCBpID0gMDsgaSA8IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLmxlbmd0aDsgaSsrICkge1xuICAgICAgaWYoIGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zW2ldLm5hbWUgPT0gaW5mby5uYW1lICkge1xuICAgICAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2F2ZSgpO1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gICAgZWRpdC5oaWRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8ganVzdCBhIHNpbXBsZSBlZGl0XG4gIGlmKCBpbmZvLm9yaWdpbmFsTmFtZSA9PSBpbmZvLmVudHJ5Lm5hbWUgKSB7XG4gICAgdXBkYXRlRW50cnkoaW5mby5lbnRyeSk7XG4gICAgc2F2ZSgpO1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gICAgZWRpdC5oaWRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGlzT3ZlcndyaXRlID0gZmFsc2U7XG4gIGZvciggaSA9IDA7IGkgPCBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICBpdGVtID0gY3VycmVudFZhdWx0LmRhdGEuaXRlbXNbaV07XG4gICAgaWYoIGl0ZW0ubmFtZSA9PSBpbmZvLmVudHJ5Lm5hbWUgKSB7XG4gICAgICBpc092ZXJ3cml0ZSA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiggaXNPdmVyd3JpdGUgJiYgIWNvbmZpcm0oJ1wiJytlbnRyeSsnXCIgYWxyZWFkeSBleGlzdHMsIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBvdmVyd3JpdGU/IScpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmKCBpbmZvLmlzTmV3ICkge1xuICAgIGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLnB1c2goaW5mby5lbnRyeSk7XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlRW50cnkoaW5mby5lbnRyeSk7XG4gIH1cblxuICBzYXZlKCk7XG4gIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gIGVkaXQuaGlkZSgpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVFbnRyeShlbnRyeSkge1xuICBmb3IoIGkgPSAwOyBpIDwgY3VycmVudFZhdWx0LmRhdGEuaXRlbXMubGVuZ3RoOyBpKysgKSB7XG4gICAgaXRlbSA9IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zW2ldO1xuICAgIGlmKCBpdGVtLm5hbWUgPT0gZW50cnkubmFtZSApIHtcbiAgICAgIGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zW2ldID0gZW50cnk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNhdmUoKSB7XG4gIHZhciBkYXRhID0gY3J5cHRvLmVuY3J5cHQoSlNPTi5zdHJpbmdpZnkoY3VycmVudFZhdWx0LmRhdGEpKTtcbiAgZnMud3JpdGVGaWxlU3luYyhjdXJyZW50VmF1bHQuZmlsZSwgZGF0YSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlbGVjdG9yKCkge1xuICBpZiggIWNvbmZpZy52YXVsdHMgKSByZXR1cm47XG5cbiAgdmFyIGh0bWwgPSAnJztcbiAgZm9yKCB2YXIgaSA9IDA7IGkgPCBjb25maWcudmF1bHRzLmxlbmd0aDsgaSsrICkge1xuICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9XCInK2NvbmZpZy52YXVsdHNbaV0rJ1wiICcrKGNvbmZpZy52YXVsdHNbaV0gPT0gVmF1bHQuYWN0aXZlID8gJ3NlbGVjdGVkJyA6ICcnKSsnPicrY29uZmlnLnZhdWx0c1tpXSsnPC9vcHRpb24+JztcbiAgfVxuICAkKCcjdmF1bHQtc2VsZWN0JykuaHRtbChodG1sKTtcbn1cblxuZnVuY3Rpb24gb25TaG93KCkge1xuICBjb25maWcgPSBzZXR0aW5ncy5nZXQoKTtcbiAgcmVzZXRVaSgpO1xuXG4gIGlmKCBWYXVsdC5hY3RpdmUgKSB7XG4gICAgb25WYXVsdFNldCgpO1xuICB9IGVsc2UgaWYgKCBjb25maWcudmF1bHRzICYmIGNvbmZpZy52YXVsdHMubGVuZ3RoID4gMCApIHtcbiAgICBWYXVsdC5hY3RpdmUgPSBjb25maWcudmF1bHRzWzBdO1xuICAgIG9uVmF1bHRTZXQoKTtcbiAgfSBlbHNlIHtcbiAgICB3YXJuKCdZb3UgaGF2ZSBubyB2YXVsdHMuICBZb3UgbXVzdCBmaXJzdCBjcmVhdGUgb25lJyk7XG4gIH1cblxuICBjcmVhdGVTZWxlY3RvcigpO1xufVxuXG5mdW5jdGlvbiBvblZhdWx0U2V0KCkge1xuICBpZiggVmF1bHQuYWN0aXZlID09PSBjdXJyZW50VmF1bHQuZmlsZSAmJiBjdXJyZW50VmF1bHQuZGF0YSAhPT0gbnVsbCApIHtcbiAgICAkKCcjdW5sb2NrLXNob3ctYnRuJykuaGlkZSgpO1xuICAgICQoJyNmaW5kLXBhc3N3b3JkJykuc2hvdygpO1xuICAgICQoJyNmaW5kLXBhc3N3b3JkLWlucHV0JykuZm9jdXMoKTtcbiAgICBzZWFyY2guZ28oY3VycmVudFZhdWx0LmRhdGEsICcnKTtcbiAgfSBlbHNlIHtcbiAgICAkKCcjdW5sb2NrLXNob3ctYnRuJykuc2hvdygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGF0dGVtcHRVbmxvY2soKSB7XG4gIGN1cnJlbnRWYXVsdC5kYXRhID0gbnVsbDtcbiAgY3J5cHRvLnNldFBhc3N3b3JkKCQoJyN1bmxvY2stcG9wdXAtcGFzc3dvcmQnKS52YWwoKSk7XG4gIHZhciBkYXRhID0gZnMucmVhZEZpbGVTeW5jKFZhdWx0LmFjdGl2ZSwgJ3V0ZjgnKTtcblxuICB0cnkge1xuICAgIGRhdGEgPSBKU09OLnBhcnNlKGNyeXB0by5kZWNyeXB0KGRhdGEpKTtcbiAgfSBjYXRjaChlKSB7XG4gICAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCI+SW52YWxpZCBQYXNzd29yZDwvZGl2PicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gICQoJyN2YXVsdC1wb3B1cC1tZXNzYWdlJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIj5TdWNjZXNzITwvZGl2PicpO1xuXG5cbiAgY3VycmVudFZhdWx0LmRhdGEgPSBkYXRhO1xuICBjdXJyZW50VmF1bHQuZmlsZSA9IFZhdWx0LmFjdGl2ZTtcbiAgb25WYXVsdFNldCgpO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgJCgnI3VubG9jay1wb3B1cCcpLm1vZGFsKCdoaWRlJyk7XG4gIH0sIDUwMCk7XG59XG5cbmZ1bmN0aW9uIHdhcm4obXNnKSB7XG4gIGlmKCAhbXNnICkgJCgndXNlLW1lc3NhZ2UnKS5odG1sKCcnKTtcbiAgZWxzZSAkKCd1c2UtbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC13YXJuXCI+Jyttc2crJzwvZGl2PicpO1xufVxuIiwidmFyIGd1aSA9IHdpbmRvdy5yZXF1aXJlKCdudy5ndWknKTtcbnZhciBjbGlwYm9hcmQgPSBndWkuQ2xpcGJvYXJkLmdldCgpO1xuXG52YXIgY3VycmVudCA9IFtdLCBjdXJyZW50RGF0YSwgY3VycmVudEl0ZW1zO1xudmFyIGVkaXRNb2R1bGU7XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbihlZGl0KSB7XG4gIGVkaXRNb2R1bGUgPSBlZGl0O1xufTtcblxubW9kdWxlLmV4cG9ydHMuZ28gPSBmdW5jdGlvbihkYXRhLCB0eHQpIHtcbiAgaWYoICFkYXRhLml0ZW1zICkgcmV0dXJuO1xuICBjdXJyZW50RGF0YSA9IGRhdGEuaXRlbXM7XG5cbiAgdmFyIHRleHQgPSB0eHQgfHwgJCgnI2ZpbmQtcGFzc3dvcmQtaW5wdXQnKS52YWwoKTtcbiAgdmFyIHJlID0gbmV3IFJlZ0V4cCgnLionK3RleHQrJy4qJywgJ2knKTtcblxuICB2YXIgcmVzdWx0cyA9IFtdO1xuICBkYXRhLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgdmFyIG5hbWUgPSBpdGVtLm5hbWUgfHwgJyc7XG4gICAgdmFyIGRlc2NyaXB0aW9uID0gaXRlbS5kZXNjcmlwdGlvbiB8fCAnJztcbiAgICBpZiggbmFtZS5tYXRjaChyZSkgfHwgZGVzY3JpcHRpb24ubWF0Y2gocmUpICkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVuZGVyUmVzdWx0cyhyZXN1bHRzKTtcbn07XG5cblxuXG5mdW5jdGlvbiByZW5kZXJSZXN1bHRzKGl0ZW1zKSB7XG4gIGlmKCBpdGVtcy5sZW5ndGggPT09IDAgKSB7XG4gICAgJCgnI3VzZS1yZXN1bHRzJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXdhcm5pbmdcIj5ObyBtYXRjaGVzIGZvdW5kPC9kaXY+Jyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGh0bWwgPSAnPGRpdiBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiPic7XG4gIGN1cnJlbnQgPSBbXTtcbiAgY3VycmVudEl0ZW1zID0gaXRlbXM7XG5cbiAgdmFyIHJvdyA9IFtdO1xuXG4gIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgcm93ID0gW107XG5cbiAgICBodG1sICs9XG4gICAgICAnPGRpdiBjbGFzcz1cIndlbGxcIj48ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPicrXG4gICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb2wtc20tMyBjb250cm9sLWxhYmVsXCI+PGg1PicraXRlbS5uYW1lKyc8L2g1PjwvbGFiZWw+JytcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb2wtc20tN1wiPicrXG4gICAgICAgICAgJzxkaXYgY2xhc3M9XCInKyhpdGVtLmRlc2NyaXB0aW9uID8gJ2hlbHAtYmxvY2snIDogJycpKydcIj4nK1xuICAgICAgICAgICAgJzxpPicrKGl0ZW0uZGVzY3JpcHRpb24gfHwgJycpKyc8L2k+JytcbiAgICAgICAgICAgICc8YSBjbGFzcz1cImJ0biBidG4tbGlua1wiIG5hbWU9XCJFZGl0XCIgaW5kZXg9XCInK2N1cnJlbnQubGVuZ3RoKydcIj48aSBjbGFzcz1cImZhIGZhLXBlbmNpbFwiPjwvaT48L2E+JytcbiAgICAgICAgICAnPC9kaXY+JytcbiAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGVcIj4nO1xuXG4gICAgaWYoIGl0ZW0udXNlcm5hbWUgKSB7XG4gICAgICBodG1sICs9ICc8dHI+JytcbiAgICAgICAgJzx0ZCBzdHlsZT1cIndpZHRoOjY1JVwiPlVzZXJuYW1lPC90ZD4nK1xuICAgICAgICAnPHRkPicrXG4gICAgICAgICAgaXRlbS51c2VybmFtZSArXG4gICAgICAgICc8L3RkPicrXG4gICAgICAnPC90cj4nO1xuICAgIH1cblxuICAgIGZvciggdmFyIGtleSBpbiBpdGVtICkge1xuICAgICAgaWYoIGtleSA9PSAnbmFtZScgfHwga2V5ID09ICdkZXNjcmlwdGlvbicgfHwga2V5ID09ICd1c2VybmFtZScgKSBjb250aW51ZTtcblxuICAgICAgaHRtbCArPVxuICAgICAgICAnPHRyPicrXG4gICAgICAgICAgJzx0ZCBzdHlsZT1cIndpZHRoOjY1JVwiPicrKGtleSA9PT0gJ3Bhc3N3b3JkJyA/ICdQYXNzd29yZCcgOiBrZXkpKyc8L3RkPicrXG4gICAgICAgICAgJzx0ZD4nK1xuICAgICAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCIgbmFtZT1cIkNvcHlcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJy0nK3Jvdy5sZW5ndGgrJ1wiPjxpIGNsYXNzPVwiZmEgZmEtY29weVwiPjwvaT48L2E+JytcbiAgICAgICAgICAgICc8YSBjbGFzcz1cImJ0biBidG4tbGlua1wiIG5hbWU9XCJTaG93XCIgaW5kZXg9XCInK2N1cnJlbnQubGVuZ3RoKyctJytyb3cubGVuZ3RoKydcIj48aSBjbGFzcz1cImZhIGZhLWV5ZVwiPjwvaT48L2E+JytcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBzaG93UGFzc1wiIHN0eWxlPVwiZGlzcGxheTpub25lXCIgaW5kZXg9XCInK2N1cnJlbnQubGVuZ3RoKyctJytyb3cubGVuZ3RoKydcIiAvPicrXG4gICAgICAgICAgJzwvdGQ+JytcbiAgICAgICAgJzwvdHI+JztcbiAgICAgIHJvdy5wdXNoKGl0ZW1ba2V5XSk7XG4gICAgfVxuXG4gICAgY3VycmVudC5wdXNoKHJvdyk7XG4gICAgaHRtbCArPSAnPC90YWJsZT48L2Rpdj48L2Rpdj48L2Rpdj4nO1xuICB9KTtcblxuICB2YXIgcmVzdWx0cyA9ICQoJyN1c2UtcmVzdWx0cycpLmh0bWwoaHRtbCsnPC9kaXY+Jyk7XG5cbiAgcmVzdWx0cy5maW5kKCdhW25hbWU9XCJDb3B5XCJdJykub24oJ2NsaWNrJywgY29weSk7XG4gIHJlc3VsdHMuZmluZCgnYVtuYW1lPVwiU2hvd1wiXScpLm9uKCdjbGljaycsIHNob3cpO1xuICByZXN1bHRzLmZpbmQoJ2FbbmFtZT1cIkVkaXRcIl0nKS5vbignY2xpY2snLCBlZGl0KTtcbn1cblxuZnVuY3Rpb24gc2hvdyhlKSB7XG4gIHZhciBlbGUgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gIHZhciBpZCA9IGVsZS5hdHRyKCdpbmRleCcpO1xuXG4gIGlmKCBlbGUuZmluZCgnaScpLmhhc0NsYXNzKCdmYS1leWUnKSApIHtcbiAgICBpZCA9IGlkLnNwbGl0KCctJyk7XG4gICAgdmFyIHJvdyA9IHBhcnNlSW50KGlkWzBdKSwgY29sID0gcGFyc2VJbnQoaWRbMV0pO1xuICAgIGVsZS5wYXJlbnQoKS5maW5kKCcuc2hvd1Bhc3MnKS52YWwoY3VycmVudFtyb3ddW2NvbF0pLnNob3coKS5zZWxlY3QoKTtcbiAgICBlbGUuZmluZCgnaScpLnJlbW92ZUNsYXNzKCdmYS1leWUnKS5hZGRDbGFzcygnZmEtZXllLXNsYXNoJyk7XG4gIH0gZWxzZSB7XG4gICAgZWxlLnBhcmVudCgpLmZpbmQoJy5zaG93UGFzcycpLmh0bWwoJycpLmhpZGUoKTtcbiAgICBlbGUuZmluZCgnaScpLnJlbW92ZUNsYXNzKCdmYS1leWUtc2xhc2gnKS5hZGRDbGFzcygnZmEtZXllJyk7XG4gIH1cbn1cblxudmFyIGhpZGVUaW1lciA9IC0xO1xuZnVuY3Rpb24gY29weShlKSB7XG4gIHZhciBlbGUgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gIHZhciBpZCA9IGVsZS5hdHRyKCdpbmRleCcpO1xuICBpZCA9IGlkLnNwbGl0KCctJyk7XG4gIHZhciByb3cgPSBwYXJzZUludChpZFswXSksIGNvbCA9IHBhcnNlSW50KGlkWzFdKTtcblxuICBjbGlwYm9hcmQuc2V0KGN1cnJlbnRbcm93XVtjb2xdLCAndGV4dCcpO1xuXG4gICQoJyN0b2FzdCcpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1zdWNjZXNzXCI+Q29waWVkIHRvIGNsaXBib2FyZDwvZGl2PicpLnNob3coKTtcblxuICBpZiggaGlkZVRpbWVyICE9IC0xICkgY2xlYXJUaW1lb3V0KGhpZGVUaW1lcik7XG4gIGhpZGVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICBjbGVhclRpbWVvdXQoaGlkZVRpbWVyKTtcbiAgICAkKCcjdG9hc3QnKS5oaWRlKCk7XG4gIH0sIDIwMDApO1xufVxuXG5mdW5jdGlvbiBlZGl0KGUpIHtcbiAgdmFyIGVsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgdmFyIHJvdyA9IHBhcnNlSW50KGVsZS5hdHRyKCdpbmRleCcpKTtcbiAgZWRpdE1vZHVsZS5lZGl0KGN1cnJlbnRJdGVtc1tyb3ddKTtcbn1cbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbnZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG5ldmVudHMgPSBuZXcgZXZlbnRzKCk7XG5ldmVudHMuc2V0TWF4TGlzdGVuZXJzKDEwMDApO1xuXG52YXIgZnMgPSBOT0RFLmZzO1xuXG52YXIgRklMRU5BTUUgPSAnLm53UGFzc3dvcmRWYXVsdCc7XG5cbnZhciBwYXRoID0gdXRpbHMuZ2V0VXNlckhvbWUoKSsnLycrRklMRU5BTUU7XG5pZiggIWZzLmV4aXN0c1N5bmMocGF0aCkgKSB7XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgJ3t9Jyk7XG59XG5cbnZhciBzZXR0aW5ncyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGgsICd1dGYtOCcpKTtcblxuZnVuY3Rpb24gZ2V0KCkge1xuICByZXR1cm4gc2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gIHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgZnMud3JpdGVGaWxlU3luYyhwYXRoLCBKU09OLnN0cmluZ2lmeShzZXR0aW5ncykpO1xufVxuXG5mdW5jdGlvbiBhZGRWYXVsdChsb2NhdGlvbikge1xuICBpZiggIXNldHRpbmdzLnZhdWx0cyApIGNvbmZpZy52YXVsdHMgPSBbXTtcblxuICBpZiggc2V0dGluZ3MudmF1bHRzLmluZGV4T2YobG9jYXRpb24pID4gLTEgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc2V0dGluZ3MudmF1bHRzLnB1c2gobG9jYXRpb24pO1xuXG4gIHNldCgndmF1bHRzJywgc2V0dGluZ3MudmF1bHRzKTtcblxuICBldmVudHMuZW1pdCgndmF1bHRzLXVwZGF0ZWQnLCBzZXR0aW5ncy52YXVsdHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IDogZ2V0LFxuICBzZXQgOiBzZXQsXG4gIGFkZFZhdWx0IDogYWRkVmF1bHQsXG4gIG9uIDogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKXtcbiAgICBldmVudHMub24oZXZlbnQsIGxpc3RlbmVyKTtcbiAgfVxufTtcbiIsIlxubW9kdWxlLmV4cG9ydHMuZ2V0VXNlckhvbWUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHdpbmRvdy5wcm9jZXNzLmVudlsod2luZG93LnByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJykgPyAnVVNFUlBST0ZJTEUnIDogJ0hPTUUnXTtcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
