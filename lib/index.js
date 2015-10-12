module.exports = {
  crypto : require('./crypto'),
  settings : require('./settings'),
  search : require('./search'),
  behaviors : {
    ImportVault : require('./pages/manage/import')
  }
};


require('./init')();
