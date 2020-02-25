'use strict';

const QRCode = require('./easyqrcodejs-nodejs-extended/');

exports.handler = async (event, context, callback) => {
  const qrcode = new QRCode(event['queryStringParameters']['text']);
  const data = await qrcode.toDataURL();
  const response = {
    statusCode: 200,
    body: JSON.stringify(data)
  };
  return response;
};
