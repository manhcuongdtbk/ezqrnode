const QRCode = require('./easyqrcodejs-nodejs-extended/');

exports.handler = (event, context, callback) => {
  const qrcode = new QRCode(event);
  return qrcode.toDataURL();
}
