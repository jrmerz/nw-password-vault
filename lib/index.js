module.exports = {
  crypto : require('./crypto'),
  behaviors : {
    ImportVault : require('./pages/manage/import')
  }
};


require('./init')();
