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

},{"../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/index.js":[function(require,module,exports){
var fs = NODE.fs;
var settings = require('../../settings');
var crypto = require('../../crypto');
var search = require('./search');
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
    return;
  }

  // just a simple edit
  if( info.originalName == info.entry.name ) {
    updateEntry(info.entry);
    save();
    search.go(currentVault.data);
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

},{"../../crypto":"/Users/jrmerz/dev/personal/nw-password-vault/lib/crypto/index.js","../../settings":"/Users/jrmerz/dev/personal/nw-password-vault/lib/settings/index.js","./search":"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js"}],"/Users/jrmerz/dev/personal/nw-password-vault/lib/pages/use/search.js":[function(require,module,exports){
var gui = window.require('nw.gui');
var clipboard = gui.Clipboard.get();

var current = [], currentData, currentItems;


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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY3J5cHRvL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibGliL2luaXQuanMiLCJsaWIvcGFnZXMvbWFuYWdlL2ltcG9ydC5qcyIsImxpYi9wYWdlcy9yb3V0ZXIuanMiLCJsaWIvcGFnZXMvdXNlL2luZGV4LmpzIiwibGliL3BhZ2VzL3VzZS9zZWFyY2guanMiLCJsaWIvc2VhcmNoL2luZGV4LmpzIiwibGliL3NldHRpbmdzL2luZGV4LmpzIiwibGliL3V0aWxzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGNyeXB0byA9IE5PREUuY3J5cHRvLFxuICAgIGFsZ29yaXRobSA9ICdhZXMtMjU2LWN0cicsXG4gICAgcGFzc3dvcmQgPSAnJztcblxubW9kdWxlLmV4cG9ydHMuZW5jcnlwdCA9IGZ1bmN0aW9uKHRleHQpe1xuICB2YXIgY2lwaGVyID0gY3J5cHRvLmNyZWF0ZUNpcGhlcihhbGdvcml0aG0sIHBhc3N3b3JkKTtcbiAgdmFyIGNyeXB0ZWQgPSBjaXBoZXIudXBkYXRlKHRleHQsJ3V0ZjgnLCdoZXgnKTtcbiAgY3J5cHRlZCArPSBjaXBoZXIuZmluYWwoJ2hleCcpO1xuICByZXR1cm4gY3J5cHRlZDtcbn07XG5cbm1vZHVsZS5leHBvcnRzLmRlY3J5cHQgPSBmdW5jdGlvbih0ZXh0KXtcbiAgdmFyIGRlY2lwaGVyID0gY3J5cHRvLmNyZWF0ZURlY2lwaGVyKGFsZ29yaXRobSxwYXNzd29yZCk7XG4gIHZhciBkZWMgPSBkZWNpcGhlci51cGRhdGUodGV4dCwnaGV4JywndXRmOCcpO1xuICBkZWMgKz0gZGVjaXBoZXIuZmluYWwoJ3V0ZjgnKTtcbiAgcmV0dXJuIGRlYztcbn07XG5cbm1vZHVsZS5leHBvcnRzLnNldFBhc3N3b3JkID0gZnVuY3Rpb24ocGFzcykge1xuICBwYXNzd29yZCA9IHBhc3M7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyeXB0byA6IHJlcXVpcmUoJy4vY3J5cHRvJyksXG4gIHNldHRpbmdzIDogcmVxdWlyZSgnLi9zZXR0aW5ncycpLFxuICBzZWFyY2ggOiByZXF1aXJlKCcuL3NlYXJjaCcpLFxuICBiZWhhdmlvcnMgOiB7XG4gICAgSW1wb3J0VmF1bHQgOiByZXF1aXJlKCcuL3BhZ2VzL21hbmFnZS9pbXBvcnQnKVxuICB9XG59O1xuXG5cbnJlcXVpcmUoJy4vaW5pdCcpKCk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAkKHdpbmRvdykub24oJ2tleXVwJywgZnVuY3Rpb24oZSkge1xuICAgIGlmKCBlLndoaWNoID09IDczICYmIGUuY3RybEtleSApIHtcbiAgICAgIHdpbmRvdy5yZXF1aXJlKCdudy5ndWknKS5XaW5kb3cuZ2V0KCkuc2hvd0RldlRvb2xzKCk7XG4gICAgfSBlbHNlIGlmICggZS53aGljaCA9PSA4MiAmJiBlLmN0cmxLZXkgKSB7XG4gICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciBndWkgPSB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJyk7XG4gIHdpbiA9IGd1aS5XaW5kb3cuZ2V0KCk7XG4gIHZhciBuYXRpdmVNZW51QmFyID0gbmV3IGd1aS5NZW51KHsgdHlwZTogXCJtZW51YmFyXCIgfSk7XG4gIHRyeSB7XG4gICAgbmF0aXZlTWVudUJhci5jcmVhdGVNYWNCdWlsdGluKFwiUGFzc3dvcmQgVmF1bHRcIik7XG4gICAgd2luLm1lbnUgPSBuYXRpdmVNZW51QmFyO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUubG9nKGV4Lm1lc3NhZ2UpO1xuICB9XG5cbiAgJChkb2N1bWVudCkub24oJ3JlYWR5JywgZnVuY3Rpb24oKXtcbiAgICByZXF1aXJlKCcuL3BhZ2VzL3JvdXRlcicpO1xuICAgIHJlcXVpcmUoJy4vcGFnZXMvdXNlJykuaW5pdCgpO1xuICB9KTtcblxufTtcbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uLy4uL3NldHRpbmdzJyk7XG5cbmZ1bmN0aW9uIGltcG9ydEZpbGUoZmlsZSkge1xuICBzZXR0aW5ncy5hZGRWYXVsdChmaWxlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGltcG9ydCA6IGltcG9ydEZpbGVcbn1cbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL3NldHRpbmdzJyk7XG5cbiQod2luZG93KS5vbignaGFzaGNoYW5nZScsIHVwZGF0ZVBhZ2UpO1xuXG5mdW5jdGlvbiB1cGRhdGVQYWdlKCkge1xuICB2YXIgcGFydHMgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5yZXBsYWNlKC8jLywnJykuc3BsaXQoJy8nKTtcblxuICB2YXIgY29uZmlnID0gc2V0dGluZ3MuZ2V0KCk7XG4gIHZhciBwYWdlID0gcGFydHNbMF07XG5cbiAgaWYoIHBhZ2UgPT09ICcnICkge1xuICAgIHBhZ2UgPSAndXNlJztcbiAgfVxuXG4gICQoJy5wYWdlJykuaGlkZSgpO1xuICB2YXIgZWxlID0gJCgnIycrcGFnZSkuc2hvdygpO1xuXG4gICQoJ2xpW3JvbGU9XCJwcmVzZW50YXRpb25cIl0nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICQoJ2Fbcm9sZT1cInRhYlwiXVtocmVmPVwiIycrcGFnZSsnXCJdJykucGFyZW50KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuXG4gIGlmKCBlbGVbMF0ub25TaG93ICkgZWxlWzBdLm9uU2hvdygpO1xuXG4gIGlmKCBwYWdlID09ICdtYW5hZ2UnICkge1xuICAgICQoJy5lZGl0LWVsZW1lbnQnKS5oaWRlKCk7XG4gICAgaWYoIHBhcnRzLmxlbmd0aCA+IDEgKSB7XG4gICAgICBpZiggcGFydHNbMV0gPT0gJ2ltcG9ydCcgKSAkKCdhcHAtaW1wb3J0LXZhdWx0Jykuc2hvdygpO1xuICAgICAgZWxzZSAkKCdhcHAtY3JlYXRlLW5ldycpLnNob3coKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJCgnYXBwLWNyZWF0ZS1uZXcnKS5zaG93KCk7XG4gICAgfVxuICB9XG5cbn1cblxudXBkYXRlUGFnZSgpO1xuIiwidmFyIGZzID0gTk9ERS5mcztcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uLy4uL3NldHRpbmdzJyk7XG52YXIgY3J5cHRvID0gcmVxdWlyZSgnLi4vLi4vY3J5cHRvJyk7XG52YXIgc2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2gnKTtcbnZhciBjb25maWc7XG5cbnZhciBjdXJyZW50VmF1bHQgPSB7XG4gIGZpbGUgOiAnJyxcbiAgZGF0YSA6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgJCgnI3VzZScpWzBdLm9uU2hvdyA9IG9uU2hvdztcblxuICAkKCcjdW5sb2NrLXBvcHVwJykubW9kYWwoe3Nob3c6IGZhbHNlfSk7XG5cbiAgJCgnI3VubG9jay1zaG93LWJ0bicpLm9uKCdjbGljaycsIHNob3dVbmxvY2tQb3B1cCk7XG4gICQoJyN1bmxvY2stYnRuJykub24oJ2NsaWNrJywgYXR0ZW1wdFVubG9jayk7XG5cbiAgJCgnI3VubG9jay1wb3B1cC1wYXNzd29yZCcpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpe1xuICAgIGlmKCBlLndoaWNoID09IDEzICkgYXR0ZW1wdFVubG9jaygpO1xuICB9KTtcbiAgJCgnI2ZpbmQtcGFzc3dvcmQtaW5wdXQnKS5vbigna2V5dXAnLCBmdW5jdGlvbihlKXtcbiAgICBzZWFyY2guZ28oY3VycmVudFZhdWx0LmRhdGEpO1xuICB9KTtcblxuICAkKCcjdmF1bHQtc2VsZWN0Jykub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCl7XG4gICAgY3VycmVudFZhdWx0LmRhdGEgPSBudWxsO1xuICAgIGN1cnJlbnRWYXVsdC5sb2NhdGlvbiA9ICcnO1xuICAgIFZhdWx0LmFjdGl2ZSA9ICQodGhpcykudmFsKCk7XG4gICAgcmVzZXRVaSgpO1xuICB9KTtcblxuICBzZXR0aW5ncy5vbigndmF1bHRzLXVwZGF0ZWQnLCBmdW5jdGlvbih2YXVsdHMpe1xuICAgIGNyZWF0ZVNlbGVjdG9yKCk7XG4gIH0pO1xuXG4gIG9uU2hvdygpO1xuXG4gIC8vIGF1dG8gc2hvdyB1bmxvY2sgaWYgd2UgaGF2ZSBhbiBhY3RpdmUgdmF1bHRcbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgIGlmKCBWYXVsdC5hY3RpdmUgKSBzaG93VW5sb2NrUG9wdXAoKTtcbiAgfSwgMjAwKTtcbn07XG5cbmZ1bmN0aW9uIHJlc2V0VWkoKSB7XG4gICQoJyN1c2UtbWVzc2FnZScpLmh0bWwoJycpO1xuICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCcnKTtcbiAgJCgnI2ZpbmQtcGFzc3dvcmQnKS5oaWRlKCk7XG4gICQoJyN1bmxvY2stc2hvdy1idG4nKS5zaG93KCk7XG59XG5cbmZ1bmN0aW9uIHNob3dVbmxvY2tQb3B1cCgpIHtcbiAgJCgnI3VubG9jay1wb3B1cC1maWxlbmFtZScpLmh0bWwoVmF1bHQuYWN0aXZlKTtcbiAgJCgnI3ZhdWx0LXBvcHVwLW1lc3NhZ2UnKS5odG1sKCcnKTtcbiAgJCgnI3VubG9jay1wb3B1cCcpLm1vZGFsKCdzaG93Jyk7XG4gICQoJyN1bmxvY2stcG9wdXAtcGFzc3dvcmQnKS52YWwoJycpO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykuZm9jdXMoKTtcbiAgfSwgMjUwKTtcbn1cblxuZnVuY3Rpb24gb25TYXZlKGluZm8pIHtcbiAgdmFyIGksIGl0ZW07XG5cbiAgLy8gc2ltcGxlIGRlbGV0ZVxuICBpZiggaW5mby5yZW1vdmUgKSB7XG4gICAgZm9yKCBpID0gMDsgaSA8IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLmxlbmd0aDsgaSsrICkge1xuICAgICAgaWYoIGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zW2ldLm5hbWUgPT0gaW5mby5uYW1lICkge1xuICAgICAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2F2ZSgpO1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8ganVzdCBhIHNpbXBsZSBlZGl0XG4gIGlmKCBpbmZvLm9yaWdpbmFsTmFtZSA9PSBpbmZvLmVudHJ5Lm5hbWUgKSB7XG4gICAgdXBkYXRlRW50cnkoaW5mby5lbnRyeSk7XG4gICAgc2F2ZSgpO1xuICAgIHNlYXJjaC5nbyhjdXJyZW50VmF1bHQuZGF0YSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGlzT3ZlcndyaXRlID0gZmFsc2U7XG4gIGZvciggaSA9IDA7IGkgPCBjdXJyZW50VmF1bHQuZGF0YS5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICBpdGVtID0gY3VycmVudFZhdWx0LmRhdGEuaXRlbXNbaV07XG4gICAgaWYoIGl0ZW0ubmFtZSA9PSBpbmZvLmVudHJ5Lm5hbWUgKSB7XG4gICAgICBpc092ZXJ3cml0ZSA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiggaXNPdmVyd3JpdGUgJiYgIWNvbmZpcm0oJ1wiJytpbmZvLmVudHJ5KydcIiBhbHJlYWR5IGV4aXN0cywgYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIG92ZXJ3cml0ZT8hJykgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYoIGluZm8uaXNOZXcgKSB7XG4gICAgY3VycmVudFZhdWx0LmRhdGEuaXRlbXMucHVzaChpbmZvLmVudHJ5KTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVFbnRyeShpbmZvLmVudHJ5KTtcbiAgfVxuXG4gIHNhdmUoKTtcbiAgc2VhcmNoLmdvKGN1cnJlbnRWYXVsdC5kYXRhKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW50cnkoZW50cnkpIHtcbiAgZm9yKCBpID0gMDsgaSA8IGN1cnJlbnRWYXVsdC5kYXRhLml0ZW1zLmxlbmd0aDsgaSsrICkge1xuICAgIGl0ZW0gPSBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXTtcbiAgICBpZiggaXRlbS5uYW1lID09IGVudHJ5Lm5hbWUgKSB7XG4gICAgICBjdXJyZW50VmF1bHQuZGF0YS5pdGVtc1tpXSA9IGVudHJ5O1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzYXZlKCkge1xuICB2YXIgZGF0YSA9IGNyeXB0by5lbmNyeXB0KEpTT04uc3RyaW5naWZ5KGN1cnJlbnRWYXVsdC5kYXRhKSk7XG4gIGZzLndyaXRlRmlsZVN5bmMoY3VycmVudFZhdWx0LmZpbGUsIGRhdGEpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZWxlY3RvcigpIHtcbiAgaWYoICFjb25maWcudmF1bHRzICkgcmV0dXJuO1xuXG4gIHZhciBodG1sID0gJyc7XG4gIGZvciggdmFyIGkgPSAwOyBpIDwgY29uZmlnLnZhdWx0cy5sZW5ndGg7IGkrKyApIHtcbiAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVlPVwiJytjb25maWcudmF1bHRzW2ldKydcIiAnKyhjb25maWcudmF1bHRzW2ldID09IFZhdWx0LmFjdGl2ZSA/ICdzZWxlY3RlZCcgOiAnJykrJz4nK2NvbmZpZy52YXVsdHNbaV0rJzwvb3B0aW9uPic7XG4gIH1cbiAgJCgnI3ZhdWx0LXNlbGVjdCcpLmh0bWwoaHRtbCk7XG59XG5cbmZ1bmN0aW9uIG9uU2hvdygpIHtcbiAgY29uZmlnID0gc2V0dGluZ3MuZ2V0KCk7XG4gIHJlc2V0VWkoKTtcblxuICBpZiggVmF1bHQuYWN0aXZlICkge1xuICAgIG9uVmF1bHRTZXQoKTtcbiAgfSBlbHNlIGlmICggY29uZmlnLnZhdWx0cyAmJiBjb25maWcudmF1bHRzLmxlbmd0aCA+IDAgKSB7XG4gICAgVmF1bHQuYWN0aXZlID0gY29uZmlnLnZhdWx0c1swXTtcbiAgICBvblZhdWx0U2V0KCk7XG4gIH0gZWxzZSB7XG4gICAgd2FybignWW91IGhhdmUgbm8gdmF1bHRzLiAgWW91IG11c3QgZmlyc3QgY3JlYXRlIG9uZScpO1xuICB9XG5cbiAgY3JlYXRlU2VsZWN0b3IoKTtcbn1cblxuZnVuY3Rpb24gb25WYXVsdFNldCgpIHtcbiAgaWYoIFZhdWx0LmFjdGl2ZSA9PT0gY3VycmVudFZhdWx0LmZpbGUgJiYgY3VycmVudFZhdWx0LmRhdGEgIT09IG51bGwgKSB7XG4gICAgJCgnI3VubG9jay1zaG93LWJ0bicpLmhpZGUoKTtcbiAgICAkKCcjZmluZC1wYXNzd29yZCcpLnNob3coKTtcbiAgICAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLmZvY3VzKCk7XG4gICAgc2VhcmNoLmdvKGN1cnJlbnRWYXVsdC5kYXRhLCAnJyk7XG4gIH0gZWxzZSB7XG4gICAgJCgnI3VubG9jay1zaG93LWJ0bicpLnNob3coKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRlbXB0VW5sb2NrKCkge1xuICBjdXJyZW50VmF1bHQuZGF0YSA9IG51bGw7XG4gIGNyeXB0by5zZXRQYXNzd29yZCgkKCcjdW5sb2NrLXBvcHVwLXBhc3N3b3JkJykudmFsKCkpO1xuICB2YXIgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhWYXVsdC5hY3RpdmUsICd1dGY4Jyk7XG5cbiAgdHJ5IHtcbiAgICBkYXRhID0gSlNPTi5wYXJzZShjcnlwdG8uZGVjcnlwdChkYXRhKSk7XG4gIH0gY2F0Y2goZSkge1xuICAgICQoJyN2YXVsdC1wb3B1cC1tZXNzYWdlJykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiPkludmFsaWQgUGFzc3dvcmQ8L2Rpdj4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAkKCcjdmF1bHQtcG9wdXAtbWVzc2FnZScpLmh0bWwoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1zdWNjZXNzXCI+U3VjY2VzcyE8L2Rpdj4nKTtcblxuXG4gIGN1cnJlbnRWYXVsdC5kYXRhID0gZGF0YTtcbiAgY3VycmVudFZhdWx0LmZpbGUgPSBWYXVsdC5hY3RpdmU7XG4gIG9uVmF1bHRTZXQoKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICQoJyN1bmxvY2stcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xuICB9LCA1MDApO1xufVxuXG5mdW5jdGlvbiB3YXJuKG1zZykge1xuICBpZiggIW1zZyApICQoJ3VzZS1tZXNzYWdlJykuaHRtbCgnJyk7XG4gIGVsc2UgJCgndXNlLW1lc3NhZ2UnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FyblwiPicrbXNnKyc8L2Rpdj4nKTtcbn1cbiIsInZhciBndWkgPSB3aW5kb3cucmVxdWlyZSgnbncuZ3VpJyk7XG52YXIgY2xpcGJvYXJkID0gZ3VpLkNsaXBib2FyZC5nZXQoKTtcblxudmFyIGN1cnJlbnQgPSBbXSwgY3VycmVudERhdGEsIGN1cnJlbnRJdGVtcztcblxuXG5tb2R1bGUuZXhwb3J0cy5nbyA9IGZ1bmN0aW9uKGRhdGEsIHR4dCkge1xuICBpZiggIWRhdGEuaXRlbXMgKSByZXR1cm47XG4gIGN1cnJlbnREYXRhID0gZGF0YS5pdGVtcztcblxuICB2YXIgdGV4dCA9IHR4dCB8fCAkKCcjZmluZC1wYXNzd29yZC1pbnB1dCcpLnZhbCgpO1xuICB2YXIgcmUgPSBuZXcgUmVnRXhwKCcuKicrdGV4dCsnLionLCAnaScpO1xuXG4gIHZhciByZXN1bHRzID0gW107XG4gIGRhdGEuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICB2YXIgbmFtZSA9IGl0ZW0ubmFtZSB8fCAnJztcbiAgICB2YXIgZGVzY3JpcHRpb24gPSBpdGVtLmRlc2NyaXB0aW9uIHx8ICcnO1xuICAgIGlmKCBuYW1lLm1hdGNoKHJlKSB8fCBkZXNjcmlwdGlvbi5tYXRjaChyZSkgKSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlbSk7XG4gICAgfVxuICB9KTtcblxuICByZW5kZXJSZXN1bHRzKHJlc3VsdHMpO1xufTtcblxuXG5cbmZ1bmN0aW9uIHJlbmRlclJlc3VsdHMoaXRlbXMpIHtcbiAgaWYoIGl0ZW1zLmxlbmd0aCA9PT0gMCApIHtcbiAgICAkKCcjdXNlLXJlc3VsdHMnKS5odG1sKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FybmluZ1wiPk5vIG1hdGNoZXMgZm91bmQ8L2Rpdj4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaHRtbCA9ICc8ZGl2IGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCI+JztcbiAgY3VycmVudCA9IFtdO1xuICBjdXJyZW50SXRlbXMgPSBpdGVtcztcblxuICB2YXIgcm93ID0gW107XG5cbiAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICByb3cgPSBbXTtcblxuICAgIGh0bWwgKz1cbiAgICAgICc8ZGl2IGNsYXNzPVwid2VsbFwiPjxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCI+JytcbiAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbC1zbS0zIGNvbnRyb2wtbGFiZWxcIj48aDU+JytpdGVtLm5hbWUrJzwvaDU+PC9sYWJlbD4nK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbC1zbS03XCI+JytcbiAgICAgICAgICAnPGRpdiBjbGFzcz1cIicrKGl0ZW0uZGVzY3JpcHRpb24gPyAnaGVscC1ibG9jaycgOiAnJykrJ1wiPicrXG4gICAgICAgICAgICAnPGk+JysoaXRlbS5kZXNjcmlwdGlvbiB8fCAnJykrJzwvaT4nK1xuICAgICAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCIgbmFtZT1cIkVkaXRcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJ1wiPjxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPjwvYT4nK1xuICAgICAgICAgICc8L2Rpdj4nK1xuICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZVwiPic7XG5cbiAgICBpZiggaXRlbS51c2VybmFtZSApIHtcbiAgICAgIGh0bWwgKz0gJzx0cj4nK1xuICAgICAgICAnPHRkIHN0eWxlPVwid2lkdGg6NjUlXCI+VXNlcm5hbWU8L3RkPicrXG4gICAgICAgICc8dGQ+JytcbiAgICAgICAgICBpdGVtLnVzZXJuYW1lICtcbiAgICAgICAgJzwvdGQ+JytcbiAgICAgICc8L3RyPic7XG4gICAgfVxuXG4gICAgZm9yKCB2YXIga2V5IGluIGl0ZW0gKSB7XG4gICAgICBpZigga2V5ID09ICduYW1lJyB8fCBrZXkgPT0gJ2Rlc2NyaXB0aW9uJyB8fCBrZXkgPT0gJ3VzZXJuYW1lJyApIGNvbnRpbnVlO1xuXG4gICAgICBodG1sICs9XG4gICAgICAgICc8dHI+JytcbiAgICAgICAgICAnPHRkIHN0eWxlPVwid2lkdGg6NjUlXCI+Jysoa2V5ID09PSAncGFzc3dvcmQnID8gJ1Bhc3N3b3JkJyA6IGtleSkrJzwvdGQ+JytcbiAgICAgICAgICAnPHRkPicrXG4gICAgICAgICAgICAnPGEgY2xhc3M9XCJidG4gYnRuLWxpbmtcIiBuYW1lPVwiQ29weVwiIGluZGV4PVwiJytjdXJyZW50Lmxlbmd0aCsnLScrcm93Lmxlbmd0aCsnXCI+PGkgY2xhc3M9XCJmYSBmYS1jb3B5XCI+PC9pPjwvYT4nK1xuICAgICAgICAgICAgJzxhIGNsYXNzPVwiYnRuIGJ0bi1saW5rXCIgbmFtZT1cIlNob3dcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJy0nK3Jvdy5sZW5ndGgrJ1wiPjxpIGNsYXNzPVwiZmEgZmEtZXllXCI+PC9pPjwvYT4nK1xuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIHNob3dQYXNzXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIiBpbmRleD1cIicrY3VycmVudC5sZW5ndGgrJy0nK3Jvdy5sZW5ndGgrJ1wiIC8+JytcbiAgICAgICAgICAnPC90ZD4nK1xuICAgICAgICAnPC90cj4nO1xuICAgICAgcm93LnB1c2goaXRlbVtrZXldKTtcbiAgICB9XG5cbiAgICBjdXJyZW50LnB1c2gocm93KTtcbiAgICBodG1sICs9ICc8L3RhYmxlPjwvZGl2PjwvZGl2PjwvZGl2Pic7XG4gIH0pO1xuXG4gIHZhciByZXN1bHRzID0gJCgnI3VzZS1yZXN1bHRzJykuaHRtbChodG1sKyc8L2Rpdj4nKTtcblxuICByZXN1bHRzLmZpbmQoJ2FbbmFtZT1cIkNvcHlcIl0nKS5vbignY2xpY2snLCBjb3B5KTtcbiAgcmVzdWx0cy5maW5kKCdhW25hbWU9XCJTaG93XCJdJykub24oJ2NsaWNrJywgc2hvdyk7XG4gIHJlc3VsdHMuZmluZCgnYVtuYW1lPVwiRWRpdFwiXScpLm9uKCdjbGljaycsIGVkaXQpO1xufVxuXG5mdW5jdGlvbiBzaG93KGUpIHtcbiAgdmFyIGVsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgdmFyIGlkID0gZWxlLmF0dHIoJ2luZGV4Jyk7XG5cbiAgaWYoIGVsZS5maW5kKCdpJykuaGFzQ2xhc3MoJ2ZhLWV5ZScpICkge1xuICAgIGlkID0gaWQuc3BsaXQoJy0nKTtcbiAgICB2YXIgcm93ID0gcGFyc2VJbnQoaWRbMF0pLCBjb2wgPSBwYXJzZUludChpZFsxXSk7XG4gICAgZWxlLnBhcmVudCgpLmZpbmQoJy5zaG93UGFzcycpLnZhbChjdXJyZW50W3Jvd11bY29sXSkuc2hvdygpLnNlbGVjdCgpO1xuICAgIGVsZS5maW5kKCdpJykucmVtb3ZlQ2xhc3MoJ2ZhLWV5ZScpLmFkZENsYXNzKCdmYS1leWUtc2xhc2gnKTtcbiAgfSBlbHNlIHtcbiAgICBlbGUucGFyZW50KCkuZmluZCgnLnNob3dQYXNzJykuaHRtbCgnJykuaGlkZSgpO1xuICAgIGVsZS5maW5kKCdpJykucmVtb3ZlQ2xhc3MoJ2ZhLWV5ZS1zbGFzaCcpLmFkZENsYXNzKCdmYS1leWUnKTtcbiAgfVxufVxuXG52YXIgaGlkZVRpbWVyID0gLTE7XG5mdW5jdGlvbiBjb3B5KGUpIHtcbiAgdmFyIGVsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgdmFyIGlkID0gZWxlLmF0dHIoJ2luZGV4Jyk7XG4gIGlkID0gaWQuc3BsaXQoJy0nKTtcbiAgdmFyIHJvdyA9IHBhcnNlSW50KGlkWzBdKSwgY29sID0gcGFyc2VJbnQoaWRbMV0pO1xuXG4gIGNsaXBib2FyZC5zZXQoY3VycmVudFtyb3ddW2NvbF0sICd0ZXh0Jyk7XG5cbiAgJCgnI3RvYXN0JykuaHRtbCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIj5Db3BpZWQgdG8gY2xpcGJvYXJkPC9kaXY+Jykuc2hvdygpO1xuXG4gIGlmKCBoaWRlVGltZXIgIT0gLTEgKSBjbGVhclRpbWVvdXQoaGlkZVRpbWVyKTtcbiAgaGlkZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgIGNsZWFyVGltZW91dChoaWRlVGltZXIpO1xuICAgICQoJyN0b2FzdCcpLmhpZGUoKTtcbiAgfSwgMjAwMCk7XG59XG5cbmZ1bmN0aW9uIGVkaXQoZSkge1xuICB2YXIgZWxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICB2YXIgcm93ID0gcGFyc2VJbnQoZWxlLmF0dHIoJ2luZGV4JykpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YXVsdCwgdHh0KSB7XG4gIGlmKCAhdmF1bHQuaXRlbXMgKSByZXR1cm4gW107XG5cbiAgdmFyIHJlID0gbmV3IFJlZ0V4cCgnLionK3R4dCsnLionLCAnaScpO1xuXG4gIHZhciByZXN1bHRzID0gW107XG4gIGRhdGEuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICB2YXIgbmFtZSA9IGl0ZW0ubmFtZSB8fCAnJztcbiAgICB2YXIgZGVzY3JpcHRpb24gPSBpdGVtLmRlc2NyaXB0aW9uIHx8ICcnO1xuICAgIGlmKCBuYW1lLm1hdGNoKHJlKSB8fCBkZXNjcmlwdGlvbi5tYXRjaChyZSkgKSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlbSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzdWx0cztcbn07XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuZXZlbnRzID0gbmV3IGV2ZW50cygpO1xuZXZlbnRzLnNldE1heExpc3RlbmVycygxMDAwKTtcblxudmFyIGZzID0gTk9ERS5mcztcblxudmFyIEZJTEVOQU1FID0gJy5ud1Bhc3N3b3JkVmF1bHQnO1xuXG52YXIgcGF0aCA9IHV0aWxzLmdldFVzZXJIb21lKCkrJy8nK0ZJTEVOQU1FO1xuaWYoICFmcy5leGlzdHNTeW5jKHBhdGgpICkge1xuICBmcy53cml0ZUZpbGVTeW5jKHBhdGgsICd7fScpO1xufVxuXG52YXIgc2V0dGluZ3MgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLCAndXRmLTgnKSk7XG5cbmZ1bmN0aW9uIGdldCgpIHtcbiAgcmV0dXJuIHNldHRpbmdzO1xufVxuXG5mdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICBzZXR0aW5nc1trZXldID0gdmFsdWU7XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpKTtcbn1cblxuZnVuY3Rpb24gYWRkVmF1bHQobG9jYXRpb24pIHtcbiAgaWYoICFzZXR0aW5ncy52YXVsdHMgKSBjb25maWcudmF1bHRzID0gW107XG5cbiAgaWYoIHNldHRpbmdzLnZhdWx0cy5pbmRleE9mKGxvY2F0aW9uKSA+IC0xICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHNldHRpbmdzLnZhdWx0cy5wdXNoKGxvY2F0aW9uKTtcblxuICBzZXQoJ3ZhdWx0cycsIHNldHRpbmdzLnZhdWx0cyk7XG5cbiAgZXZlbnRzLmVtaXQoJ3ZhdWx0cy11cGRhdGVkJywgc2V0dGluZ3MudmF1bHRzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldCA6IGdldCxcbiAgc2V0IDogc2V0LFxuICBhZGRWYXVsdCA6IGFkZFZhdWx0LFxuICBvbiA6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcil7XG4gICAgZXZlbnRzLm9uKGV2ZW50LCBsaXN0ZW5lcik7XG4gIH1cbn07XG4iLCJcbm1vZHVsZS5leHBvcnRzLmdldFVzZXJIb21lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB3aW5kb3cucHJvY2Vzcy5lbnZbKHdpbmRvdy5wcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMicpID8gJ1VTRVJQUk9GSUxFJyA6ICdIT01FJ107XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
