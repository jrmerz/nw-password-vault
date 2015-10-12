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
