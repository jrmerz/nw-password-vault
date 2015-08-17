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
