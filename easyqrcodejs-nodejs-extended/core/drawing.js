/* eslint-disable no-underscore-dangle */
const { createCanvas, Image } = require("canvas");
const fs = require("fs");
const { QRErrorCorrectLevel } = require("./constants");
// Custom dot styles
const fillRounded = require("../styles/rounded");
const fillCircle = require("../styles/circle");
const fillStar = require("../styles/star");
const clearRounded = require("../styles/clear-rounded");
const clearCircle = require("../styles/clear-circle");

class Drawing {
  constructor(htOption) {
    this._bIsPainted = false;
    this._htOption = htOption;
    this._canvas = createCanvas(200, 200);
    this._oContext = this._canvas.getContext("2d");
    this._oContext.patternQuality = "best"; // 'fast'|'good'|'best'|'nearest'|'bilinear'
    this._oContext.quality = "best"; // 'fast'|'good'|'best'|'nearest'|'bilinear'
    this._oContext.textDrawingMode = "path"; // 'path'|'glyph'
    this._oContext.antialias = "gray"; // 'default'|'none'|'gray'|'subpixel'
    this._bSupportDataURI = null;
  }

  /**
   * Draw the QRCode
   *
   * @param {QRCode} oQRCode
   */
  draw(oQRCode) {
    const { _oContext } = this;
    const { _htOption } = this;

    const nCount = oQRCode.getModuleCount();
    const nSize = Math.round(_htOption.size / nCount);

    if (_htOption.quietZoneSizeUnit === "module") {
      _htOption.quietZoneSize *= nSize;
    }

    this._htOption.size = nSize * nCount;
    this._canvas.width = this._htOption.size + this._htOption.quietZoneSize * 2;
    this._canvas.height = this._canvas.width;

    let autoColorDark = "rgba(0, 0, 0, .6)";
    let autoColorLight = "rgba(255, 255, 255, .7)";

    // JPG
    if (_htOption.format === "JPG") {
      if (_htOption.quietZoneColor === "transparent") {
        _htOption.quietZoneColor = "#ffffff";
      }

      _htOption.logoBackgroundTransparent = false;

      autoColorDark = _htOption.colorDark;
      autoColorLight = _htOption.colorLight;

      _oContext.fillStyle = "#ffffff";
      _oContext.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    const drawQuietZoneColor = () => {
      _oContext.lineWidth = 0;
      _oContext.fillStyle = _htOption.quietZoneColor;

      // top
      _oContext.fillRect(0, 0, this._canvas.width, _htOption.quietZoneSize);
      // left
      _oContext.fillRect(
        0,
        _htOption.quietZoneSize,
        _htOption.quietZoneSize,
        this._canvas.height - _htOption.quietZoneSize * 2
      );
      // right
      _oContext.fillRect(
        this._canvas.width - _htOption.quietZoneSize,
        _htOption.quietZoneSize,
        _htOption.quietZoneSize,
        this._canvas.height - _htOption.quietZoneSize * 2
      );
      // bottom
      _oContext.fillRect(
        0,
        this._canvas.height - _htOption.quietZoneSize,
        this._canvas.width,
        _htOption.quietZoneSize
      );
    };

    function fillBackgroundColor(backgroundColor) {
      _oContext.fillStyle = backgroundColor;
      _oContext.fillRect(
        _htOption.quietZoneSize,
        _htOption.quietZoneSize,
        _htOption.size,
        _htOption.size
      );
    }

    function drawShape(x, y, width, height, styleType, scale = 1, context) {
      // eslint-disable-next-line default-case
      switch (styleType) {
        case 1:
          context.fillRect(x, y, width, height);
          break;
        case 2:
          fillRounded(context, x, y, width, height);
          break;
        case 3:
          fillCircle(context, x, y, width);
          break;
        case 4:
          // Only support dotScale 0.5
          fillStar(
            context,
            x + nSize / 4,
            y + nSize / 4,
            4,
            (nSize * scale) / 2,
            (nSize * scale) / 4
          );
          break;
      }
    }

    function clearShape(x, y, width, height, styleType, context) {
      // eslint-disable-next-line default-case
      switch (styleType) {
        case 1:
          context.clearRect(x, y, width, height);
          break;
        case 2:
          clearRounded(context, x, y, width, height);
          break;
        case 3:
          clearCircle(context, x, y, width);
          break;
      }
    }

    function drawEye(
      outerDarkX,
      outerDarkY,
      outerDarkSize,
      outerDarkColor,
      innerDarkColor,
      styleType,
      isDrawOuterLight
    ) {
      const innerLightX = outerDarkX + nSize;
      const innerLightY = outerDarkY + nSize;
      const innerDarkX = innerLightX + nSize;
      const innerDarkY = innerLightY + nSize;
      const eyeEdgeSize = nSize * 2;
      const innerLightSize = outerDarkSize - eyeEdgeSize;
      const innerDarkSize = innerLightSize - eyeEdgeSize;
      const outerLightX = outerDarkX - nSize;
      const outerLightY = outerDarkY - nSize;
      const outerLightSize = outerDarkSize + eyeEdgeSize;
      const outerLightColor = "rgba(255, 255, 255, 0.7)";

      _oContext.lineWidth = 0;

      // Outer Light
      if (isDrawOuterLight) {
        _oContext.fillStyle = outerLightColor;
        _oContext.strokeStyle = _oContext.fillStyle;
        drawShape(
          outerLightX,
          outerLightY,
          outerLightSize,
          outerLightSize,
          styleType,
          1,
          _oContext
        );
        clearShape(outerDarkX, outerDarkY, outerDarkSize, outerDarkSize, styleType, _oContext);
      }

      // Outer Dark
      _oContext.fillStyle = outerDarkColor;
      _oContext.strokeStyle = _oContext.fillStyle;
      drawShape(outerDarkX, outerDarkY, outerDarkSize, outerDarkSize, styleType, 1, _oContext);

      // Inner Light
      if (_htOption.backgroundColor) {
        _oContext.fillStyle = _htOption.backgroundColor;
        _oContext.strokeStyle = _oContext.fillStyle;
        drawShape(
          innerLightX,
          innerLightY,
          innerLightSize,
          innerLightSize,
          styleType,
          1,
          _oContext
        );
        clearShape(innerDarkX, innerDarkY, innerDarkSize, innerDarkSize, styleType, _oContext);
      } else if (_htOption.visualeadMode) {
        _oContext.fillStyle = outerLightColor;
        _oContext.strokeStyle = _oContext.fillStyle;
        drawShape(
          innerLightX,
          innerLightY,
          innerLightSize,
          innerLightSize,
          styleType,
          1,
          _oContext
        );
        clearShape(innerDarkX, innerDarkY, innerDarkSize, innerDarkSize, styleType, _oContext);
      } else {
        clearShape(innerLightX, innerLightY, innerLightSize, innerLightSize, styleType, _oContext);
      }

      // Inner Dark
      _oContext.fillStyle = innerDarkColor;
      _oContext.strokeStyle = _oContext.fillStyle;
      drawShape(innerDarkX, innerDarkY, innerDarkSize, innerDarkSize, styleType, 1, _oContext);
    }

    function setupPlaceHolder() {
      const logoPlaceholderModules = [];

      if (_htOption.logoPlaceholder && !_htOption.logo) {
        // Error correction percentage, based on error correction level
        let correctPercent = null;
        let complementaryModuleCount = null;
        const calculatedQRVersion = oQRCode.typeNumber;

        // eslint-disable-next-line default-case
        switch (_htOption.correctLevel) {
          case QRErrorCorrectLevel.L:
            correctPercent = 7 / 100; // 7%

            if (calculatedQRVersion >= 1 && calculatedQRVersion <= 12) {
              complementaryModuleCount = 1;
            } else if (calculatedQRVersion >= 13) {
              throw new Error("QR Code's Version is too high, can't make the logo placeholder");
              // complementaryModuleCount = 3; // Should not go furthur than this version
            }

            break;
          case QRErrorCorrectLevel.M:
            correctPercent = 15 / 100; // 15%

            if (calculatedQRVersion >= 1 && calculatedQRVersion <= 12) {
              complementaryModuleCount = 2;
            } else if (calculatedQRVersion >= 13) {
              throw new Error("QR Code's Version is too high, can't make the logo placeholder");
              // complementaryModuleCount = 8; // Should not go furthur than this version
            }

            break;
          case QRErrorCorrectLevel.Q:
            correctPercent = 25 / 100; // 25%

            if (calculatedQRVersion >= 1 && calculatedQRVersion <= 12) {
              complementaryModuleCount = 3;
            } else if (calculatedQRVersion >= 13) {
              throw new Error("QR Code's Version is too high, can't make the logo placeholder");
              // complementaryModuleCount = 4; // Should not go furthur than this version
            }

            break;
          case QRErrorCorrectLevel.H:
            correctPercent = 30 / 100; // 30%

            if (calculatedQRVersion >= 1 && calculatedQRVersion <= 12) {
              complementaryModuleCount = 3;
            } else if (calculatedQRVersion >= 13) {
              throw new Error("QR Code's Version is too high, can't make the logo placeholder");
              // complementaryModuleCount = 9; // Should not go furthur than this version
            }

            break;
        }

        // Calculate the top left corner's coordinate of the top left corner data module that forms
        // a blank space square around QR Module's center point.
        // Original explaination: https://math.stackexchange.com/a/1490157/756903
        const centerPointX = (nCount / 2) * nSize + _htOption.quietZoneSize;
        const centerPointY = (nCount / 2) * nSize + _htOption.quietZoneSize;
        const QRModuleCount = nCount * nCount;
        const placeholderModuleCount = QRModuleCount * correctPercent;
        const placeholderEdgeModuleCount = Math.floor(Math.sqrt(placeholderModuleCount));
        const placeholderEdgeWidth = placeholderEdgeModuleCount * nSize;
        const placeholderTLCX = centerPointX - placeholderEdgeWidth / 2; // Top left corner X coordinate
        const placeholderTLCY = centerPointY - placeholderEdgeWidth / 2; // Top left corner Y coordinate
        const placeholderTLCrow =
          Math.floor((placeholderTLCX - _htOption.quietZoneSize) / nSize) + 1;
        const placeholderTLCcolumn =
          Math.floor((placeholderTLCY - _htOption.quietZoneSize) / nSize) + 1;

        for (
          let row = placeholderTLCrow + complementaryModuleCount;
          row < placeholderTLCrow + placeholderEdgeModuleCount - complementaryModuleCount;
          row += 1
        ) {
          for (
            let column = placeholderTLCcolumn + complementaryModuleCount;
            column < placeholderTLCcolumn + placeholderEdgeModuleCount - complementaryModuleCount;
            column += 1
          ) {
            logoPlaceholderModules.push([row, column]);
          }
        }
      }

      return logoPlaceholderModules;
    }

    const drawQrcode = () => {
      const logoPlaceholderModules = setupPlaceHolder();

      for (let row = 0; row < nCount; row += 1) {
        for (let col = 0; col < nCount; col += 1) {
          if (
            logoPlaceholderModules.length !== 0 &&
            logoPlaceholderModules[0][0] === row &&
            logoPlaceholderModules[0][1] === col
          ) {
            logoPlaceholderModules.shift();
            continue;
          }

          const nLeft = col * nSize + _htOption.quietZoneSize;
          const nTop = row * nSize + _htOption.quietZoneSize;
          const bIsDark = oQRCode.isDark(row, col);
          const eye = oQRCode.getEye(row, col);

          if (eye) {
            const eyeType = eye.type;
            let outerDarkColor = null;
            let innerDarkColor = null;

            // Common for "POD_TL_TLC", "POD_TR_TLC", "POD_BL_TLC" eyeType
            let eyeSize = nSize * 7;
            let styleType = _htOption.positionStyle;
            let remainingEyeColumn = _htOption.visualeadMode ? 7 : 6;

            // Draw the whole position outer and inner
            if (eyeType) {
              if (eyeType === "POD_TL_TLC") {
                outerDarkColor = _htOption.PO_TL || _htOption.PO || _htOption.colorDark;
                innerDarkColor = _htOption.PI_TL || _htOption.PI || _htOption.colorDark;

                drawEye(
                  nLeft,
                  nTop,
                  eyeSize,
                  outerDarkColor,
                  innerDarkColor,
                  styleType,
                  _htOption.visualeadMode
                );
              } else if (eyeType === "POD_TR_TLC") {
                outerDarkColor = _htOption.PO_TR || _htOption.PO || _htOption.colorDark;
                innerDarkColor = _htOption.PI_TR || _htOption.PI || _htOption.colorDark;

                drawEye(
                  nLeft,
                  nTop,
                  eyeSize,
                  outerDarkColor,
                  innerDarkColor,
                  styleType,
                  _htOption.visualeadMode
                );
              } else if (eyeType === "POD_BL_TLC") {
                outerDarkColor = _htOption.PO_BL || _htOption.PO || _htOption.colorDark;
                innerDarkColor = _htOption.PI_BL || _htOption.PI || _htOption.colorDark;

                drawEye(
                  nLeft,
                  nTop,
                  eyeSize,
                  outerDarkColor,
                  innerDarkColor,
                  styleType,
                  _htOption.visualeadMode
                );
              } else if (eyeType === "AOD_TLC") {
                // Current QRCode version
                // console.log(oQRCode.typeNumber)
                outerDarkColor = _htOption.AO || _htOption.colorDark;
                innerDarkColor = _htOption.AI || _htOption.colorDark;
                eyeSize = nSize * 5;
                styleType = _htOption.alignmentStyle;
                remainingEyeColumn = 4;

                drawEye(nLeft, nTop, eyeSize, outerDarkColor, innerDarkColor, styleType);
              } else if (eyeType === "POD_TL" || eyeType === "POD_TR" || eyeType === "POD_BL") {
                remainingEyeColumn = _htOption.visualeadMode ? 7 : 6;
              } else if (eyeType === "AOD" || eyeType === "AOD_BLC") {
                remainingEyeColumn = 4;
              }

              // Skip remaining eye columns
              col += remainingEyeColumn;
            }
          }
          // Draw timing module and data module
          else {
            // Skip outerLight when visualeadMode is true
            if (
              _htOption.visualeadMode &&
              (((row === 7 || row === nCount - 8) && [...Array(8).keys()].includes(col)) ||
                ([...Array(8).keys()].includes(row) && col === nCount - 8) ||
                // eslint-disable-next-line prettier/prettier
               (row === 7 && [...Array(9).keys()].slice(1).map(x => nCount - x).includes(col)))
            ) {
              continue;
            }

            // Top left coordinate of the dot
            const dotX = nLeft + (nSize * (1 - _htOption.dotScale)) / 2;
            const dotY = nTop + (nSize * (1 - _htOption.dotScale)) / 2;
            const dotWidth = nSize * _htOption.dotScale;
            const dotHeight = dotWidth;
            let styleType = null;

            // Draw dot background to increase contrast on hard to see position in the background image
            const dotBackgroundDarkColor = "rgba(0, 0, 0, 0.180)";
            const dotBackgroundLightColor = "rgba(255, 255, 255, 0.435)";
            _oContext.fillStyle = bIsDark ? dotBackgroundDarkColor : dotBackgroundLightColor;
            _oContext.strokeStyle = _oContext.fillStyle;
            _oContext.fillRect(nLeft, nTop, nSize, nSize);

            // TODO: change to appropriate color
            _oContext.lineWidth = 0;
            _oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
            _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;

            // Timing pattern
            if (row === 6 || col === 6) {
              const timingHColorDark =
                _htOption.timing_H || _htOption.timing || _htOption.colorDark;
              _oContext.fillStyle = bIsDark ? timingHColorDark : _htOption.colorLight;
              _oContext.strokeStyle = _oContext.fillStyle;
              const timingVColorDark =
                _htOption.timing_V || _htOption.timing || _htOption.colorDark;
              _oContext.fillStyle = bIsDark ? timingVColorDark : _htOption.colorLight;
              _oContext.strokeStyle = _oContext.fillStyle;
              styleType = _htOption.timingStyle;
            }
            // Data module
            else {
              if (_htOption.backgroundImage) {
                if (_htOption.autoColor) {
                  _oContext.fillStyle = bIsDark ? autoColorDark : autoColorLight;
                }

                _oContext.strokeStyle = _oContext.fillStyle;
              }

              styleType = _htOption.dotStyle;
            }

            drawShape(dotX, dotY, dotWidth, dotHeight, styleType, _htOption.dotScale, _oContext);
          }

          if (_htOption.dotScale !== 1 && !eye) {
            _oContext.strokeStyle = _htOption.colorLight;
          }
        }
      }

      if (_htOption.logo) {
        const img = new Image();
        img.src = _htOption.logo;

        const genratorImg = () => {
          let imgW = Math.round(_htOption.nSize / 3.5);
          let imgH = imgW;

          if (imgW !== imgH) {
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
            // if (!_htOption.logoBackgroundColor) {
            // _htOption.logoBackgroundColor = '#ffffff';
            // }
            _oContext.fillStyle = _htOption.logoBackgroundColor;

            _oContext.fillRect(
              (_htOption.nSize + _htOption.quietZoneSize * 2 - imgW) / 2,
              (_htOption.nSize + _htOption.quietZoneSize * 2 - imgH) / 2,
              imgW,
              imgW
            );
          }

          _oContext.drawImage(
            img,
            (_htOption.nSize + _htOption.quietZoneSize * 2 - imgW) / 2,
            (_htOption.nSize + _htOption.quietZoneSize * 2 - imgH) / 2,
            imgW,
            imgH
          );

          this._bIsPainted = true;

          if (_htOption.quietZoneSize > 0 && _htOption.quietZoneColor) {
            drawQuietZoneColor();
          }

          this.makeImage();
        };

        img.onload = function() {
          genratorImg();
        };

        img.onerror = function(e) {
          console.error(e);
        };

        if (img.complete) {
          img.onload = null;
          genratorImg();
        }
      } else {
        this._bIsPainted = true;

        if (_htOption.quietZoneSize > 0 && _htOption.quietZoneColor) {
          drawQuietZoneColor();
        }

        this.makeImage();
      }
    };

    if (_htOption.backgroundImage) {
      // backgroundImage
      const bgImg = new Image();

      bgImg.onload = function() {
        _oContext.globalAlpha = 1;
        _oContext.globalAlpha = _htOption.backgroundImageAlpha;
        _oContext.drawImage(
          bgImg,
          0,
          0,
          _htOption.nSize + _htOption.quietZoneSize * 2,
          _htOption.nSize + _htOption.quietZoneSize * 2
        );
        _oContext.globalAlpha = 1;
        drawQrcode();
      };

      bgImg.src = _htOption.backgroundImage;
      // DoSomething
    } else {
      // Add rotate QR Code without background around its center point
      const canvasXCenter = this._canvas.width / 2;
      const canvasYCenter = this._canvas.height / 2;
      _oContext.translate(canvasXCenter, canvasYCenter);
      _oContext.rotate((Math.PI / 180) * _htOption.degreeRotation);
      _oContext.translate(-canvasXCenter, -canvasYCenter);

      if (_htOption.backgroundColor) {
        fillBackgroundColor(_htOption.backgroundColor);
      }

      drawQrcode();
    }
  }

  /**
   * Make the image from Canvas
   */
  makeImage() {
    const { makeOptions } = this;

    if (makeOptions.makeType === "FILE") {
      if (this._htOption.onRenderingStart) {
        this._htOption.onRenderingStart(this._htOption);
      }

      const out = fs.createWriteStream(makeOptions.path);
      let stream;

      if (this._htOption.format === "PNG") {
        stream = this._canvas.createPNGStream({
          compressionLevel: this._htOption.compressionLevel
        });
      } else {
        stream = this._canvas.createJPEGStream({ quality: this._htOption.quality });
      }

      stream.pipe(out);

      out.on("finish", () => {
        this.resolve({});
      });
    } else if (makeOptions.makeType === "URL") {
      if (this._htOption.onRenderingStart) {
        this._htOption.onRenderingStart(this._htOption);
      }

      if (this._htOption.format === "PNG") {
        // dataUrl = this._canvas.toDataURL()
        this._canvas.toDataURL((err, data) => {
          this.resolve(data);
        }); // defaults to PNG
      } else {
        this._canvas.toDataURL("image/jpeg", (err, data) => {
          this.resolve(data);
        });
      }
    }
  }

  /**
   * Return whether the QRCode is painted or not
   *
   * @return {Boolean}
   */
  isPainted() {
    return this._bIsPainted;
  }

  /**
   * @private
   * @param {Number} nNumber
   */
  round(nNumber) {
    if (!nNumber) {
      return nNumber;
    }

    return Math.floor(nNumber * 1000) / 1000;
  }
}

module.exports = Drawing;
