const QRCode = require('./easyqrcodejs-nodejs-extended/');
const cryptoRandomString = require('crypto-random-string');

const options = {
  text: cryptoRandomString({ length: 10 })
};

const qrcode = new QRCode(options);

qrcode.saveImage({ path: 'q.png' });
