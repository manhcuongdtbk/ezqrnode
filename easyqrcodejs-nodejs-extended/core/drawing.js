const { createCanvas, Image } = require("canvas");
const fs = require("fs");
const { QRErrorCorrectLevel } = require("./constants");
// Custom dot styles
const fillRoundedRect = require("../styles/rounded-rectangle");
const fillCircle = require("../styles/circle");
const fillStar = require("../styles/star");
const clearRoundedRect = require("../styles/clear-rounded-rectangle");
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
    const nWidth = Math.round(_htOption.width / nCount);
    const nHeight = Math.round(_htOption.height / nCount);

    if (_htOption.quietZoneSizeUnit === "module") {
      _htOption.quietZoneSize *= nWidth;
    }

    this._htOption.width = nWidth * nCount;
    this._htOption.height = nHeight * nCount;
    this._canvas.width = this._htOption.width + this._htOption.quietZoneSize * 2;
    this._canvas.height = this._htOption.height + this._htOption.quietZoneSize * 2;

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
        _htOption.width,
        _htOption.height
      );
    }

    function drawEye(
      outerDarkX,
      outerDarkY,
      outerDarkSize,
      outerDarkColor,
      innerDarkColor,
      styleType
    ) {
      const innerLightX = outerDarkX + nWidth;
      const innerLightY = outerDarkY + nHeight;
      const innerDarkX = innerLightX + nWidth;
      const innerDarkY = innerLightY + nWidth;
      const eyeEdgeSize = nWidth * 2;
      const innerLightSize = outerDarkSize - eyeEdgeSize;
      const innerDarkSize = innerLightSize - eyeEdgeSize;

      _oContext.lineWidth = 0;

      // eslint-disable-next-line default-case
      switch (styleType) {
        case "rectangle":
          // Draw fill rectangle for the outer position
          _oContext.fillStyle = outerDarkColor;
          _oContext.strokeStyle = _oContext.fillStyle;
          _oContext.fillRect(outerDarkX, outerDarkY, outerDarkSize, outerDarkSize);

          // Clear unnecessary fill part inside the rectangle
          if (_htOption.backgroundColor) {
            _oContext.fillStyle = _htOption.backgroundColor;
            _oContext.strokeStyle = _oContext.fillStyle;
            _oContext.fillRect(innerLightX, innerLightY, innerLightSize, innerLightSize);
          } else {
            _oContext.clearRect(innerLightX, innerLightY, innerLightSize, innerLightSize);
          }

          // Draw fill rectangle for the inner position
          _oContext.fillStyle = innerDarkColor;
          _oContext.strokeStyle = _oContext.fillStyle;
          _oContext.fillRect(innerDarkX, innerDarkY, innerDarkSize, innerDarkSize);
          break;
        case "roundedRectangle": {
          // Best on 1000px width and 1000 px height

          // Draw fill rounded rectangle for the outer position
          _oContext.fillStyle = outerDarkColor;
          _oContext.strokeStyle = _oContext.fillStyle;

          fillRoundedRect(_oContext, outerDarkX, outerDarkY, outerDarkSize, outerDarkSize, 30);

          // Clear unnecessary fill part inside the rounded rectangle
          if (_htOption.backgroundColor) {
            _oContext.fillStyle = _htOption.backgroundColor;
            _oContext.strokeStyle = _oContext.fillStyle;
            fillRoundedRect(
              _oContext,
              innerLightX,
              innerLightY,
              innerLightSize,
              innerLightSize,
              30
            );
          } else {
            clearRoundedRect(
              _oContext,
              innerLightX,
              innerLightY,
              innerLightSize,
              innerLightSize,
              30
            );
          }

          // Draw fill rounded rectangle for the inner position
          _oContext.fillStyle = innerDarkColor;
          _oContext.strokeStyle = _oContext.fillStyle;
          const innerDarkRadius = innerDarkSize === nWidth ? 10 : 30;
          fillRoundedRect(
            _oContext,
            innerDarkX,
            innerDarkY,
            innerDarkSize,
            innerDarkSize,
            innerDarkRadius
          );
          break;
        }
        case "circle":
          // Draw circle for the outer position
          _oContext.fillStyle = outerDarkColor;
          _oContext.strokeStyle = _oContext.fillStyle;
          fillCircle(_oContext, outerDarkX, outerDarkY, outerDarkSize);

          // Clear unnecessary fill part inside the circle
          if (_htOption.backgroundColor) {
            _oContext.fillStyle = _htOption.backgroundColor;
            _oContext.strokeStyle = _oContext.fillStyle;
            fillCircle(_oContext, innerLightX, innerLightY, innerLightSize);
          } else {
            clearCircle(_oContext, innerLightX, innerLightY, innerLightSize);
          }

          // Draw circle for the inner position
          _oContext.fillStyle = innerDarkColor;
          _oContext.strokeStyle = _oContext.fillStyle;
          fillCircle(_oContext, innerDarkX, innerDarkY, innerDarkSize);
          break;
      }
    }

    function drawDataModule(x, y, width, height, styleType, scale = 1, context) {
      // eslint-disable-next-line default-case
      switch (styleType) {
        case "roundedRectangle":
          // Best on 1000px width and 1000 px height
          fillRoundedRect(context, x, y, width, height);
          break;
        case "rectangle":
          context.fillRect(x, y, width, height);
          break;
        case "circle":
          fillCircle(context, x, y, width);
          break;
        case "star":
          // Only support dotScale 0.5
          fillStar(
            context,
            x + nWidth / 4,
            y + nWidth / 4,
            4,
            (nWidth * scale) / 2,
            (nWidth * scale) / 4
          );
          break;
      }
    }

    const logoPlaceholderModules = [];

    const drawQrcode = () => {
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
        const centerPointX = (nCount / 2) * nWidth + _htOption.quietZoneSize;
        const centerPointY = (nCount / 2) * nWidth + _htOption.quietZoneSize;
        const QRModuleCount = nCount * nCount;
        const placeholderModuleCount = QRModuleCount * correctPercent;
        const placeholderEdgeModuleCount = Math.floor(Math.sqrt(placeholderModuleCount));
        const placeholderEdgeWidth = placeholderEdgeModuleCount * nWidth;
        const placeholderTLCX = centerPointX - placeholderEdgeWidth / 2; // Top left corner X coordinate
        const placeholderTLCY = centerPointY - placeholderEdgeWidth / 2; // Top left corner Y coordinate
        const placeholderTLCrow =
          Math.floor((placeholderTLCX - _htOption.quietZoneSize) / nWidth) + 1;
        const placeholderTLCcolumn =
          Math.floor((placeholderTLCY - _htOption.quietZoneSize) / nWidth) + 1;

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

          const nLeft = col * nWidth + _htOption.quietZoneSize;
          const nTop = row * nHeight + _htOption.quietZoneSize;
          const bIsDark = oQRCode.isDark(row, col);
          const eye = oQRCode.getEye(row, col);

          if (eye) {
            const eyeType = eye.type;
            let eyeSize = null;
            let outerDarkColor = null;
            let innerDarkColor = null;
            let styleType = null;
            let remainingEyeColumn = null;

            // Draw the whole position outer and inner
            if (eyeType) {
              if (
                eyeType === "POD_TL_TLC" ||
                eyeType === "POD_TR_TLC" ||
                eyeType === "POD_BL_TLC" ||
                eyeType === "AOD_TLC"
              ) {
                // eslint-disable-next-line default-case
                switch (eyeType) {
                  case "POD_TL_TLC":
                    outerDarkColor = _htOption.PO_TL || _htOption.PO || _htOption.colorDark;
                    innerDarkColor = _htOption.PI_TL || _htOption.PI || _htOption.colorDark;
                    break;
                  case "POD_TR_TLC":
                    outerDarkColor = _htOption.PO_TR || _htOption.PO || _htOption.colorDark;
                    innerDarkColor = _htOption.PI_TR || _htOption.PI || _htOption.colorDark;
                    break;
                  case "POD_BL_TLC":
                    outerDarkColor = _htOption.PO_BL || _htOption.PO || _htOption.colorDark;
                    innerDarkColor = _htOption.PI_BL || _htOption.PI || _htOption.colorDark;
                    break;
                  case "AOD_TLC":
                    // Current QRCode version
                    // console.log(oQRCode.typeNumber)
                    outerDarkColor = _htOption.AO || _htOption.colorDark;
                    innerDarkColor = _htOption.AI || _htOption.colorDark;
                    eyeSize = nWidth * 5;
                    styleType = _htOption.alignmentStyle;
                    remainingEyeColumn = 4;
                    break;
                }

                // eslint-disable-next-line default-case
                switch (eyeType) {
                  case "POD_TL_TLC":
                  case "POD_TR_TLC":
                  case "POD_BL_TLC":
                    eyeSize = nWidth * 7;
                    styleType = _htOption.positionStyle;
                    remainingEyeColumn = 6;
                    break;
                }

                drawEye(nLeft, nTop, eyeSize, outerDarkColor, innerDarkColor, styleType);
              } else if (eyeType === "POD_TL" || eyeType === "POD_TR" || eyeType === "POD_BL") {
                remainingEyeColumn = 6;
              } else if (eyeType === "AOD") {
                remainingEyeColumn = 4;
              }

              // Skip remaining eye columns
              col += remainingEyeColumn;
            }
          }
          // Draw timing module and data module
          else {
            // Top left coordinate of the dot
            const dotX = nLeft + (nWidth * (1 - _htOption.dotScale)) / 2;
            const dotY = nTop + (nHeight * (1 - _htOption.dotScale)) / 2;
            const dotWidth = nWidth * _htOption.dotScale;
            const dotHeight = nHeight * _htOption.dotScale;
            let styleType = null;

            // Draw dot background to increase contrast on hard to see position in the background image
            const dotBackgroundDarkColor = "rgba(0, 0, 0, 0.180)";
            const dotBackgroundLightColor = "rgba(255, 255, 255, 0.435)";
            _oContext.fillStyle = bIsDark ? dotBackgroundDarkColor : dotBackgroundLightColor;
            _oContext.strokeStyle = _oContext.fillStyle;
            _oContext.fillRect(nLeft, nTop, nWidth, nHeight);

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

            drawDataModule(
              dotX,
              dotY,
              dotWidth,
              dotHeight,
              styleType,
              _htOption.dotScale,
              _oContext
            );
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
          let imgW = Math.round(_htOption.width / 3.5);
          let imgH = Math.round(_htOption.height / 3.5);

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
          _htOption.width + _htOption.quietZoneSize * 2,
          _htOption.height + _htOption.quietZoneSize * 2
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
