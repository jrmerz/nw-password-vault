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
