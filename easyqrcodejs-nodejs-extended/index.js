/* eslint-disable no-underscore-dangle */
const { QRCodeLimitLength, QRErrorCorrectLevel } = require("./core/constants");
const QRMath = require("./core/qr-math");
const QRCodeModel = require("./core/qr-code-model");
const Drawing = require("./core/drawing");

for (let i = 0; i < 8; i += 1) {
  QRMath.EXP_TABLE[i] = 1 << i;
}

for (let i = 8; i < 256; i += 1) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8];
}

for (let i = 0; i < 255; i += 1) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}

// eslint-disable-next-line no-underscore-dangle
function _getUTF8Length(sText) {
  const replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');

  return replacedText.length + (replacedText.length !== sText ? 3 : 0);
}

/**
 * Get the type by string length
 *
 * @private
 * @param {String} sText
 * @param {Number} nCorrectLevel
 * @return {Number} type
 */
// eslint-disable-next-line no-underscore-dangle
function _getTypeNumber(sText, _htOption) {
  const nCorrectLevel = _htOption.correctLevel;
  let nType = 1;
  const length = _getUTF8Length(sText);

  for (let i = 0, len = QRCodeLimitLength.length; i <= len; i += 1) {
    let nLimit = 0;

    // eslint-disable-next-line default-case
    switch (nCorrectLevel) {
      case QRErrorCorrectLevel.L:
        [nLimit] = QRCodeLimitLength[i];
        break;
      case QRErrorCorrectLevel.M:
        [, nLimit] = QRCodeLimitLength[i];
        break;
      case QRErrorCorrectLevel.Q:
        [, , nLimit] = QRCodeLimitLength[i];
        break;
      case QRErrorCorrectLevel.H:
        [, , , nLimit] = QRCodeLimitLength[i];
        break;
    }

    if (length <= nLimit) {
      break;
    } else {
      nType += 1;
    }
  }

  if (nType > QRCodeLimitLength.length) {
    throw new Error("Too long data");
  }

  if (_htOption.version !== 0) {
    if (nType <= _htOption.version) {
      nType = _htOption.version;
      _htOption.runVersion = nType;
    } else {
      console.warn(`QR Code version ${_htOption.version} too small, run version use ${nType}`);
      _htOption.runVersion = nType;
    }
  }

  return nType;
}

