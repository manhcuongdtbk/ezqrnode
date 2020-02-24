const { handler } = require('./index');
const crypto = require('crypto');

const randomText = crypto.randomBytes(20).toString('hex');
const fixedText = 'cuong.bui@tomosia.com';

const options = {
  text: randomText,
  dotScale: 0.5,
  // colorDark: 'black',
  // colorLight: 'white',
  width: 1000,
  height: 1000,
  dotStyle: 'roundedRectangle',
  timingStyle: 'roundedRectangle',
  // positionStyle: 'roundedRectangle',
  // alignmentStyle: 'roundedRectangle',
  // AO: 'purple',
  // AI: 'brown',
  version: 7,
  // correctLevel: QRCode.CorrectLevel.H,
  // backgroundImage: 'testImage.jpg',
  // degreeRotation: 90,
  // PO_TL: 'red',
  // PI_TL: 'yellow',
  // PO_TR: 'green',
  // PI_TR: 'blue',
  // PO_BL: 'cyan',
  // PI_BL: 'orange'
};

(async () => {
  const generatedQRCode = await handler(options);
  console.log(generatedQRCode);
})();
