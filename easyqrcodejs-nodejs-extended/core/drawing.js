const { createCanvas, Image } = require("canvas");
const fs = require("fs");
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

    function drawQrcode(oQRCode) {
      for (let row = 0; row < nCount; row += 1) {
        for (let col = 0; col < nCount; col += 1) {
          const nLeft = col * nWidth + _htOption.quietZoneSize;
          const nTop = row * nHeight + _htOption.quietZoneSize;
          const bIsDark = oQRCode.isDark(row, col);
          const eye = oQRCode.getEye(row, col); // { isDark: true/false, type: PO_TL, PI_TL, PO_TR, PI_TR, PO_BL, PI_BL };
          const positionOuterDarkWidth = nWidth * 7; // width of one module * position outer dark module quantity
          const positionOuterDarkHeight = nHeight * 7;
          const positionInnerLightWidth = nWidth * 5;
          const positionInnerLightHeight = nHeight * 5;
          const positionInnerDarkWidth = nWidth * 3;
          const positionInnerDarkHeight = nHeight * 3;

          // Position Outer Dark Top Left Top Left Corner [row column]
          const POD_TL_TLC = [0, 0];
          let isPOD_TL = false;
          // Position Outer Dark Top Right Top Left Corner [row column]
          const POD_TR_TLC = [0, nCount - 7];
          let isPOD_TR = false;
          // Position Outer Dark Bottom Left Top Left Corner [row column]
          const POD_BL_TLC = [nCount - 7, 0];
          let isPOD_BL = false;
          // Position outer dark color
          let POD_color = null;
          // Position inner dark color
          let PID_color = null;

          if (row === POD_TL_TLC[0] && col === POD_TL_TLC[1]) {
            isPOD_TL = true;
            POD_color = _htOption.PO_TL || _htOption.PO || _htOption.colorDark;
            PID_color = _htOption.PI_TL || _htOption.PI || _htOption.colorDark;
          } else if (row === POD_TR_TLC[0] && col === POD_TR_TLC[1]) {
            isPOD_TR = true;
            POD_color = _htOption.PO_TR || _htOption.PO || _htOption.colorDark;
            PID_color = _htOption.PI_TR || _htOption.PI || _htOption.colorDark;
          } else if (row === POD_BL_TLC[0] && col === POD_BL_TLC[1]) {
            isPOD_BL = true;
            POD_color = _htOption.PO_BL || _htOption.PO || _htOption.colorDark;
            PID_color = _htOption.PI_BL || _htOption.PI || _htOption.colorDark;
          }

          // Draw the whole position outer and inner
          if (isPOD_TL || isPOD_TR || isPOD_BL) {
            // Current Position Outer Dark Top Left Corner Coordinate
            const current_POD_TLC = [nLeft, nTop];
            // Position Inner Light Top Left Corner Coordinate
            const PIL_TLC = [current_POD_TLC[0] + nWidth, current_POD_TLC[1] + nHeight];
            // Position Inner Dark Top Left Corner Coordinate
            const PID_TLC = [PIL_TLC[0] + nWidth, PIL_TLC[1] + nWidth];

            _oContext.lineWidth = 0;

            // eslint-disable-next-line default-case
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
                  _oContext.fillStyle = _htOption.backgroundColor;
                  _oContext.strokeStyle = _oContext.fillStyle;
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
                  _oContext.fillStyle = _htOption.backgroundColor;
                  _oContext.strokeStyle = _oContext.fillStyle;
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
                fillCircle(
                  _oContext,
                  current_POD_TLC[0],
                  current_POD_TLC[1],
                  positionOuterDarkWidth
                );

                // Clear unnecessary fill part inside the circle
                if (_htOption.backgroundColor) {
                  _oContext.fillStyle = _htOption.backgroundColor;
                  _oContext.strokeStyle = _oContext.fillStyle;
                  fillCircle(_oContext, PIL_TLC[0], PIL_TLC[1], positionInnerLightWidth);
                } else {
                  clearCircle(_oContext, PIL_TLC[0], PIL_TLC[1], positionInnerLightWidth);
                }

                // Draw circle for the inner position
                _oContext.strokeStyle = PID_color;
                _oContext.fillStyle = PID_color;
                fillCircle(_oContext, PID_TLC[0], PID_TLC[1], positionInnerDarkWidth);
                break;
            }

            // Skip other column of the position outer dark
            col += 6;
          }
          // Draw alignment pattern
          else if (eye) {
            if (eye.type === "PO_TL" || eye.type === "PO_TR" || eye.type === "PO_BL") {
              // Skip other column of the position outer dark
              col += 6;
            } else if (eye.type === "AO") {
              // Current QRCode version
              // console.log(oQRCode.typeNumber)
              if (eye.specialPosition === "TLC") {
                // Current Alignment Outer Dark Top Left Corner Coordinate
                const current_AOD_TLC = [nLeft, nTop];
                const AIL_TLC = [current_AOD_TLC[0] + nWidth, current_AOD_TLC[1] + nHeight];
                const AID = [AIL_TLC[0] + nWidth, AIL_TLC[1] + nWidth];
                const alignmentOuterDarkWidth = nWidth * 5;
                const alignmentOuterDarkHeight = nHeight * 5;
                const alignmentInnerLightWidth = nWidth * 3;
                const alignmentInnerLightHeight = nHeight * 3;
                const alignmentInnerDarkWidth = nWidth;
                const alignmentInnerDarkHeight = nHeight;

                // Alignment outer dark color
                const AOD_color = _htOption.AO || _htOption.colorDark;
                // TODO: Custom alignment inner dark color
                const AID_color = _htOption.AI || _htOption.colorDark;

                // eslint-disable-next-line default-case
                switch (_htOption.alignmentStyle) {
                  case "rectangle":
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
                  case "roundedRectangle":
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
                      clearCircle(_oContext, AIL_TLC[0], AIL_TLC[1], alignmentInnerLightWidth);
                    }

                    // Draw fill circle for the inner position
                    _oContext.strokeStyle = AID_color;
                    _oContext.fillStyle = AID_color;
                    fillCircle(_oContext, AID[0], AID[1], alignmentInnerDarkWidth);
                    break;
                }
              }

              // Skip other column of the alignment outer dark
              col += 4;
            }
          }
          // Draw timing module and data module
          else {
            const nowDotScale = _htOption.dotScale;
            // Top left coordinate of the dot
            const dotX = nLeft + (nWidth * (1 - nowDotScale)) / 2;
            const dotY = nTop + (nHeight * (1 - nowDotScale)) / 2;
            const dotWidth = nWidth * nowDotScale;
            const dotHeight = nHeight * nowDotScale;

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

            // Horizontal timing pattern
            if (row === 6) {
              const timingHColorDark =
                _htOption.timing_H || _htOption.timing || _htOption.colorDark;
              _oContext.fillStyle = bIsDark ? timingHColorDark : _htOption.colorLight;
              _oContext.strokeStyle = _oContext.fillStyle;

              // eslint-disable-next-line default-case
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
            else if (col === 6) {
              const timingVColorDark =
                _htOption.timing_V || _htOption.timing || _htOption.colorDark;
              _oContext.fillStyle = bIsDark ? timingVColorDark : _htOption.colorLight;
              _oContext.strokeStyle = _oContext.fillStyle;

              // eslint-disable-next-line default-case
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

              // eslint-disable-next-line default-case
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
    }

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

        drawQrcode.call(this, oQRCode);
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

      drawQrcode.call(this, oQRCode);
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