class QRCode {
  constructor(vOption) {
    this._htOption = {
      size: 1000,
      typeNumber: 4,
      colorDark: "rgba(0, 0, 0, 0.6)",
      colorLight: "rgba(255, 255, 255, 0.7)",
      backgroundColor: null, // CSS color of the QR Code module's background, default to null (transparent)
      correctLevel: QRCode.CorrectLevel.M,

      dotScale: 1, // Must be greater than 0, less than or equal to 1. default is 1

      quietZoneSize: 0, // Must be greater than or equal to 0. default is 0
      quietZoneSizeUnit: "pixel", // "pixel", "module"
      quietZoneColor: "transparent",

      logo: undefined,
      logoWidth: undefined,
      logoHeight: undefined,
      logoBackgroundColor: "#ffffff",
      logoBackgroundTransparent: false,
      logoPlaceholder: false, // Blank space at the center of the QR Module. default is false.

      // === Posotion Pattern(Eye) Color
      PO: undefined, // Global Posotion Outer color. if not set, the defaut is `colorDark`
      PI: undefined, // Global Posotion Inner color. if not set, the defaut is `colorDark`
      PO_TL: undefined, // Posotion Outer - Top Left
      PI_TL: undefined, // Posotion Inner - Top Left
      PO_TR: undefined, // Posotion Outer - Top Right
      PI_TR: undefined, // Posotion Inner - Top Right
      PO_BL: undefined, // Posotion Outer - Bottom Left
      PI_BL: undefined, // Posotion Inner - Bottom Left

      // === Alignment Color
      AO: undefined, // Alignment Outer. if not set, the defaut is `colorDark`
      AI: undefined, // Alignment Inner. if not set, the defaut is `colorDark`

      // === Timing Pattern Color
      timing: undefined, // Global Timing color. if not set, the defaut is `colorDark`
      timing_H: undefined, // Horizontal timing color
      timing_V: undefined, // Vertical timing color

      // ==== Backgroud Image
      backgroundImage: undefined, // Background Image
      backgroundImageAlpha: 1, // Background image transparency, value between 0 and 1. default is 1.
      autoColor: false,

      // ==== Event Handler
      onRenderingStart: undefined,

      // ==== Images format
      format: "PNG", // "PNG", "JPG"
      compressionLevel: 0, // ZLIB compression level (0-9). default is 0
      quality: 0.75, // An object specifying the quality (0 to 1). default is 0.75. (JPGs only)

      // ==== Versions
      version: 0, // The symbol versions of QR Code range from Version 1 to Version 40. default 0 means automatically choose the closest version based on the text length.

      // ==== Dot Style
      dotStyle: 1, // 1: square, 2: rounded, 3: circle, 4: star

      // ==== Timing style
      timingStyle: 1, // 1: square, 2: rounded, 3: circle, 4: star

      // ==== Position style
      positionStyle: 1, // 1: square, 2: rounded, 3: circle

      // ==== Alignment style
      alignmentStyle: 1, // 1: square, 2: rounded, 3: circle

      // ==== Degree Rotation
      degreeRotation: 0, // 0, 90, 180, 270

      // ==== Visualead mode
      visualeadMode: false
    };

    if (typeof vOption === "string") {
      vOption = {
        text: vOption
      };
    }

    const NUMBER_TYPE_OPTIONS = Object.freeze([
      "size",
      "dotScale",
      "quietZoneSize",
      "logoWidth",
      "logoHeight",
      "backgroundImageAlpha",
      "compressionLevel",
      "quality",
      "version",
      "degreeRotation",
      "dotStyle",
      "timingStyle",
      "positionStyle",
      "alignmentStyle"
    ]);

    // Overwrites options

    if (vOption) {
      NUMBER_TYPE_OPTIONS.forEach(option => {
        if (vOption[option]) {
          vOption[option] = Number(vOption[option]);
        }
      });

      const visualeadColorDark = ["#000000", "#841212", "#371866", "#605310", "#0E6614", "#0F4F43"];

      if (vOption.visualeadMode) {
        vOption.quietZoneSize = 1;
        vOption.quietZoneSizeUnit = "module";
        vOption.quietZoneColor = "transparent";
        vOption.backgroundColor = null;
        vOption.dotScale = 0.5;
      }

      Object.assign(this._htOption, vOption);
    }

    const minSize = 120;
    const maxSize = 4000;

    if (this._htOption.size < 120 || this._htOption.size > 4000) {
      console.warn(
        `${this._htOption.size} is invalid, size must be between ${minSize} and ${maxSize}, now reset to 1000.`
      );

      this._htOption.size = 1000;
    }

    if (this._htOption.version < 0 || this._htOption.version > 40) {
      console.warn(`QR Code version '${this._htOption.version}' is invalid, reset to 0`);
      this._htOption.version = 0;
    }

    this._htOption.format = this._htOption.format.toUpperCase();

    if (this._htOption.format !== "PNG" && this._htOption.format !== "JPG") {
      console.warn(`Image format '${this._htOption.format}' is invalid, reset to 'PNG'`);
      this._htOption.format = "PNG";
    }

    if (
      this._htOption.format === "PNG" &&
      (this._htOption.compressionLevel < 0 || this._htOption.compressionLevel > 9)
    ) {
      console.warn(
        `${this._htOption.compressionLevel} is invalid, PNG compressionLevel must between 0 and 9, now reset to 0. `
      );
      this._htOption.compressionLevel = 0;
    } else if (this._htOption.quality < 0 || this._htOption.quality > 1) {
      console.warn(
        `${this._htOption.quality} is invalid, JPG quality must between 0 and 1, now reset to 0.75. `
      );
      this._htOption.quality = 0.75;
    }

    if (this._htOption.dotScale < 0 || this._htOption.dotScale > 1) {
      console.warn(
        `${this._htOption.dotScale} is invalid, dotScale must greater than 0, less than or equal to 1, now reset to 1.`
      );

      this._htOption.dotScale = 1;
    }

    if (this._htOption.quietZoneSize < 0) {
      console.warn(
        `${this._htOption.quietZoneSize} is invalid, quietZoneSize must greater than or equal to 0, now reset to 0.`
      );

      this._htOption.quietZoneSize = 0;
    }

    if (
      this._htOption.quietZoneSizeUnit !== "pixel" &&
      this._htOption.quietZoneSizeUnit !== "module"
    ) {
      console.warn(
        `Quiet zone size unit '${this._htOption.quietZoneSizeUnit}' is invalid, reset to 'pixel'`
      );

      this._htOption.quietZoneSizeUnit = "pixel";
    }

    if (this._htOption.backgroundImageAlpha < 0 || this._htOption.backgroundImageAlpha > 1) {
      console.warn(
        `${this._htOption.backgroundImageAlpha} is invalid, backgroundImageAlpha must between 0 and 1, now reset to 1. `
      );

      this._htOption.backgroundImageAlpha = 1;
    }

    const shapeNumber = [1, 2, 3, 4];

    if (!shapeNumber.includes(this._htOption.dotStyle)) {
      console.warn(`Dot style '${this._htOption.dotStyle}' is invalid, reset to '1'`);

      this._htOption.dotStyle = 1;
    }

    if (!shapeNumber.includes(this._htOption.timingStyle)) {
      console.warn(`Timing style '${this._htOption.timingStyle}' is invalid, reset to 1`);

      this._htOption.timingStyle = 1;
    }

    if (!shapeNumber.slice(0, shapeNumber.length - 1).includes(this._htOption.positionStyle)) {
      console.warn(`Position style '${this._htOption.positionStyle}' is invalid, reset to 1`);

      this._htOption.positionStyle = 1;
    }

    if (!shapeNumber.slice(0, shapeNumber.length - 1).includes(this._htOption.alignmentStyle)) {
      console.warn(`Alignment style '${this._htOption.alignmentStyle}' is invalid, reset to 1`);

      this._htOption.alignmentStyle = 1;
    }

    this._oQRCode = null;
    this._oQRCode = new QRCodeModel(
      _getTypeNumber(this._htOption.text, this._htOption),
      this._htOption.correctLevel
    );
    this._oQRCode.addData(this._htOption.text);
    this._oQRCode.make();
  }

  /**
   * @name QRCode.CorrectLevel
   */
  static CorrectLevel = QRErrorCorrectLevel;

  /**
   * Support save PNG image file
   * @param {Object} path Make the QRCode
   */
  saveImage(saveOptions) {
    const defOptions = {
      makeType: "FILE",
      path: null
    };
    saveOptions = Object.assign(defOptions, saveOptions);

    const _oDrawing = new Drawing(this._htOption);
    _oDrawing.makeOptions = saveOptions;

    try {
      const t = this;
      return new Promise(resolve => {
        _oDrawing.resolve = resolve;
        _oDrawing.draw(t._oQRCode);
      });
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * get standard base64 image data url text: data:image/png;base64, ...
   */
  toDataURL(format) {
    const defOptions = {
      makeType: "URL"
    };

    const _oDrawing = new Drawing(this._htOption);
    _oDrawing.makeOptions = defOptions;

    try {
      const t = this;

      return new Promise(resolve => {
        _oDrawing.resolve = resolve;
        _oDrawing.draw(t._oQRCode);
      });
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = QRCode;
