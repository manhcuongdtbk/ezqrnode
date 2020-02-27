'use strict';

const QRCode = require('./easyqrcodejs-nodejs-extended/');

exports.handler = async (event, context, callback) => {
  const options = event['queryStringParameters'];
  const qrcode = new QRCode(options);
  const data = await qrcode.toDataURL();
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: data
  };

  return response;
};
