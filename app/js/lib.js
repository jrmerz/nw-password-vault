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
  settings : require('./settings'),
  search : require('./search'),
  behaviors : {
    ImportVault : require('./pages/manage/import')
  }
};


require('./init')();

},{"./crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","./init":"/Users/jrmerz/dev/personal/nw-password-vault/lib/init.js","./pages/manage/import":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/import.js","./search":"/Users/jrmerz/dev/personal/nw-password-vault/lib/search/index.js","./settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/init.js":[function(require,module,exports){
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
    nativeMenuBar.createMacBuiltin("Password Vault");
    win.menu = nativeMenuBar;
  } catch (ex) {
    console.log(ex.message);
  }

  $(document).on('ready', function(){
    require('./pages/router');
    require('./pages/use').init();
  });

};

},{"./pages/router":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/router.js","./pages/use":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/manage/import.js":[function(require,module,exports){
var settings = require('../../settings');

function importFile(file) {
  settings.addVault(file);
}

module.exports = {
  import : importFile
}

},{"../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/router.js":[function(require,module,exports){
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
          '<app-password-input index="'+otherCount+'"></app-password-input>'+
          '<a class="btn btn-link" index="'+otherCount+'"><i class="fa fa-trash"></i></a>'+
        '</div>'+
      '</div>';

    var ele = $(html);
    //ele.find('input').on('blur', verify);
    ele.find('a').on('click',function() {
      if( confirm('Are you sure you want to delete: '+$('$edit-entry-password-'+$(this).attr('index')+'-name').val()) ) {
        $('#edit-entry-password-'+$(this).attr('index')+'-outer').remove();
      }
    });

    if( item !== undefined && value !== undefined ) {
      ele.find('#edit-entry-password-'+otherCount+'-name').val(item);
      ele.find('app-password-input[index="'+otherCount+'"]').val(value);
    }

    $('#edit-entry-other-fields').append(ele);
    otherCount++;
/*  var html =
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
  otherCount++;*/
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
    var pass = $('app-password-input[index="'+otherCount+'"]').val();

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

  $('#unlock-show-btn').on('click', showUnlockPopup);
  $('#unlock-btn').on('click', attemptUnlock);

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

  // auto show unlock if we have an active vault
  setTimeout(function(){
    if( Vault.active ) showUnlockPopup();
  }, 200);
};

function resetUi() {
  $('#use-message').html('');
  $('#use-results').html('');
  $('#find-password').hide();
  $('#unlock-show-btn').show();
}

function showUnlockPopup() {
  $('#unlock-popup-filename').html(Vault.active);
  $('#vault-popup-message').html('');
  $('#unlock-popup').modal('show');
  $('#unlock-popup-password').val('');

  setTimeout(function(){
    $('#unlock-popup-password').focus();
  }, 250);
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

  if( isOverwrite && !confirm('"'+info.entry+'" already exists, are you sure you want to overwrite?!') ) {
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

},{}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/search/index.js":[function(require,module,exports){
module.exports = function(vault, txt) {
  if( !vault.items ) return [];

  var re = new RegExp('.*'+txt+'.*', 'i');

  var results = [];
  data.items.forEach(function(item){
    var name = item.name || '';
    var description = item.description || '';
    if( name.match(re) || description.match(re) ) {
      results.push(item);
    }
  });

  return results;
};

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY3J5cHRvL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibGliL2luaXQuanMiLCJsaWIvcGFnZXMvbWFuYWdlL2ltcG9ydC5qcyIsImxpYi9wYWdlcy9yb3V0ZXIuanMiLCJsaWIvcGFnZXMvdXNlL2VkaXQuanMiLCJsaWIvcGFnZXMvdXNlL2luZGV4LmpzIiwibGliL3BhZ2VzL3VzZS9zZWFyY2guanMiLCJsaWIvc2VhcmNoL2luZGV4LmpzIiwibGliL3NldHRpbmdzL2luZGV4LmpzIiwibGliL3V0aWxzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBjcnlwdG8gPSBOT0RFLmNyeXB0byxcbiAgICBhbGdvcml0aG0gPSAnYWVzLTI1Ni1jdHInLFxuICAgIHBhc3N3b3JkID0gJyc7XG5cbm1vZHVsZS5leHBvcnRzLmVuY3J5cHQgPSBmdW5jdGlvbih0ZXh0KXtcbiAgdmFyIGNpcGhlciA9IGNyeXB0by5jcmVhdGVDaXBoZXIoYWxnb3JpdGhtLCBwYXNzd29yZCk7XG4gIHZhciBjcnlwdGVkID0gY2lwaGVyLnVwZGF0ZSh0ZXh0LCd1dGY4JywnaGV4Jyk7XG4gIGNyeXB0ZWQgKz0gY2lwaGVyLmZpbmFsKCdoZXgnKTtcbiAgcmV0dXJuIGNyeXB0ZWQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5kZWNyeXB0ID0gZnVuY3Rpb24odGV4dCl7XG4gIHZhciBkZWNpcGhlciA9IGNyeXB0by5jcmVhdGVEZWNpcGhlcihhbGdvcml0aG0scGFzc3dvcmQpO1xuICB2YXIgZGVjID0gZGVjaXBoZXIudXBkYXRlKHRleHQsJ2hleCcsJ3V0ZjgnKTtcbiAgZGVjICs9IGRlY2lwaGVyLmZpbmFsKCd1dGY4Jyk7XG4gIHJldHVybiBkZWM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5zZXRQYXNzd29yZCA9IGZ1bmN0aW9uKHBhc3MpIHtcbiAgcGFzc3dvcmQgPSBwYXNzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBjcnlwdG8gOiByZXF1aXJlKCcuL2NyeXB0bycpLFxuICBzZXR0aW5ncyA6IHJlcXVpcmUoJy4vc2V0dGluZ3MnKSxcbiAgc2VhcmNoIDogcmVxdWlyZSgnLi9zZWFyY2gnKSxcbiAgYmVoYXZpb3JzIDoge1xuICAgIEltcG9ydFZhdWx0IDogcmVxdWlyZSgnLi9wYWdlcy9tYW5hZ2UvaW1wb3J0JylcbiAgfVxufTtcblxuXG5yZXF1aXJlKCcuL2luaXQnKSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgJCh3aW5kb3cpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiggZS53aGljaCA9PSA3MyAmJiBlLmN0cmxLZXkgKSB7XG4gICAgICB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJykuV2luZG93LmdldCgpLnNob3dEZXZUb29scygpO1xuICAgIH0gZWxzZSBpZiAoIGUud2hpY2ggPT0gODIgJiYgZS5jdHJsS2V5ICkge1xuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfVxuICB9KTtcblxuICB2YXIgZ3VpID0gd2luZG93LnJlcXVpcmUoJ253Lmd1aScpO1xuICB3aW4gPSBndWkuV2luZG93LmdldCgpO1xuICB2YXIgbmF0aXZlTWVudUJhciA9IG5ldyBndWkuTWVudSh7IHR5cGU6IFwibWVudWJhclwiIH0pO1xuICB0cnkge1xuICAgIG5hdGl2ZU1lbnVCYXIuY3JlYXRlTWFjQnVpbHRpbihcIlBhc3N3b3JkIFZhdWx0XCIpO1xuICAgIHdpbi5tZW51ID0gbmF0aXZlTWVudUJhcjtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmxvZyhleC5tZXNzYWdlKTtcbiAgfVxuXG4gICQoZG9jdW1lbnQpLm9uKCdyZWFkeScsIGZ1bmN0aW9uKCl7XG4gICAgcmVxdWlyZSgnLi9wYWdlcy9yb3V0ZXInKTtcbiAgICByZXF1aXJlKCcuL3BhZ2VzL3VzZScpLmluaXQoKTtcbiAgfSk7XG5cbn07XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi8uLi9zZXR0aW5ncycpO1xuXG5mdW5jdGlvbiBpbXBvcnRGaWxlKGZpbGUpIHtcbiAgc2V0dGluZ3MuYWRkVmF1bHQoZmlsZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbXBvcnQgOiBpbXBvcnRGaWxlXG59XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi9zZXR0aW5ncycpO1xuXG4kKHdpbmRvdykub24oJ2hhc2hjaGFuZ2UnLCB1cGRhdGVQYWdlKTtcblxuZnVuY3Rpb24gdXBkYXRlUGFnZSgpIHtcbiAgdmFyIHBhcnRzID0gd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgvIy8sJycpLnNwbGl0KCcvJyk7XG5cbiAgdmFyIGNvbmZpZyA9IHNldHRpbmdzLmdldCgpO1xuICB2YXIgcGFnZSA9IHBhcnRzWzBdO1xuXG4gIGlmKCBwYWdlID09PSAnJyApIHtcbiAgICBwYWdlID0gJ3VzZSc7XG4gIH1cblxuICAkKCcucGFnZScpLmhpZGUoKTtcbiAgdmFyIGVsZSA9ICQoJyMnK3BhZ2UpLnNob3coKTtcblxuICAkKCdsaVtyb2xlPVwicHJlc2VudGF0aW9uXCJdJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAkKCdhW3JvbGU9XCJ0YWJcIl1baHJlZj1cIiMnK3BhZ2UrJ1wiXScpLnBhcmVudCgpLmFkZENsYXNzKCdhY3RpdmUnKTtcblxuICBpZiggZWxlWzBdLm9uU2hvdyApIGVsZVswXS5vblNob3coKTtcblxuICBpZiggcGFnZSA9PSAnbWFuYWdlJyApIHtcbiAgICAkKCcuZWRpdC1lbGVtZW50JykuaGlkZSgpO1xuICAgIGlmKCBwYXJ0cy5sZW5ndGggPiAxICkge1xuICAgICAgaWYoIHBhcnRzWzFdID09ICdpbXBvcnQnICkgJCgnYXBwLWltcG9ydC12YXVsdCcpLnNob3coKTtcbiAgICAgIGVsc2UgJCgnYXBwLWNyZWF0ZS1uZXcnKS5zaG93KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJ2FwcC1jcmVhdGUtbmV3Jykuc2hvdygpO1xuICAgIH1cbiAgfVxuXG59XG5cbnVwZGF0ZVBhZ2UoKTtcbiIsInZhciBlbnRyeSA9IG51bGw7XG52YXIgaXNOZXcgPSBmYWxzZTtcbnZhciBlZGl0TmFtZSA9ICcnO1xudmFyIG90aGVyQ291bnQgPSAwO1xudmFyIHJvb3QgPSAnI2VkaXQtZW50cnktcGFzc3dvcmQnO1xuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24ob25TYXZlKSB7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwJykubW9kYWwoe1xuICAgIHNob3c6IGZhbHNlLFxuICAgIGJhY2tkcm9wOiAnc3RhdGljJ1xuICB9KTtcbiAgJCgnI2FkZC1lbnRyeS1idG4nKS5vbignY2xpY2snLCBhZGQpO1xuICAkKCcjZWRpdC1lbnRyeS1hZGQtZmllbGQtYnRuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICBhZGRGaWVsZCgpO1xuICB9KTtcblxuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZCcpLm9uKCdibHVyJywgdmVyaWZ5KTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtdmVyaWZ5Jykub24oJ2JsdXInLCB2ZXJpZnkpO1xuXG4gICQoJyNlZGl0LWVudHJ5LXNhdmUtYnRuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgaGFzRXJyb3IgPSB2ZXJpZnkoKTtcbiAgICBpZiggaGFzRXJyb3IgKSByZXR1cm47XG5cbiAgICB2YXIgZW50cnkgPSBnZXRFbnRyeSgpO1xuICAgIG9uU2F2ZSh7XG4gICAgICBlbnRyeTogZW50cnksXG4gICAgICBvcmlnaW5hbE5hbWUgOiBlZGl0TmFtZSxcbiAgICAgIGlzTmV3IDogaXNOZXdcbiAgICB9KTtcbiAgfSk7XG5cbiAgJCgnI2VkaXQtZW50cnktZGVsZXRlLWJ0bicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgaWYoICFjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gY29tcGxldGVseSByZW1vdmU6ICcrZWRpdE5hbWUrJz8nKSApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvblNhdmUoe1xuICAgICAgbmFtZSA6IGVkaXROYW1lLFxuICAgICAgcmVtb3ZlIDogdHJ1ZVxuICAgIH0pO1xuICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgJCgnI2VkaXQtZW50cnktcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xufTtcblxuZnVuY3Rpb24gYWRkKCkge1xuICByZXNldCgpO1xuICAkKCcjZWRpdC1lbnRyeS1kZWxldGUtYnRuJykuaGlkZSgpO1xuXG4gIG90aGVyQ291bnQgPSAwO1xuICBpc05ldyA9IHRydWU7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwLXRpdGxlJykuaHRtbCgnQWRkIEVudHJ5Jyk7XG4gIHNob3coKTtcbn1cblxubW9kdWxlLmV4cG9ydHMuZWRpdCA9IGZ1bmN0aW9uKGVudHJ5KSB7XG4gIHJlc2V0KCk7XG5cbiAgZWRpdE5hbWUgPSBlbnRyeS5uYW1lO1xuICBvdGhlckNvdW50ID0gMDtcbiAgaXNOZXcgPSBmYWxzZTtcblxuICAkKCcjZWRpdC1lbnRyeS1kZWxldGUtYnRuJykuc2hvdygpO1xuICAkKCcjZWRpdC1lbnRyeS1wb3B1cC10aXRsZScpLmh0bWwoJ0VkaXQgRW50cnknKTtcblxuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC1uYW1lJykudmFsKGVudHJ5Lm5hbWUpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC1kZXNjcmlwdGlvbicpLnZhbChlbnRyeS5kZXNjcmlwdGlvbiB8fCAnJyk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLXVzZXJuYW1lJykudmFsKGVudHJ5LnVzZXJuYW1lIHx8ICcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQnKS52YWwoZW50cnkucGFzc3dvcmQpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC12ZXJpZnknKS52YWwoZW50cnkucGFzc3dvcmQpO1xuXG4gIGZvciggdmFyIGtleSBpbiBlbnRyeSApIHtcbiAgICBpZigga2V5ID09ICduYW1lJyB8fCBrZXkgPT0gJ3Bhc3N3b3JkJyB8fCBrZXkgPT0gJ2Rlc2NyaXB0aW9uJyB8fCBrZXkgPT0gJ3VzZXJuYW1lJyApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGFkZEZpZWxkKGtleSwgZW50cnlba2V5XSk7XG4gIH1cblxuICBzaG93KCk7XG59O1xuXG5mdW5jdGlvbiBhZGRGaWVsZChpdGVtLCB2YWx1ZSkge1xuICAgIHZhciBodG1sID1cbiAgICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy1vdXRlclwiPicrXG4gICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb2wtc20tMyBjb250cm9sLWxhYmVsXCI+JytcbiAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBwbGFjZWhvbGRlcj1cIkZpZWxkIE5hbWVcIiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctbmFtZVwiIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiLz4nK1xuICAgICAgICAnPC9sYWJlbD4nK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbC1zbS05XCI+JytcbiAgICAgICAgICAnPGFwcC1wYXNzd29yZC1pbnB1dCBpbmRleD1cIicrb3RoZXJDb3VudCsnXCI+PC9hcHAtcGFzc3dvcmQtaW5wdXQ+JytcbiAgICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBpbmRleD1cIicrb3RoZXJDb3VudCsnXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT48L2E+JytcbiAgICAgICAgJzwvZGl2PicrXG4gICAgICAnPC9kaXY+JztcblxuICAgIHZhciBlbGUgPSAkKGh0bWwpO1xuICAgIC8vZWxlLmZpbmQoJ2lucHV0Jykub24oJ2JsdXInLCB2ZXJpZnkpO1xuICAgIGVsZS5maW5kKCdhJykub24oJ2NsaWNrJyxmdW5jdGlvbigpIHtcbiAgICAgIGlmKCBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlOiAnKyQoJyRlZGl0LWVudHJ5LXBhc3N3b3JkLScrJCh0aGlzKS5hdHRyKCdpbmRleCcpKyctbmFtZScpLnZhbCgpKSApIHtcbiAgICAgICAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtJyskKHRoaXMpLmF0dHIoJ2luZGV4JykrJy1vdXRlcicpLnJlbW92ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYoIGl0ZW0gIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgZWxlLmZpbmQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW5hbWUnKS52YWwoaXRlbSk7XG4gICAgICBlbGUuZmluZCgnYXBwLXBhc3N3b3JkLWlucHV0W2luZGV4PVwiJytvdGhlckNvdW50KydcIl0nKS52YWwodmFsdWUpO1xuICAgIH1cblxuICAgICQoJyNlZGl0LWVudHJ5LW90aGVyLWZpZWxkcycpLmFwcGVuZChlbGUpO1xuICAgIG90aGVyQ291bnQrKztcbi8qICB2YXIgaHRtbCA9XG4gICAgJzxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCIgaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW91dGVyXCI+JytcbiAgICAgICc8bGFiZWwgY2xhc3M9XCJjb2wtc20tMyBjb250cm9sLWxhYmVsXCI+JytcbiAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgcGxhY2Vob2xkZXI9XCJGaWVsZCBOYW1lXCIgaWQ9XCJlZGl0LWVudHJ5LXBhc3N3b3JkLScrb3RoZXJDb3VudCsnLW5hbWVcIiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIi8+JytcbiAgICAgICc8L2xhYmVsPicrXG4gICAgICAnPGRpdiBjbGFzcz1cImNvbC1zbS05XCI+JytcbiAgICAgICAgJzxpbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGlkPVwiZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJ1wiIHBsYWNlaG9sZGVyPVwiUGFzc3dvcmRcIiAvPicrXG4gICAgICAgICc8aW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctdmVyaWZ5XCIgcGxhY2Vob2xkZXI9XCJWZXJpZnkgUGFzc3dvcmRcIiAvPicrXG4gICAgICAgICc8c3BhbiBpZD1cImVkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctbXNnXCI+PC9zcGFuPicrXG4gICAgICAgICc8YSBjbGFzcz1cImJ0biBidG4tbGlua1wiIGluZGV4PVwiJytvdGhlckNvdW50KydcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoXCI+PC9pPjwvYT4nK1xuICAgICAgJzwvZGl2PicrXG4gICAgJzwvZGl2Pic7XG5cbiAgdmFyIGVsZSA9ICQoaHRtbCk7XG4gIGVsZS5maW5kKCdpbnB1dCcpLm9uKCdibHVyJywgdmVyaWZ5KTtcbiAgZWxlLmZpbmQoJ2EnKS5vbignY2xpY2snLGZ1bmN0aW9uKCkge1xuICAgIGlmKCBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlOiAnKyQoJyRlZGl0LWVudHJ5LXBhc3N3b3JkLScrJCh0aGlzKS5hdHRyKCdpbmRleCcpKyctbmFtZScpLnZhbCgpKSApIHtcbiAgICAgICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLScrJCh0aGlzKS5hdHRyKCdpbmRleCcpKyctb3V0ZXInKS5yZW1vdmUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmKCBpdGVtICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCApIHtcbiAgICBlbGUuZmluZCgnI2VkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KyctbmFtZScpLnZhbChpdGVtKTtcbiAgICBlbGUuZmluZCgnI2VkaXQtZW50cnktcGFzc3dvcmQtJytvdGhlckNvdW50KS52YWwodmFsdWUpO1xuICAgIGVsZS5maW5kKCcjZWRpdC1lbnRyeS1wYXNzd29yZC0nK290aGVyQ291bnQrJy12ZXJpZnknKS52YWwodmFsdWUpO1xuICB9XG5cbiAgJCgnI2VkaXQtZW50cnktb3RoZXItZmllbGRzJykuYXBwZW5kKGVsZSk7XG4gIG90aGVyQ291bnQrKzsqL1xufVxuXG5mdW5jdGlvbiB2ZXJpZnkoKSB7XG4gIHZhciBlcnJvcnMgPSBbXSwgaTtcbiAgZXJyb3JzLnB1c2godmVyaWZ5SXRlbSgpKTtcbiAgZm9yKCBpID0gMDsgaSA8IG90aGVyQ291bnQ7IGkrKyApIHtcbiAgICBlcnJvcnMucHVzaCh2ZXJpZnlJdGVtKGkpKTtcbiAgfVxuXG4gIGZvciggaSA9IDA7IGkgPCBlcnJvcnMubGVuZ3RoOyBpKysgKSB7XG4gICAgaWYoIGVycm9yc1tpXSApIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXRFbnRyeSgpIHtcbiAgdmFyIGVudHJ5ID0ge1xuICAgIG5hbWUgOiAkKHJvb3QrJy1uYW1lJykudmFsKCksXG4gICAgZGVzY3JpcHRpb24gOiAkKHJvb3QrJy1kZXNjcmlwdGlvbicpLnZhbCgpLFxuICAgIHVzZXJuYW1lIDogJChyb290KyctdXNlcm5hbWUnKS52YWwoKSxcbiAgICBwYXNzd29yZCA6ICQocm9vdCkudmFsKClcbiAgfTtcblxuICBmb3IoIGkgPSAwOyBpIDwgb3RoZXJDb3VudDsgaSsrICkge1xuICAgIHZhciBuYW1lID0gJChyb290KyctJytpKyctbmFtZScpLnZhbCgpO1xuICAgIHZhciBwYXNzID0gJCgnYXBwLXBhc3N3b3JkLWlucHV0W2luZGV4PVwiJytvdGhlckNvdW50KydcIl0nKS52YWwoKTtcblxuICAgIGlmKCBuYW1lID09PSB1bmRlZmluZWQgfHwgcGFzcyA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmKCBuYW1lID09ICduYW1lJyB8fCBuYW1lID09ICdwYXNzd29yZCcgfHwgbmFtZSA9PSAnZGVzY3JpcHRpb24nIHx8IG5hbWUgPT0gJ3VzZXJuYW1lJyApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBlbnRyeVtuYW1lXSA9IHBhc3M7XG4gIH1cblxuICByZXR1cm4gZW50cnk7XG59XG5cbmZ1bmN0aW9uIHZlcmlmeUl0ZW0oaW5kZXgpIHtcbiAgdmFyIGlzQ3VzdG9tID0gZmFsc2U7XG4gIHZhciBxdWVyeSA9IHJvb3Q7XG5cbiAgaWYoIGluZGV4ICE9PSB1bmRlZmluZWQgKSB7XG4gICAgcXVlcnkgKz0gJy0nK2luZGV4O1xuICAgIGlzQ3VzdG9tID0gdHJ1ZTtcbiAgfVxuXG4gIHZhciBuYW1lID0gJChxdWVyeSsnLW5hbWUnKS52YWwoKTtcbiAgdmFyIHBhc3MgPSAkKHF1ZXJ5KS52YWwoKTtcblxuICBpZiggbmFtZSA9PT0gdW5kZWZpbmVkIHx8IHBhc3MgPT09IHVuZGVmaW5lZCApIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIGl0ZW0gaGFzIGJlZW4gZGVsZXRlZFxuICB9XG5cbiAgdmFyIHZlcmlmeVBhc3MgPSAkKHF1ZXJ5KyctdmVyaWZ5JykudmFsKCk7XG4gIHZhciBtc2cgPSAkKHF1ZXJ5KyctbXNnJyk7XG5cbiAgaWYoIHBhc3MubGVuZ3RoID09PSAwICkge1xuICAgIGVycm9yKG1zZywgJ1lvdSBkaWQgbm90IHByb3ZpZGUgYSBwYXNzd29yZCcpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYoIHZlcmlmeVBhc3MgIT0gcGFzcyApIHtcbiAgICBlcnJvcihtc2csICdZb3VyIGl0ZW1zIGRvIG5vdCBtYXRjaCcpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYoIG5hbWUubGVuZ3RoID09PSAwICkge1xuICAgIGVycm9yKG1zZywgJ1lvdSBtdXN0IHByb3ZpZGUgYSBuYW1lJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiggKG5hbWUgPT0gJ25hbWUnIHx8IG5hbWUgPT0gJ3Bhc3N3b3JkJyB8fCBuYW1lID09ICdkZXNjcmlwdGlvbicgfHwgbmFtZSA9PSAndXNlcm5hbWUnKSAmJiBpc0N1c3RvbSApIHtcbiAgICBlcnJvcihtc2csICdJbnZhbGlkIG5hbWUnKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG1zZy5odG1sKCc8c3BhbiBjbGFzcz1cInRleHQgdGV4dC1zdWNjZXNzXCI+PGkgY2xhc3M9XCJmYSBmYS1jaGVja1wiPjwvaT48L3NwYW4+Jyk7XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBlcnJvcihlbGUsIG1zZykge1xuICBlbGUuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiPicrbXNnKyc8L2Rpdj4nKTtcbn1cblxuZnVuY3Rpb24gcmVzZXQoKSB7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLW5hbWUnKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC1kZXNjcmlwdGlvbicpLnZhbCgnJyk7XG4gICQoJyNlZGl0LWVudHJ5LXBhc3N3b3JkLXVzZXJuYW1lJykudmFsKCcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQnKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1wYXNzd29yZC12ZXJpZnknKS52YWwoJycpO1xuICAkKCcjZWRpdC1lbnRyeS1vdGhlci1maWVsZHMnKS5odG1sKCcnKTtcbiAgJCgnI2VkaXQtZW50cnktcGFzc3dvcmQtbXNnJykuaHRtbCgnJyk7XG59XG5cbmZ1bmN0aW9uIHNob3coKSB7XG4gICQoJyNlZGl0LWVudHJ5LXBvcHVwJykubW9kYWwoJ3Nob3cnKTtcbn1cbiIsInZhciBmcyA9IE5PREUuZnM7XG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi8uLi9zZXR0aW5ncycpO1xudmFyIGNyeXB0byA9IHJlcXVpcmUoJy4uLy4uL2NyeXB0bycpO1xudmFyIHNlYXJjaCA9IHJlcXVpcmUoJy4vc2VhcmNoJyk7XG52YXIgZWRpdCA9IHJlcXVpcmUoJy4vZWRpdCcpO1xudmFyIGNvbmZpZztcblxudmFyIGN1cnJlbnRWYXVsdCA9IHtcbiAgZmlsZSA6ICcnLFxuICBkYXRhIDogbnVsbFxufTtcblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAkKCcjdXNlJylbMF0ub25TaG93ID0gb25TaG93O1xuXG4gICQoJyN1bmxvY2stcG9wdXAnKS5tb2RhbCh7c2hvdzogZmFsc2V9KTtcblxuICAkKCcjdW5sb2NrLXNob3ctYnRuJykub24oJ2NsaWNrJywgc2hvd1VubG9ja1BvcHVwKTtcbiAgJCgnI3VubG9jay1idG4nKS5vbignY2xpY2snLCBhdHRlbXB0VW5sb2NrKTtcblxuICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykub24oJ2tleXVwJywgZnVuY3Rpb24oZSl7XG4gICAgaWYoIGUud2hpY2ggPT0gMTMgKSBhdHRlbXB0VW5sb2NrKCk7XG4gIH0pO1xuICAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpe1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gIH0pO1xuXG4gICQoJyN2YXVsdC1zZWxlY3QnKS5vbignY2hhbmdlJywgZnVuY3Rpb24oKXtcbiAgICBjdXJyZW50VmF1bHQuZGF0YSA9IG51bGw7XG4gICAgY3VycmVudFZhdWx0LmxvY2F0aW9uID0gJyc7XG4gICAgVmF1bHQuYWN0aXZlID0gJCh0aGlzKS52YWwoKTtcbiAgICByZXNldFVpKCk7XG4gIH0pO1xuXG4gIHNlYXJjaC5pbml0KGVkaXQpO1xuICBlZGl0LmluaXQob25TYXZlKTtcblxuICBzZXR0aW5ncy5vbigndmF1bHRzLXVwZGF0ZWQnLCBmdW5jdGlvbih2YXVsdHMpe1xuICAgIGNyZWF0ZVNlbGVjdG9yKCk7XG4gIH0pO1xuXG4gIG9uU2hvdygpO1xuXG4gIC8vIGF1dG8gc2hvdyB1bmxvY2sgaWYgd2UgaGF2ZSBhbiBhY3RpdmUgdmF1bHRcbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgIGlmKCBWYXVsdC5hY3RpdmUgKSBzaG93VW5sb2NrUG9wdXAoKTtcbiAgfSwgMjAwKTtcbn07XG5cbmZ1bmN0aW9uIHJlc2V0VWkoKSB7XG4gICQoJyN1c2UtbWVzc2FnZScpLmh0bWwoJycpO1xuICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCcnKTtcbiAgJCgnI2ZpbmQtcGFzc3dvcmQnKS5oaWRlKCk7XG4gICQoJyN1bmxvY2stc2hvdy1idG4nKS5zaG93KCk7XG59XG5cbmZ1bmN0aW9uIHNob3dVbmxvY2tQb3B1cCgpIHtcbiAgJCgnI3VubG9jay1wb3B1cC1maWxlbmFtZScpLmh0bWwoVmF1bHQuYWN0aXZlKTtcbiAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCcnKTtcbiAgJCgnI3VubG9jay1wb3B1cCcpLm1vZGFsKCdzaG93Jyk7XG4gICQoJyN1bmxvY2stcG9wdXAtcGFzc3dvcmQnKS52YWwoJycpO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykuZm9jdXMoKTtcbiAgfSwgMjUwKTtcbn1cblxuZnVuY3Rpb24gb25TYXZlKGluZm8pIHtcbiAgdmFyIGksIGl0ZW07XG5cbiAgLy8gc2ltcGxlIGRlbGV0ZVxuICBpZiggaW5mby5yZW1vdmUgKSB7XG4gICAgZm9yKCBpID0gMDsgaSA8IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLmxlbmd0aDsgaSsrICkge1xuICAgICAgaWYoIGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zW2ldLm5hbWUgPT0gaW5mby5uYW1lICkge1xuICAgICAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2F2ZSgpO1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gICAgZWRpdC5oaWRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8ganVzdCBhIHNpbXBsZSBlZGl0XG4gIGlmKCBpbmZvLm9yaWdpbmFsTmFtZSA9PSBpbmZvLmVudHJ5Lm5hbWUgKSB7XG4gICAgdXBkYXRlRW50cnkoaW5mby5lbnRyeSk7XG4gICAgc2F2ZSgpO1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gICAgZWRpdC5oaWRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGlzT3ZlcndyaXRlID0gZmFsc2U7XG4gIGZvciggaSA9IDA7IGkgPCBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICBpdGVtID0gY3VycmVudFZhdWx0LmRhdGEuaXRlbXNbaV07XG4gICAgaWYoIGl0ZW0ubmFtZSA9PSBpbmZvLmVudHJ5Lm5hbWUgKSB7XG4gICAgICBpc092ZXJ3cml0ZSA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiggaXNPdmVyd3JpdGUgJiYgIWNvbmZpcm0oJ1wiJytpbmZvLmVudHJ5KydcIiBhbHJlYWR5IGV4aXN0cywgYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIG92ZXJ3cml0ZT8hJykgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYoIGluZm8uaXNOZXcgKSB7XG4gICAgY3VycmVudFZhdWx0LmRhdGEuaXRlbXMucHVzaChpbmZvLmVudHJ5KTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVFbnRyeShpbmZvLmVudHJ5KTtcbiAgfVxuXG4gIHNhdmUoKTtcbiAgc2VhcmNoLmdvKGN1cnJlbnRWYXVsdC5kYXRhKTtcbiAgZWRpdC5oaWRlKCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUVudHJ5KGVudHJ5KSB7XG4gIGZvciggaSA9IDA7IGkgPCBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICBpdGVtID0gY3VycmVudFZhdWx0LmRhdGEuaXRlbXNbaV07XG4gICAgaWYoIGl0ZW0ubmFtZSA9PSBlbnRyeS5uYW1lICkge1xuICAgICAgY3VycmVudFZhdWx0LmRhdGEuaXRlbXNbaV0gPSBlbnRyeTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2F2ZSgpIHtcbiAgdmFyIGRhdGEgPSBjcnlwdG8uZW5jcnlwdChKU09OLnN0cmluZ2lmeShjdXJyZW50VmF1bHQuZGF0YSkpO1xuICBmcy53cml0ZUZpbGVTeW5jKGN1cnJlbnRWYXVsdC5maWxlLCBkYXRhKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2VsZWN0b3IoKSB7XG4gIGlmKCAhY29uZmlnLnZhdWx0cyApIHJldHVybjtcblxuICB2YXIgaHRtbCA9ICcnO1xuICBmb3IoIHZhciBpID0gMDsgaSA8IGNvbmZpZy52YXVsdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIicrY29uZmlnLnZhdWx0c1tpXSsnXCIgJysoY29uZmlnLnZhdWx0c1tpXSA9PSBWYXVsdC5hY3RpdmUgPyAnc2VsZWN0ZWQnIDogJycpKyc+Jytjb25maWcudmF1bHRzW2ldKyc8L29wdGlvbj4nO1xuICB9XG4gICQoJyN2YXVsdC1zZWxlY3QnKS5odG1sKGh0bWwpO1xufVxuXG5mdW5jdGlvbiBvblNob3coKSB7XG4gIGNvbmZpZyA9IHNldHRpbmdzLmdldCgpO1xuICByZXNldFVpKCk7XG5cbiAgaWYoIFZhdWx0LmFjdGl2ZSApIHtcbiAgICBvblZhdWx0U2V0KCk7XG4gIH0gZWxzZSBpZiAoIGNvbmZpZy52YXVsdHMgJiYgY29uZmlnLnZhdWx0cy5sZW5ndGggPiAwICkge1xuICAgIFZhdWx0LmFjdGl2ZSA9IGNvbmZpZy52YXVsdHNbMF07XG4gICAgb25WYXVsdFNldCgpO1xuICB9IGVsc2Uge1xuICAgIHdhcm4oJ1lvdSBoYXZlIG5vIHZhdWx0cy4gIFlvdSBtdXN0IGZpcnN0IGNyZWF0ZSBvbmUnKTtcbiAgfVxuXG4gIGNyZWF0ZVNlbGVjdG9yKCk7XG59XG5cbmZ1bmN0aW9uIG9uVmF1bHRTZXQoKSB7XG4gIGlmKCBWYXVsdC5hY3RpdmUgPT09IGN1cnJlbnRWYXVsdC5maWxlICYmIGN1cnJlbnRWYXVsdC5kYXRhICE9PSBudWxsICkge1xuICAgICQoJyN1bmxvY2stc2hvdy1idG4nKS5oaWRlKCk7XG4gICAgJCgnI2ZpbmQtcGFzc3dvcmQnKS5zaG93KCk7XG4gICAgJCgnI2ZpbmQtcGFzc3dvcmQtaW5wdXQnKS5mb2N1cygpO1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSwgJycpO1xuICB9IGVsc2Uge1xuICAgICQoJyN1bmxvY2stc2hvdy1idG4nKS5zaG93KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXR0ZW1wdFVubG9jaygpIHtcbiAgY3VycmVudFZhdWx0LmRhdGEgPSBudWxsO1xuICBjcnlwdG8uc2V0UGFzc3dvcmQoJCgnI3VubG9jay1wb3B1cC1wYXNzd29yZCcpLnZhbCgpKTtcbiAgdmFyIGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoVmF1bHQuYWN0aXZlLCAndXRmOCcpO1xuXG4gIHRyeSB7XG4gICAgZGF0YSA9IEpTT04ucGFyc2UoY3J5cHRvLmRlY3J5cHQoZGF0YSkpO1xuICB9IGNhdGNoKGUpIHtcbiAgICAkKCcjdmF1bHQtcG9wdXAtbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIj5JbnZhbGlkIFBhc3N3b3JkPC9kaXY+Jyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtc3VjY2Vzc1wiPlN1Y2Nlc3MhPC9kaXY+Jyk7XG5cblxuICBjdXJyZW50VmF1bHQuZGF0YSA9IGRhdGE7XG4gIGN1cnJlbnRWYXVsdC5maWxlID0gVmF1bHQuYWN0aXZlO1xuICBvblZhdWx0U2V0KCk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAkKCcjdW5sb2NrLXBvcHVwJykubW9kYWwoJ2hpZGUnKTtcbiAgfSwgNTAwKTtcbn1cblxuZnVuY3Rpb24gd2Fybihtc2cpIHtcbiAgaWYoICFtc2cgKSAkKCd1c2UtbWVzc2FnZScpLmh0bWwoJycpO1xuICBlbHNlICQoJ3VzZS1tZXNzYWdlJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXdhcm5cIj4nK21zZysnPC9kaXY+Jyk7XG59XG4iLCJ2YXIgZ3VpID0gd2luZG93LnJlcXVpcmUoJ253Lmd1aScpO1xudmFyIGNsaXBib2FyZCA9IGd1aS5DbGlwYm9hcmQuZ2V0KCk7XG5cbnZhciBjdXJyZW50ID0gW10sIGN1cnJlbnREYXRhLCBjdXJyZW50SXRlbXM7XG52YXIgZWRpdE1vZHVsZTtcblxubW9kdWxlLmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKGVkaXQpIHtcbiAgZWRpdE1vZHVsZSA9IGVkaXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5nbyA9IGZ1bmN0aW9uKGRhdGEsIHR4dCkge1xuICBpZiggIWRhdGEuaXRlbXMgKSByZXR1cm47XG4gIGN1cnJlbnREYXRhID0gZGF0YS5pdGVtcztcblxuICB2YXIgdGV4dCA9IHR4dCB8fCAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLnZhbCgpO1xuICB2YXIgcmUgPSBuZXcgUmVnRXhwKCcuKicrdGV4dCsnLionLCAnaScpO1xuXG4gIHZhciByZXN1bHRzID0gW107XG4gIGRhdGEuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICB2YXIgbmFtZSA9IGl0ZW0ubmFtZSB8fCAnJztcbiAgICB2YXIgZGVzY3JpcHRpb24gPSBpdGVtLmRlc2NyaXB0aW9uIHx8ICcnO1xuICAgIGlmKCBuYW1lLm1hdGNoKHJlKSB8fCBkZXNjcmlwdGlvbi5tYXRjaChyZSkgKSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlbSk7XG4gICAgfVxuICB9KTtcblxuICByZW5kZXJSZXN1bHRzKHJlc3VsdHMpO1xufTtcblxuXG5cbmZ1bmN0aW9uIHJlbmRlclJlc3VsdHMoaXRlbXMpIHtcbiAgaWYoIGl0ZW1zLmxlbmd0aCA9PT0gMCApIHtcbiAgICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FybmluZ1wiPk5vIG1hdGNoZXMgZm91bmQ8L2Rpdj4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaHRtbCA9ICc8ZGl2IGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCI+JztcbiAgY3VycmVudCA9IFtdO1xuICBjdXJyZW50SXRlbXMgPSBpdGVtcztcblxuICB2YXIgcm93ID0gW107XG5cbiAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICByb3cgPSBbXTtcblxuICAgIGh0bWwgKz1cbiAgICAgICc8ZGl2IGNsYXNzPVwid2VsbFwiPjxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCI+JytcbiAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbC1zbS0zIGNvbnRyb2wtbGFiZWxcIj48aDU+JytpdGVtLm5hbWUrJzwvaDU+PC9sYWJlbD4nK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbC1zbS03XCI+JytcbiAgICAgICAgICAnPGRpdiBjbGFzcz1cIicrKGl0ZW0uZGVzY3JpcHRpb24gPyAnaGVscC1ibG9jaycgOiAnJykrJ1wiPicrXG4gICAgICAgICAgICAnPGk+JysoaXRlbS5kZXNjcmlwdGlvbiB8fCAnJykrJzwvaT4nK1xuICAgICAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCIgbmFtZT1cIkVkaXRcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJ1wiPjxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPjwvYT4nK1xuICAgICAgICAgICc8L2Rpdj4nK1xuICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZVwiPic7XG5cbiAgICBpZiggaXRlbS51c2VybmFtZSApIHtcbiAgICAgIGh0bWwgKz0gJzx0cj4nK1xuICAgICAgICAnPHRkIHN0eWxlPVwid2lkdGg6NjUlXCI+VXNlcm5hbWU8L3RkPicrXG4gICAgICAgICc8dGQ+JytcbiAgICAgICAgICBpdGVtLnVzZXJuYW1lICtcbiAgICAgICAgJzwvdGQ+JytcbiAgICAgICc8L3RyPic7XG4gICAgfVxuXG4gICAgZm9yKCB2YXIga2V5IGluIGl0ZW0gKSB7XG4gICAgICBpZigga2V5ID09ICduYW1lJyB8fCBrZXkgPT0gJ2Rlc2NyaXB0aW9uJyB8fCBrZXkgPT0gJ3VzZXJuYW1lJyApIGNvbnRpbnVlO1xuXG4gICAgICBodG1sICs9XG4gICAgICAgICc8dHI+JytcbiAgICAgICAgICAnPHRkIHN0eWxlPVwid2lkdGg6NjUlXCI+Jysoa2V5ID09PSAncGFzc3dvcmQnID8gJ1Bhc3N3b3JkJyA6IGtleSkrJzwvdGQ+JytcbiAgICAgICAgICAnPHRkPicrXG4gICAgICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBuYW1lPVwiQ29weVwiIGluZGV4PVwiJytjdXJyZW50Lmxlbmd0aCsnLScrcm93Lmxlbmd0aCsnXCI+PGkgY2xhc3M9XCJmYSBmYS1jb3B5XCI+PC9pPjwvYT4nK1xuICAgICAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCIgbmFtZT1cIlNob3dcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJy0nK3Jvdy5sZW5ndGgrJ1wiPjxpIGNsYXNzPVwiZmEgZmEtZXllXCI+PC9pPjwvYT4nK1xuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIHNob3dQYXNzXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJy0nK3Jvdy5sZW5ndGgrJ1wiIC8+JytcbiAgICAgICAgICAnPC90ZD4nK1xuICAgICAgICAnPC90cj4nO1xuICAgICAgcm93LnB1c2goaXRlbVtrZXldKTtcbiAgICB9XG5cbiAgICBjdXJyZW50LnB1c2gocm93KTtcbiAgICBodG1sICs9ICc8L3RhYmxlPjwvZGl2PjwvZGl2PjwvZGl2Pic7XG4gIH0pO1xuXG4gIHZhciByZXN1bHRzID0gJCgnI3VzZS1yZXN1bHRzJykuaHRtbChodG1sKyc8L2Rpdj4nKTtcblxuICByZXN1bHRzLmZpbmQoJ2FbbmFtZT1cIkNvcHlcIl0nKS5vbignY2xpY2snLCBjb3B5KTtcbiAgcmVzdWx0cy5maW5kKCdhW25hbWU9XCJTaG93XCJdJykub24oJ2NsaWNrJywgc2hvdyk7XG4gIHJlc3VsdHMuZmluZCgnYVtuYW1lPVwiRWRpdFwiXScpLm9uKCdjbGljaycsIGVkaXQpO1xufVxuXG5mdW5jdGlvbiBzaG93KGUpIHtcbiAgdmFyIGVsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgdmFyIGlkID0gZWxlLmF0dHIoJ2luZGV4Jyk7XG5cbiAgaWYoIGVsZS5maW5kKCdpJykuaGFzQ2xhc3MoJ2ZhLWV5ZScpICkge1xuICAgIGlkID0gaWQuc3BsaXQoJy0nKTtcbiAgICB2YXIgcm93ID0gcGFyc2VJbnQoaWRbMF0pLCBjb2wgPSBwYXJzZUludChpZFsxXSk7XG4gICAgZWxlLnBhcmVudCgpLmZpbmQoJy5zaG93UGFzcycpLnZhbChjdXJyZW50W3Jvd11bY29sXSkuc2hvdygpLnNlbGVjdCgpO1xuICAgIGVsZS5maW5kKCdpJykucmVtb3ZlQ2xhc3MoJ2ZhLWV5ZScpLmFkZENsYXNzKCdmYS1leWUtc2xhc2gnKTtcbiAgfSBlbHNlIHtcbiAgICBlbGUucGFyZW50KCkuZmluZCgnLnNob3dQYXNzJykuaHRtbCgnJykuaGlkZSgpO1xuICAgIGVsZS5maW5kKCdpJykucmVtb3ZlQ2xhc3MoJ2ZhLWV5ZS1zbGFzaCcpLmFkZENsYXNzKCdmYS1leWUnKTtcbiAgfVxufVxuXG52YXIgaGlkZVRpbWVyID0gLTE7XG5mdW5jdGlvbiBjb3B5KGUpIHtcbiAgdmFyIGVsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgdmFyIGlkID0gZWxlLmF0dHIoJ2luZGV4Jyk7XG4gIGlkID0gaWQuc3BsaXQoJy0nKTtcbiAgdmFyIHJvdyA9IHBhcnNlSW50KGlkWzBdKSwgY29sID0gcGFyc2VJbnQoaWRbMV0pO1xuXG4gIGNsaXBib2FyZC5zZXQoY3VycmVudFtyb3ddW2NvbF0sICd0ZXh0Jyk7XG5cbiAgJCgnI3RvYXN0JykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIj5Db3BpZWQgdG8gY2xpcGJvYXJkPC9kaXY+Jykuc2hvdygpO1xuXG4gIGlmKCBoaWRlVGltZXIgIT0gLTEgKSBjbGVhclRpbWVvdXQoaGlkZVRpbWVyKTtcbiAgaGlkZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgIGNsZWFyVGltZW91dChoaWRlVGltZXIpO1xuICAgICQoJyN0b2FzdCcpLmhpZGUoKTtcbiAgfSwgMjAwMCk7XG59XG5cbmZ1bmN0aW9uIGVkaXQoZSkge1xuICB2YXIgZWxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICB2YXIgcm93ID0gcGFyc2VJbnQoZWxlLmF0dHIoJ2luZGV4JykpO1xuICBlZGl0TW9kdWxlLmVkaXQoY3VycmVudEl0ZW1zW3Jvd10pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YXVsdCwgdHh0KSB7XG4gIGlmKCAhdmF1bHQuaXRlbXMgKSByZXR1cm4gW107XG5cbiAgdmFyIHJlID0gbmV3IFJlZ0V4cCgnLionK3R4dCsnLionLCAnaScpO1xuXG4gIHZhciByZXN1bHRzID0gW107XG4gIGRhdGEuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICB2YXIgbmFtZSA9IGl0ZW0ubmFtZSB8fCAnJztcbiAgICB2YXIgZGVzY3JpcHRpb24gPSBpdGVtLmRlc2NyaXB0aW9uIHx8ICcnO1xuICAgIGlmKCBuYW1lLm1hdGNoKHJlKSB8fCBkZXNjcmlwdGlvbi5tYXRjaChyZSkgKSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlbSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzdWx0cztcbn07XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuZXZlbnRzID0gbmV3IGV2ZW50cygpO1xuZXZlbnRzLnNldE1heExpc3RlbmVycygxMDAwKTtcblxudmFyIGZzID0gTk9ERS5mcztcblxudmFyIEZJTEVOQU1FID0gJy5ud1Bhc3N3b3JkVmF1bHQnO1xuXG52YXIgcGF0aCA9IHV0aWxzLmdldFVzZXJIb21lKCkrJy8nK0ZJTEVOQU1FO1xuaWYoICFmcy5leGlzdHNTeW5jKHBhdGgpICkge1xuICBmcy53cml0ZUZpbGVTeW5jKHBhdGgsICd7fScpO1xufVxuXG52YXIgc2V0dGluZ3MgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLCAndXRmLTgnKSk7XG5cbmZ1bmN0aW9uIGdldCgpIHtcbiAgcmV0dXJuIHNldHRpbmdzO1xufVxuXG5mdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICBzZXR0aW5nc1trZXldID0gdmFsdWU7XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpKTtcbn1cblxuZnVuY3Rpb24gYWRkVmF1bHQobG9jYXRpb24pIHtcbiAgaWYoICFzZXR0aW5ncy52YXVsdHMgKSBjb25maWcudmF1bHRzID0gW107XG5cbiAgaWYoIHNldHRpbmdzLnZhdWx0cy5pbmRleE9mKGxvY2F0aW9uKSA+IC0xICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHNldHRpbmdzLnZhdWx0cy5wdXNoKGxvY2F0aW9uKTtcblxuICBzZXQoJ3ZhdWx0cycsIHNldHRpbmdzLnZhdWx0cyk7XG5cbiAgZXZlbnRzLmVtaXQoJ3ZhdWx0cy11cGRhdGVkJywgc2V0dGluZ3MudmF1bHRzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldCA6IGdldCxcbiAgc2V0IDogc2V0LFxuICBhZGRWYXVsdCA6IGFkZFZhdWx0LFxuICBvbiA6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcil7XG4gICAgZXZlbnRzLm9uKGV2ZW50LCBsaXN0ZW5lcik7XG4gIH1cbn07XG4iLCJcbm1vZHVsZS5leHBvcnRzLmdldFVzZXJIb21lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB3aW5kb3cucHJvY2Vzcy5lbnZbKHdpbmRvdy5wcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMicpID8gJ1VTRVJQUk9GSUxFJyA6ICdIT01FJ107XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
