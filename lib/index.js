module.exports = {
  crypto : require('./crypto'),
  settings : require('./settings'),
  behaviors : {
    ImportVault : require('./pages/manage/import')
  }
};


require('./init')();
