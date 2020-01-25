const crypto = require('crypto');

class CryptoModel {

  constructor() {
    this.algorithm = 'aes-256-ctr';
    this.password = '';
  }

  encrypt(text){
    let cipher = crypto.createCipheriv(this.algorithm, this.password, null);
    let crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  decrypt(text){
    let decipher = crypto.createDecipheriv(this.algorithm, this.password, null);
    let dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
  };

  setPassword(pass) {
    this.password = pass;
  };

}

module.exports = new CryptoModel();