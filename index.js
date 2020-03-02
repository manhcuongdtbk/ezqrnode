const QRCode = require("./easyqrcodejs-nodejs-extended/");

exports.handler = async event => {
  const options = event.queryStringParameters;
  const { token } = event.queryStringParameters;
  console.log(token);
  delete options.token;
  let response = null;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  };

  if (token === "b57b22fd7a5979aa14939f56ac95af4297552addc46835cc695ec8f29377c0290148b") {
    const qrcode = new QRCode(options);
    const data = await qrcode.saveImage({ path: "q.png" });
    response = {
      statusCode: 200,
      headers: headers,
      body: data
    };
  } else {
    let errorMessage = null;

    if (token) {
      errorMessage = "The access token is invalid. You are not authorized to use this service";
    } else {
      errorMessage =
        "The access token is not provided. Please provide a valid access token to use this service";
    }

    response = {
      statusCode: 404,
      headers: headers,
      body: JSON.stringify(errorMessage)
    };
  }

  return response;
};
