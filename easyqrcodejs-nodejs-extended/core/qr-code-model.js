const QRPolynomial = require("./qr-polynomial");
const QR8bitByte = require("./qr-8-bit-byte");
const QRBitBuffer = require("./qr-bit-buffer");
const QRRSBlock = require("./qr-rs-block");
const QRUtil = require("./qr-util");

class QRCodeModel {
  constructor(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  static PAD0 = 0xec;

  static PAD1 = 0x11;

  static createData(typeNumber, errorCorrectLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();

    for (let i = 0; i < dataList.length; i += 1) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }

    let totalDataCount = 0;

    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalDataCount += rsBlocks[i].dataCount;
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error(`code length overflow. (${buffer.getLengthInBits()}>${totalDataCount * 8})`);
    }

    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }

    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(false);
    }

    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }

      buffer.put(QRCodeModel.PAD0, 8);

      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }

      buffer.put(QRCodeModel.PAD1, 8);
    }

    return QRCodeModel.createBytes(buffer, rsBlocks);
  }

  static createBytes(buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r += 1) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);

      for (let i = 0; i < dcdata[r].length; i += 1) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }

      offset += dcCount;
      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);

      for (let i = 0; i < ecdata[r].length; i += 1) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
    }

    let totalCodeCount = 0;

    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalCodeCount += rsBlocks[i].totalCount;
    }

    const data = new Array(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i];
        }
      }
    }

    for (let i = 0; i < maxEcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i];
        }
      }
    }

    return data;
  }

  addData(data) {
    const newData = new QR8bitByte(data);
    this.dataList.push(newData);
    this.dataCache = null;
  }

  isDark(row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(`${row},${col}`);
    }

    return this.modules[row][col][0];
  }

  getEye(row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(`${row},${col}`);
    }

    const block = this.modules[row][col]; // [isDark(true/false), EyeOuterOrInner(O/I), Position(TL/TR/BL/A) ]

    const darkLight = block[0] ? "D" : "L";

    if (block[1]) {
      // POL_TL, POD_TL, PIL_TL, PID_TL, POL_TR, POD_TR, PIL_TR, PID_TR, POL_BL, POD_BL, PIL_BL, PID_BL
      let type = `P${block[1]}${darkLight}_${block[2]}`;

      if (block[2] === "A") {
        type = `A${block[1]}${darkLight}`; // AOL, AOD, AIL, AID
      }

      if (block[3]) {
        // AOL_TLC, AOL_TRC, AOL_BRC, AOL_BLC, AOD_TLC, AOD_TRC, AOD_BRC, AOD_BLC,
        // AIL_TLC, AIL_TRC, AIL_BRC, AIL_BLC, AID_TLC, AID_TRC, AID_BRC, AID_BLC, AID_C
        // Same for P
        type += `_${block[3]}`;
      }

      return {
        isDarkBlock: block[0],
        type: type
      };
    }

    return null;
  }

  getModuleCount() {
    return this.moduleCount;
  }

  make() {
    this.makeImpl(false, this.getBestMaskPattern());
  }

  makeImpl(test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);

    for (let row = 0; row < this.moduleCount; row += 1) {
      this.modules[row] = new Array(this.moduleCount);

      for (let col = 0; col < this.moduleCount; col += 1) {
        this.modules[row][col] = []; // [isDark(ture/false), EyeOuterOrInner(O/I), Position(TL/TR/BL) ]
      }
    }

    this.setupPositionProbePattern(0, 0, "TL"); // TopLeft, TL
    this.setupPositionProbePattern(this.moduleCount - 7, 0, "BL"); // BotoomLeft, BL
    this.setupPositionProbePattern(0, this.moduleCount - 7, "TR"); // TopRight, TR
    this.setupPositionAdjustPattern("A"); // Alignment, A
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }

    if (this.dataCache == null) {
      this.dataCache = QRCodeModel.createData(
        this.typeNumber,
        this.errorCorrectLevel,
        this.dataList
      );
    }

    this.mapData(this.dataCache, maskPattern);
  }

  setupPositionProbePattern(row, col, posName) {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r <= -1 || this.moduleCount <= row + r) {
        continue;
      }

      for (let c = -1; c <= 7; c += 1) {
        if (col + c <= -1 || this.moduleCount <= col + c) {
          continue;
        }

        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          this.modules[row + r][col + c][0] = true;
          this.modules[row + r][col + c][2] = posName; // Position

          if (r === 0 || c === 0 || r === 6 || c === 6) {
            this.modules[row + r][col + c][1] = "O"; // Position Outer

            if (r === 0 && c === 0) {
              this.modules[row + r][col + c][3] = "TLC";
            } else if (r === 0 && c === 6) {
              this.modules[row + r][col + c][3] = "TRC";
            } else if (r === 6 && col === 6) {
              this.modules[row + r][col + c][3] = "BRC";
            } else if (r === 6 && col === 0) {
              this.modules[row + r][col + c][3] = "BLC";
            }
          } else {
            this.modules[row + r][col + c][1] = "I"; // Position Inner

            if (r === 3 && col === 3) {
              this.modules[row + r][col + c][3] = "C";
            }
          }
        } else {
          this.modules[row + r][col + c][0] = false;
        }
      }
    }
  }

  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;

    for (let i = 0; i < 8; i += 1) {
      this.makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(this);

      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }

    return pattern;
  }

  createMovieClip(target_mc, instance_name, depth) {
    let qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
    const cs = 1;
    this.make();

    for (let row = 0; row < this.modules.length; row += 1) {
      const y = row * cs;

      for (let col = 0; col < this.modules[row].length; col += 1) {
        const x = col * cs;
        const dark = this.modules[row][col][0];

        if (dark) {
          qr_mc.beginFill(0, 100);
          qr_mc.moveTo(x, y);
          qr_mc.lineTo(x + cs, y);
          qr_mc.lineTo(x + cs, y + cs);
          qr_mc.lineTo(x, y + cs);
          qr_mc.endFill();
        }
      }
    }

    return qr_mc;
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r += 1) {
      if (this.modules[r][6][0] != null) {
        continue;
      }

      this.modules[r][6][0] = r % 2 === 0;
    }

    for (let c = 8; c < this.moduleCount - 8; c += 1) {
      if (this.modules[6][c][0] != null) {
        continue;
      }

      this.modules[6][c][0] = c % 2 === 0;
    }
  }

  setupPositionAdjustPattern(posName) {
    const pos = QRUtil.getPatternPosition(this.typeNumber);

    for (let i = 0; i < pos.length; i += 1) {
      for (let j = 0; j < pos.length; j += 1) {
        const row = pos[i];
        const col = pos[j];

        if (this.modules[row][col][0] != null) {
          continue;
        }

        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules[row + r][col + c][0] = true;
              this.modules[row + r][col + c][2] = posName; // Position

              if (r === -2 || c === -2 || r === 2 || c === 2) {
                this.modules[row + r][col + c][1] = "O"; // Position Outer

                if (r === -2 && c === -2) {
                  this.modules[row + r][col + c][3] = "TLC"; // Top Left Corner
                } else if (r === -2 && c === 2) {
                  this.modules[row + r][col + c][3] = "TRC"; // Top Right Corner
                } else if (r === 2 && c === 2) {
                  this.modules[row + r][col + c][3] = "BRC"; // Bottom Right Corner
                } else if (r === 2 && c === -2) {
                  this.modules[row + r][col + c][3] = "BLC"; // Bottom Left Corner
                }
              } else {
                this.modules[row + r][col + c][1] = "I"; // Position Inner

                if (r === 0 && c === 0) {
                  this.modules[row + r][col + c][3] = "C"; // Center
                }
              }
            } else {
              this.modules[row + r][col + c][0] = false;
            }
          }
        }
      }
    }
  }

  setupTypeNumber(test) {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);

    for (let i = 0; i < 18; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.modules[Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3][0] = mod;
    }

    for (let i = 0; i < 18; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.modules[(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)][0] = mod;
    }
  }

  setupTypeInfo(test, maskPattern) {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);

    for (let i = 0; i < 15; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;

      if (i < 6) {
        this.modules[i][8][0] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8][0] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8][0] = mod;
      }
    }

    for (let i = 0; i < 15; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;

      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1][0] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1][0] = mod;
      } else {
        this.modules[8][15 - i - 1][0] = mod;
      }
    }

    this.modules[this.moduleCount - 8][8][0] = !test;
  }

  mapData(data, maskPattern) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) {
        col -= 1;
      }

      while (true) {
        for (let c = 0; c < 2; c += 1) {
          if (this.modules[row][col - c][0] == null) {
            let dark = false;

            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }

            const mask = QRUtil.getMask(maskPattern, row, col - c);

            if (mask) {
              dark = !dark;
            }

            this.modules[row][col - c][0] = dark;
            bitIndex -= 1;

            if (bitIndex === -1) {
              byteIndex += 1;
              bitIndex = 7;
            }
          }
        }

        row += inc;

        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }
}

module.exports = QRCodeModel;
