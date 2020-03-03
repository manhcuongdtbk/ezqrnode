const { createCanvas, Image } = require("canvas");
const fs = require("fs");
const { QRCodeLimitLength, QRErrorCorrectLevel } = require("./core/constants");
const QRMath = require("./core/qr-math");
const QRCodeModel = require("./core/qr-code-model");
// Custom dot styles
const fillRoundedRect = require("./styles/rounded-rectangle");
const fillCircle = require("./styles/circle");
const fillStar = require("./styles/star");
const clearRoundedRect = require("./styles/clear-rounded-rectangle");
const clearCircle = require("./styles/clear-circle");

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

/**
 * Get the type by string length
 *
 * @private
 * @param {String} sText
 * @param {Number} nCorrectLevel
 * @return {Number} type
 */
function _getTypeNumber(sText, _htOption) {
  var nCorrectLevel = _htOption.correctLevel;
  var nType = 1;
  var length = _getUTF8Length(sText);

  for (var i = 0, len = QRCodeLimitLength.length; i <= len; i += 1) {
    var nLimit = 0;

    switch (nCorrectLevel) {
      case QRErrorCorrectLevel.L:
        nLimit = QRCodeLimitLength[i][0];
        break;
      case QRErrorCorrectLevel.M:
        nLimit = QRCodeLimitLength[i][1];
        break;
      case QRErrorCorrectLevel.Q:
        nLimit = QRCodeLimitLength[i][2];
        break;
      case QRErrorCorrectLevel.H:
        nLimit = QRCodeLimitLength[i][3];
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

  if(_htOption.version != 0){
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

function _getUTF8Length(sText) {
  var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');

  return replacedText.length + (replacedText.length != sText ? 3 : 0);
}

/**
 * Drawing QRCode by using canvas
 *
 * @constructor
 * @param {HTMLElement} el
 * @param {Object} htOption QRCode Options
 */
var Drawing = function (htOption) {
  this._bIsPainted = false;
  this._htOption = htOption;
  this._canvas = createCanvas(200, 200)
  this._oContext = this._canvas.getContext("2d");
  this._oContext.patternQuality = "best"; //'fast'|'good'|'best'|'nearest'|'bilinear'
  this._oContext.quality = "best"; //'fast'|'good'|'best'|'nearest'|'bilinear'
  this._oContext.textDrawingMode = "path"; // 'path'|'glyph'
  this._oContext.antialias = "gray"; // 'default'|'none'|'gray'|'subpixel'
  this._bSupportDataURI = null;
};

/**
 * Draw the QRCode
 *
 * @param {QRCode} oQRCode
 */
Drawing.prototype.draw = function (oQRCode) {
  var _oContext = this._oContext;
  var _htOption = this._htOption;

  var nCount = oQRCode.getModuleCount();
  var nWidth = Math.round(_htOption.width / nCount);
  var nHeight = Math.round(_htOption.height / nCount);

  if (_htOption.quietZoneSizeUnit === "module") {
    _htOption.quietZoneSize = nWidth * _htOption.quietZoneSize
  }

  this._htOption.width = nWidth * nCount;
  this._htOption.height = nHeight * nCount;
  this._canvas.width = this._htOption.width + this._htOption.quietZoneSize * 2;
  this._canvas.height = this._htOption.height + this._htOption.quietZoneSize * 2;

  var autoColorDark = "rgba(0, 0, 0, .6)";
  var autoColorLight = "rgba(255, 255, 255, .7)";

  // JPG
  if (_htOption.format === "JPG") {
    if (_htOption.quietZoneColor == "transparent") {
      _htOption.quietZoneColor = "#ffffff";
    }

    _htOption.logoBackgroundTransparent = false;

    autoColorDark = _htOption.colorDark;
    autoColorLight = _htOption.colorLight;
    notAutoColorLight = _htOption.colorLight;

    _oContext.fillStyle = "#ffffff";
    _oContext.fillRect(0, 0, this._canvas.width, this._canvas.height);
  }

  var t = this;

  function drawQuietZoneColor(){
    _oContext.lineWidth = 0;
    _oContext.fillStyle =  _htOption.quietZoneColor;

    // top
    _oContext.fillRect(0, 0, t._canvas.width, _htOption.quietZoneSize);
    // left
    _oContext.fillRect(
      0,
      _htOption.quietZoneSize,
      _htOption.quietZoneSize,
      t._canvas.height - _htOption.quietZoneSize * 2
    );
    // right
    _oContext.fillRect(
      t._canvas.width - _htOption.quietZoneSize,
      _htOption.quietZoneSize,
      _htOption.quietZoneSize,
      t._canvas.height - _htOption.quietZoneSize * 2
    );
    // bottom
    _oContext.fillRect(
      0,
      t._canvas.height - _htOption.quietZoneSize,
      t._canvas.width,
      _htOption.quietZoneSize
    );
  }

  if (_htOption.backgroundImage) {
    // backgroundImage
    var bgImg = new Image();

    bgImg.onload = function () {
      _oContext.globalAlpha = 1;
      _oContext.globalAlpha = _htOption.backgroundImageAlpha;
      _oContext.drawImage(
        bgImg,
        0,
        0,
        _htOption.width + _htOption.quietZoneSize * 2,
        _htOption.height + _htOption.quietZoneSize * 2
      );
      _oContext.globalAlpha = 1;

      drawQrcode.call(t, oQRCode);
    }

    bgImg.src = _htOption.backgroundImage;
    // DoSomething
  } else {
    // Add rotate QR Code without background around its center point
    var canvasXCenter = t._canvas.width / 2;
    var canvasYCenter = t._canvas.height / 2;
    _oContext.translate(canvasXCenter, canvasYCenter);
    _oContext.rotate(Math.PI / 180 * _htOption.degreeRotation);
    _oContext.translate(-canvasXCenter, -canvasYCenter);

    if (_htOption.backgroundColor) {
      fillBackgroundColor(_htOption.backgroundColor);
    }

    drawQrcode.call(t, oQRCode);
  }

  function fillBackgroundColor(backgroundColor) {
    _oContext.fillStyle = backgroundColor;
    _oContext.fillRect(
      _htOption.quietZoneSize,
      _htOption.quietZoneSize,
      _htOption.width,
      _htOption.height
    );
  }

  function drawQrcode(oQRCode) {
    for (var row = 0; row < nCount; row += 1) {
      for (var col = 0; col < nCount; col += 1) {
        var nLeft = col * nWidth + _htOption.quietZoneSize;
        var nTop = row * nHeight + _htOption.quietZoneSize;
        var bIsDark = oQRCode.isDark(row, col);
        var eye = oQRCode.getEye(row, col); // { isDark: true/false, type: PO_TL, PI_TL, PO_TR, PI_TR, PO_BL, PI_BL };
        var positionOuterDarkWidth = nWidth * 7 // width of one module * position outer dark module quantity
        var positionOuterDarkHeight = nHeight * 7
        var positionInnerLightWidth = nWidth * 5
        var positionInnerLightHeight = nHeight * 5
        var positionInnerDarkWidth = nWidth * 3
        var positionInnerDarkHeight = nHeight * 3

        // Position Outer Dark Top Left Top Left Corner [row column]
        var POD_TL_TLC = [0, 0]
        var isPOD_TL = false
        // Position Outer Dark Top Right Top Left Corner [row column]
        var POD_TR_TLC = [0, nCount - 7]
        var isPOD_TR = false
        // Position Outer Dark Bottom Left Top Left Corner [row column]
        var POD_BL_TLC = [nCount - 7, 0]
        var isPOD_BL = false
        // Position outer dark color
        var POD_color = null
        // Position inner dark color
        var PID_color = null

        if (row === POD_TL_TLC[0] && col === POD_TL_TLC[1]) {
          isPOD_TL = true
          POD_color = _htOption.PO_TL || _htOption.PO || _htOption.colorDark;
          PID_color = _htOption.PI_TL || _htOption.PI || _htOption.colorDark;
        } else if (row == POD_TR_TLC[0] && col == POD_TR_TLC[1]) {
          isPOD_TR = true;
          POD_color = _htOption.PO_TR || _htOption.PO || _htOption.colorDark;
          PID_color = _htOption.PI_TR || _htOption.PI || _htOption.colorDark;
        } else if (row == POD_BL_TLC[0] && col == POD_BL_TLC[1]) {
          isPOD_BL = true;
          POD_color = _htOption.PO_BL || _htOption.PO || _htOption.colorDark;
          PID_color = _htOption.PI_BL || _htOption.PI || _htOption.colorDark;
        }

        // Draw the whole position outer and inner
        if (isPOD_TL || isPOD_TR || isPOD_BL) {
          // Current Position Outer Dark Top Left Corner Coordinate
          var current_POD_TLC = [nLeft, nTop]
          // Position Inner Light Top Left Corner Coordinate
          var PIL_TLC = [current_POD_TLC[0] + nWidth, current_POD_TLC[1] + nHeight]
          // Position Inner Dark Top Left Corner Coordinate
          var PID_TLC = [PIL_TLC[0] + nWidth, PIL_TLC[1] + nWidth]

          _oContext.lineWidth = 0;

          switch (_htOption.positionStyle) {
            case "rectangle":
              // Draw fill rectangle for the outer position
              _oContext.strokeStyle = POD_color;
              _oContext.fillStyle = POD_color;
              _oContext.fillRect(
                current_POD_TLC[0],
                current_POD_TLC[1],
                positionOuterDarkWidth,
                positionOuterDarkHeight
              );

              // Clear unnecessary fill part inside the rectangle
              if (_htOption.backgroundColor) {
                _oContext.fillStyle = _htOption.backgroundColor
                _oContext.strokeStyle = _oContext.fillStyle
                _oContext.fillRect(
                  PIL_TLC[0],
                  PIL_TLC[1],
                  positionInnerLightWidth,
                  positionInnerLightHeight
                );
              } else {
                _oContext.clearRect(
                  PIL_TLC[0],
                  PIL_TLC[1],
                  positionInnerLightWidth,
                  positionInnerLightHeight
                );
              }

              // Draw fill rectangle for the inner position
              _oContext.strokeStyle = PID_color;
              _oContext.fillStyle = PID_color;
              _oContext.fillRect(
                PID_TLC[0],
                PID_TLC[1],
                positionInnerDarkWidth,
                positionInnerDarkHeight
              );
              break;
            case "roundedRectangle":
              // Draw fill rounded rectangle for the outer position
              _oContext.strokeStyle = POD_color;
              _oContext.fillStyle = POD_color;
              fillRoundedRect(
                _oContext,
                current_POD_TLC[0],
                current_POD_TLC[1],
                positionOuterDarkWidth,
                positionOuterDarkHeight,
                30
              );

              // Clear unnecessary fill part inside the rounded rectangle
              if (_htOption.backgroundColor) {
                _oContext.fillStyle = _htOption.backgroundColor
                _oContext.strokeStyle = _oContext.fillStyle
                fillRoundedRect(
                  _oContext,
                  PIL_TLC[0],
                  PIL_TLC[1],
                  positionInnerLightWidth,
                  positionInnerLightHeight,
                  30
                );
              } else {
                clearRoundedRect(
                  _oContext,
                  PIL_TLC[0],
                  PIL_TLC[1],
                  positionInnerLightWidth,
                  positionInnerLightHeight,
                  30
                );
              }

              // Draw fill rounded rectangle for the inner position
              _oContext.strokeStyle = PID_color;
              _oContext.fillStyle = PID_color;
              fillRoundedRect(
                _oContext,
                PID_TLC[0],
                PID_TLC[1],
                positionInnerDarkWidth,
                positionInnerDarkHeight,
                30
              );
              break;
            case "circle":
              // Draw circle for the outer position
              _oContext.strokeStyle = POD_color;
              _oContext.fillStyle = POD_color;
              fillCircle(_oContext, current_POD_TLC[0], current_POD_TLC[1], positionOuterDarkWidth);

              // Clear unnecessary fill part inside the circle
              if (_htOption.backgroundColor) {
                _oContext.fillStyle = _htOption.backgroundColor
                _oContext.strokeStyle = _oContext.fillStyle
                fillCircle(_oContext, PIL_TLC[0], PIL_TLC[1], positionInnerLightWidth)
              } else {
                clearCircle(_oContext, PIL_TLC[0], PIL_TLC[1], positionInnerLightWidth)
              }

              // Draw circle for the inner position
              _oContext.strokeStyle = PID_color;
              _oContext.fillStyle = PID_color;
              fillCircle(_oContext, PID_TLC[0], PID_TLC[1], positionInnerDarkWidth)
              break;
          }

          // Skip other column of the position outer dark
          col += 6;
        }
        // Draw timing module and data module
        else {
          if (eye) {
            if (eye.type === 'PO_TL' || eye.type === 'PO_TR' || eye.type === 'PO_BL') {
              // Skip other column of the position outer dark
              col += 6
            } else if (eye.type === 'AO') {
              // Current QRCode version
              // console.log(oQRCode.typeNumber)
              if (eye.specialPosition == 'TLC') {
                // Current Alignment Outer Dark Top Left Corner Coordinate
                var current_AOD_TLC = [nLeft, nTop]
                var AIL_TLC = [current_AOD_TLC[0] + nWidth, current_AOD_TLC[1] + nHeight]
                var AID = [AIL_TLC[0] + nWidth, AIL_TLC[1] + nWidth]
                var alignmentOuterDarkWidth = nWidth * 5
                var alignmentOuterDarkHeight = nHeight * 5
                var alignmentInnerLightWidth = nWidth * 3
                var alignmentInnerLightHeight = nHeight * 3
                var alignmentInnerDarkWidth = nWidth
                var alignmentInnerDarkHeight = nHeight

                // Alignment outer dark color
                var AOD_color = _htOption['AO'] || _htOption.colorDark
                // TODO: Custom alignment inner dark color
                var AID_color = _htOption['AI'] || _htOption.colorDark

                switch (_htOption.alignmentStyle) {
                  case 'rectangle':
                    // Draw fill rectangle for the outer position
                    _oContext.strokeStyle = AOD_color;
                    _oContext.fillStyle = AOD_color;
                    _oContext.fillRect(
                      current_AOD_TLC[0],
                      current_AOD_TLC[1],
                      alignmentOuterDarkWidth,
                      alignmentOuterDarkHeight
                    );

                    // Clear unnecessary fill part inside the rectangle
                    if (_htOption.backgroundColor) {
                      _oContext.fillStyle = _htOption.backgroundColor;
                      _oContext.strokeStyle = _oContext.fillStyle;
                      _oContext.fillRect(
                        AIL_TLC[0],
                        AIL_TLC[1],
                        alignmentInnerLightWidth,
                        alignmentInnerLightHeight
                      );
                    } else {
                      _oContext.clearRect(
                        AIL_TLC[0],
                        AIL_TLC[1],
                        alignmentInnerLightWidth,
                        alignmentInnerLightHeight
                      );
                    }

                    // Draw fill rectangle for the inner position
                    _oContext.strokeStyle = AID_color;
                    _oContext.fillStyle = AID_color;
                    _oContext.fillRect(
                      AID[0],
                      AID[1],
                      alignmentInnerDarkWidth,
                      alignmentInnerDarkHeight
                    );
                    break;
                  case 'roundedRectangle':
                    // Draw fill rounded rectangle for the outer position
                    _oContext.strokeStyle = AOD_color;
                    _oContext.fillStyle = AOD_color;
                    fillRoundedRect(
                      _oContext,
                      current_AOD_TLC[0],
                      current_AOD_TLC[1],
                      alignmentOuterDarkWidth,
                      alignmentOuterDarkHeight,
                      30
                    );

                    // Clear unnecessary fill part inside the rounded rectangle
                    if (_htOption.backgroundColor) {
                      _oContext.fillStyle = _htOption.backgroundColor;
                      _oContext.strokeStyle = _oContext.fillStyle;
                      fillRoundedRect(
                        _oContext,
                        AIL_TLC[0],
                        AIL_TLC[1],
                        alignmentInnerLightWidth,
                        alignmentInnerLightHeight,
                        30
                      );
                    } else {
                      clearRoundedRect(
                        _oContext,
                        AIL_TLC[0],
                        AIL_TLC[1],
                        alignmentInnerLightWidth,
                        alignmentInnerLightHeight,
                        30
                      );
                    }

                    // Draw fill rounded rectangle for the inner position
                    _oContext.strokeStyle = AID_color;
                    _oContext.fillStyle = AID_color;
                    fillRoundedRect(
                      _oContext,
                      AID[0],
                      AID[1],
                      alignmentInnerDarkWidth,
                      alignmentInnerDarkHeight,
                      30
                    );
                    break;
                  case "circle":
                    // Draw fill circle for the outer position
                    _oContext.strokeStyle = AOD_color;
                    _oContext.fillStyle = AOD_color;
                    fillCircle(
                      _oContext,
                      current_AOD_TLC[0],
                      current_AOD_TLC[1],
                      alignmentOuterDarkWidth
                    );

                    // Clear unnecessary fill part inside the circle
                    if (_htOption.backgroundColor) {
                      _oContext.fillStyle = _htOption.backgroundColor;
                      _oContext.strokeStyle = _oContext.fillStyle;
                      fillCircle(_oContext, AIL_TLC[0], AIL_TLC[1], alignmentInnerLightWidth);
                    } else {
                      clearCircle(_oContext, AIL_TLC[0], AIL_TLC[1], alignmentInnerLightWidth)
                    }

                    // Draw fill circle for the inner position
                    _oContext.strokeStyle = AID_color;
                    _oContext.fillStyle = AID_color;
                    fillCircle(_oContext, AID[0], AID[1], alignmentInnerDarkWidth)
                    break;
                }
              }

              // Skip other column of the alignment outer dark
              col += 4
            }
          } else {
            var nowDotScale = _htOption.dotScale;
            // Top left coordinate of the dot
            var dotX = nLeft + nWidth * (1 - nowDotScale) / 2
            var dotY = nTop + nHeight * (1 - nowDotScale) / 2
            var dotWidth = nWidth * nowDotScale
            var dotHeight = nHeight * nowDotScale

            // Draw dot background to increase contrast on hard to see position in the background image
            var dotBackgroundDarkColor = 'rgba(0, 0, 0, 0.180)'
            var dotBackgroundLightColor = "rgba(255, 255, 255, 0.435)";
            _oContext.fillStyle = bIsDark ? dotBackgroundDarkColor : dotBackgroundLightColor
            _oContext.strokeStyle = _oContext.fillStyle
            _oContext.fillRect(nLeft, nTop, nWidth, nHeight);

            // TODO: change to appropriate color
            _oContext.lineWidth = 0;
            _oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
            _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;

            // Horizontal timing pattern
            if (row == 6) {
              var timingHColorDark = _htOption.timing_H || _htOption.timing || _htOption.colorDark;
              _oContext.fillStyle = bIsDark ? timingHColorDark : _htOption.colorLight;
              _oContext.strokeStyle = _oContext.fillStyle;

              switch (_htOption.timingStyle) {
                case "roundedRectangle":
                  fillRoundedRect(_oContext, dotX, dotY, dotWidth, dotHeight);
                  break;
                case "rectangle":
                  _oContext.fillRect(dotX, dotY, dotWidth, dotHeight);
                  break;
                case "circle":
                  fillCircle(_oContext, dotX, dotY, nWidth, nowDotScale);
                  break;
                case "star":
                  // Only support dotScale 0.5
                  fillStar(
                    _oContext,
                    dotX + nWidth / 4,
                    dotY + nWidth / 4,
                    4,
                    (nWidth * nowDotScale) / 2,
                    (nWidth * nowDotScale) / 4
                  );
                  break;
              }
            }
            // Vertical timing pattern
            else if (col == 6) {
              var timingVColorDark = _htOption.timing_V || _htOption.timing || _htOption.colorDark;
              _oContext.fillStyle = bIsDark ? timingVColorDark : _htOption.colorLight;
              _oContext.strokeStyle = _oContext.fillStyle;

              switch (_htOption.timingStyle) {
                case "roundedRectangle":
                  fillRoundedRect(_oContext, dotX, dotY, dotWidth, dotHeight);
                  break;
                case "rectangle":
                  _oContext.fillRect(dotX, dotY, dotWidth, dotHeight);
                  break;
                case "circle":
                  fillCircle(_oContext, dotX, dotY, nWidth, nowDotScale);
                  break;
                case "star":
                  // Only support dotScale 0.5
                  fillStar(
                    _oContext,
                    dotX + nWidth / 4,
                    dotY + nWidth / 4,
                    4,
                    (nWidth * nowDotScale) / 2,
                    (nWidth * nowDotScale) / 4
                  );
                  break;
              }
            }
            // Data module
            else {
              if (_htOption.backgroundImage) {
                if (_htOption.autoColor) {
                  _oContext.fillStyle = bIsDark ? autoColorDark : autoColorLight;
                } else {
                  _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
                }

                _oContext.strokeStyle = _oContext.fillStyle;
              } else {
                _oContext.strokeStyle = _oContext.fillStyle;
              }

              switch (_htOption.dotStyle) {
                case "roundedRectangle":
                  fillRoundedRect(_oContext, dotX, dotY, dotWidth, dotHeight);
                  break;
                case "rectangle":
                  _oContext.fillRect(dotX, dotY, dotWidth, dotHeight);
                  break;
                case "circle":
                  fillCircle(_oContext, dotX, dotY, nWidth, nowDotScale);
                  break;
                case "star":
                  // Only support dotScale 0.5
                  fillStar(
                    _oContext,
                    dotX + nWidth / 4,
                    dotY + nWidth / 4,
                    4,
                    (nWidth * nowDotScale) / 2,
                    (nWidth * nowDotScale) / 4
                  );
                  break;
              }
            }
          }
        }

        if (_htOption.dotScale != 1 && !eye) {
          _oContext.strokeStyle = _htOption.colorLight;
        }
      }
    }

    if (_htOption.logo) {
      var img = new Image();
      img.src = _htOption.logo;
      var _this = this;

      function genratorImg() {
        var imgW = Math.round(_htOption.width / 3.5);
        var imgH = Math.round(_htOption.height / 3.5);

        if (imgW != imgH) {
          imgW = imgH;
        }

        if (_htOption.logoWidth) {
          imgW = Math.round(_htOption.logoWidth);
        }

        if (_htOption.logoHeight) {
          imgH = Math.round(_htOption.logoHeight);
        }

        // Did Not Use Transparent Logo Image
        if (!_htOption.logoBackgroundTransparent) {
          //if (!_htOption.logoBackgroundColor) {
          //_htOption.logoBackgroundColor = '#ffffff';
          //}
          _oContext.fillStyle = _htOption.logoBackgroundColor;

          _oContext.fillRect(
            (_htOption.width + _htOption.quietZoneSize * 2 - imgW) / 2,
            (_htOption.height + _htOption.quietZoneSize * 2 - imgH) / 2,
            imgW,
            imgW
          );
        }

        _oContext.drawImage(
          img,
          (_htOption.width + _htOption.quietZoneSize * 2 - imgW) / 2,
          (_htOption.height + _htOption.quietZoneSize * 2 - imgH) / 2,
          imgW,
          imgH
        );

        _this._bIsPainted = true;

        if (_htOption.quietZoneSize > 0 && _htOption.quietZoneColor) {
          drawQuietZoneColor();
        }

        _this.makeImage();
      }

      img.onload = function () {
        genratorImg();
      }

      img.onerror = function (e) {
        console.error(e)
      }

      if (img.complete) {
        img.onload = null;
        genratorImg();

        return;
      }
    } else {
      this._bIsPainted = true;

      if (_htOption.quietZoneSize > 0 && _htOption.quietZoneColor) {
        drawQuietZoneColor();
      }

      this.makeImage();
    }
  }
};

/**
 * Make the image from Canvas
 */
Drawing.prototype.makeImage = function () {
  var makeOptions = this.makeOptions;
  var t = this;

  if (makeOptions.makeType == "FILE") {
    if (this._htOption.onRenderingStart) {
      this._htOption.onRenderingStart(this._htOption);
    }

    var out = fs.createWriteStream(makeOptions.path)
    var stream = undefined;

    if (this._htOption.format === "PNG") {
      stream = this._canvas.createPNGStream({ compressionLevel: this._htOption.compressionLevel });
    } else {
      stream = this._canvas.createJPEGStream({ quality: this._htOption.quality });
    }

    stream.pipe(out);

    out.on("finish", () => {
      t.resolve({});
    });
  } else if (makeOptions.makeType === "URL") {
    if (this._htOption.onRenderingStart) {
      this._htOption.onRenderingStart(this._htOption);
    }

    if (this._htOption.format === "PNG") {
      // dataUrl = this._canvas.toDataURL()
      this._canvas.toDataURL((err, data) => {
        t.resolve(data);
      }); // defaults to PNG
    } else{
      this._canvas.toDataURL("image/jpeg", (err, data) => {
        t.resolve(data);
      });
    }
  }
};

/**
 * Return whether the QRCode is painted or not
 *
 * @return {Boolean}
 */
Drawing.prototype.isPainted = function () {
  return this._bIsPainted;
};

/**
 * @private
 * @param {Number} nNumber
 */
Drawing.prototype.round = function (nNumber) {
  if (!nNumber) {
    return nNumber;
  }

  return Math.floor(nNumber * 1000) / 1000;
};

function QRCode(vOption) {
  this._htOption = {
    width: 256,
    height: 256,
    typeNumber: 4,
    colorDark: "rgba(0, 0, 0, 0.6)",
    colorLight: "rgba(255, 255, 255, 0.7)",
    backgroundColor: null, // CSS color of the QR Code module's background, default to null (transparent)
    correctLevel: QRCode.CorrectLevel.M,

    dotScale: 1, // Must be greater than 0, less than or equal to 1. default is 1

    quietZoneSize: 0, // Must be greater than or equal to 0. default is 0
    quietZoneSizeUnit: "pixel", // 'pixel', 'module'
    quietZoneColor: "transparent",

    logo: undefined,
    logoWidth: undefined,
    logoHeight: undefined,
    logoBackgroundColor: "#ffffff",
    logoBackgroundTransparent: false,

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
    format: "PNG", // 'PNG', 'JPG'
    compressionLevel: 0, // ZLIB compression level (0-9). default is 0
    quality: 0.75, // An object specifying the quality (0 to 1). default is 0.75. (JPGs only)

    // ==== Versions
    version: 0, // The symbol versions of QR Code range from Version 1 to Version 40. default 0 means automatically choose the closest version based on the text length.

    // ==== Dot Style
    dotStyle: "rectangle", // 'rectangle', 'roundedRectangle', 'circle', 'star'

    // ==== Timing style
    timingStyle: "rectangle", // 'rectangle', 'roundedRectangle', 'circle', 'star'

    // ==== Position style
    positionStyle: "rectangle", // 'rectangle', 'roundedRectangle', 'circle'

    // ==== Alignment style
    alignmentStyle: "rectangle", // 'rectangle', 'roundedRectangle', 'circle'

    // ==== Degree Rotation
    degreeRotation: 0, // 0, 90, 180, 270
  };

  if (typeof vOption === "string") {
    vOption = {
      text: vOption
    };
  }

  var NUMBER_TYPE_OPTIONS = [
    "width",
    "height",
    "dotScale",
    "quietZoneSize",
    "logoWidth",
    "logoHeight",
    "backgroundImageAlpha",
    "compressionLevel",
    "quality",
    "version",
    "degreeRotation"
  ];

  // Overwrites options
  if (vOption) {
    for (var i in vOption) {
      // Type cast received parameters
      if (NUMBER_TYPE_OPTIONS.includes(i)) {
        vOption[i] = Number(vOption[i])
      }

      this._htOption[i] = vOption[i];
    }
  }

  if (this._htOption.version < 0 || this._htOption.version > 40) {
    console.warn(`QR Code version '${this._htOption.version}' is invalidate, reset to 0`)
    this._htOption.version = 0;
  }

  this._htOption.format = this._htOption.format.toUpperCase();

  if (this._htOption.format != 'PNG' && this._htOption.format != 'JPG'){
    console.warn("Image format '"+this._htOption.format+"' is invalidate, reset to 'PNG'")
    this._htOption.format='PNG';
  }

  if (
    this._htOption.format == "PNG" &&
    (this._htOption.compressionLevel < 0 || this._htOption.compressionLevel > 9)
  ) {
    console.warn(
      `${this._htOption.compressionLevel} is invalidate, PNG compressionLevel must between 0 and 9, now reset to 0. `
    );
    this._htOption.compressionLevel = 0;
  } else if (this._htOption.quality < 0 || this._htOption.quality > 1) {
    console.warn(
      `${this._htOption.quality} is invalidate, JPG quality must between 0 and 1, now reset to 0.75. `
    );
    this._htOption.quality = 0.75;
  }

  if (this._htOption.dotScale < 0 || this._htOption.dotScale > 1) {
    console.warn(
      `${this._htOption.dotScale} is invalidate, dotScale must greater than 0, less than or equal to 1, now reset to 1.`
    );

    this._htOption.dotScale = 1;
  }

  if (this._htOption.quietZoneSize < 0) {
    console.warn(
      `${this._htOption.quietZoneSize} is invalidate, quietZoneSize must greater than or equal to 0, now reset to 0.`
    );

    this._htOption.quietZoneSize = 0;
  }

  if (
    this._htOption.quietZoneSizeUnit !== "pixel" &&
    this._htOption.quietZoneSizeUnit !== "module"
  ) {
    console.warn(
      `Quiet zone size unit '${this._htOption.quietZoneSizeUnit}' is invalidate, reset to 'pixel'`
    );

    this._htOption.quietZoneSizeUnit = 'pixel';
  }

  if (this._htOption.backgroundImageAlpha < 0 || this._htOption.backgroundImageAlpha > 1) {
    console.warn(
      `${this._htOption.backgroundImageAlpha} is invalidate, backgroundImageAlpha must between 0 and 1, now reset to 1. `
    );

    this._htOption.backgroundImageAlpha = 1;
  }

  if (
    this._htOption.dotStyle !== "rectangle" &&
    this._htOption.dotStyle !== "roundedRectangle" &&
    this._htOption.dotStyle !== "circle" &&
    this._htOption.dotStyle !== "star"
  ) {
    console.warn(`Dot style '${this._htOption.dotStyle}' is invalidate, reset to 'rectangle'`);

    this._htOption.dotStyle = "rectangle";
  }

  if (
    this._htOption.timingStyle !== "rectangle" &&
    this._htOption.timingStyle !== "roundedRectangle" &&
    this._htOption.timingStyle !== "circle" &&
    this._htOption.timingStyle !== "star"
  ) {
    console.warn(
      `Timing style '${this._htOption.timingStyle}' is invalidate, reset to 'rectangle'`
    );

    this._htOption.timingStyle = "rectangle";
  }

  if (
    this._htOption.positionStyle !== "rectangle" &&
    this._htOption.positionStyle !== "roundedRectangle" &&
    this._htOption.positionStyle !== "circle"
  ) {
    console.warn(
      `Position style '${this._htOption.positionStyle}' is invalidate, reset to 'rectangle'`
    );

    this._htOption.positionStyle = "rectangle";
  }

  if (
    this._htOption.alignmentStyle !== "rectangle" &&
    this._htOption.alignmentStyle !== "roundedRectangle" &&
    this._htOption.alignmentStyle !== "circle"
  ) {
    console.warn(
      `Alignment style '${this._htOption.alignmentStyle}' is invalidate, reset to 'rectangle'`
    );

    this._htOption.alignmentStyle = "rectangle";
  }

  this._oQRCode = null;
  this._oQRCode = new QRCodeModel(_getTypeNumber(this._htOption.text, this._htOption), this._htOption.correctLevel);
  this._oQRCode.addData(this._htOption.text);
  this._oQRCode.make();
}

/**
 * Support save PNG image file
 * @param {Object} path Make the QRCode
 */
QRCode.prototype.saveImage = function (saveOptions) {
  var defOptions = {
    makeType: "FILE",
    path: null
  }
  saveOptions = Object.assign(defOptions, saveOptions);

  var _oDrawing = new Drawing(this._htOption);
  _oDrawing.makeOptions = saveOptions;

  try {
    var t = this;
    return new Promise(resolve => {
      _oDrawing.resolve = resolve;
      _oDrawing.draw(t._oQRCode);
    })
  } catch (e) {
    console.error(e)
  }
};

/**
 * get standard base64 image data url text: data:image/png;base64, ...
 */
QRCode.prototype.toDataURL = function (format) {
  var defOptions = {
    makeType: "URL"
  }

  var _oDrawing = new Drawing(this._htOption);
  _oDrawing.makeOptions = defOptions;

  try {
    var t = this;

    return new Promise(resolve => {
      _oDrawing.resolve = resolve;
      _oDrawing.draw(t._oQRCode);
    })
  } catch (e) {
    console.error(e)
  }
};

/**
 * @name QRCode.CorrectLevel
 */
QRCode.CorrectLevel = QRErrorCorrectLevel;

module.exports = QRCode;
