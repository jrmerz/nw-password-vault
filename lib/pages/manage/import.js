var settings = require('../../settings');

function importFile(file) {
  settings.addVault(file);
}

module.exports = {
  import : importFile
}
