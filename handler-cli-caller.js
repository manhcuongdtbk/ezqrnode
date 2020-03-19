const crypto = require("crypto");
const { handler } = require("./index");

const randomText = crypto.randomBytes(35).toString("hex");
const fixedText = "cuong.bui@tomosia.com";

const options = {
  text: randomText,
  size: 1200,
  dotScale: "0.5",
  // colorDark: "lightsalmon",
  // colorLight: "peachpuff",
  dotStyle: "3",
  timingStyle: "3",
  positionStyle: "2",
  alignmentStyle: "2",
  // version: "7",
  // correctLevel: QRCode.CorrectLevel.H,
  // backgroundImage: "testImage.jpg",
  // degreeRotation: "90",
  // PO_TL: "red",
  // PI_TL: "yellow",
  // PO_TR: "green",
  // PI_TR: "blue",
  // PO_BL: "cyan",
  // PI_BL: "orange",
  // AO: "purple",
  // AI: "brown",
  // quietZoneSize: 1,
  // quietZoneSizeUnit: "module",
  // quietZoneColor: "red",
  // backgroundColor: "grey",
  token: "b57b22fd7a5979aa14939f56ac95af4297552addc46835cc695ec8f29377c0290148b",
  logoPlaceholder: true,
  visualeadMode: true
};

const eventEmulator = { queryStringParameters: options };

(async () => {
  const generatedQRCode = await handler(eventEmulator);
  console.log(generatedQRCode);
})();
