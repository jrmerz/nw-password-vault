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
