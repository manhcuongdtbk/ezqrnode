const QRMath = {
  glog(n) {
    if (n < 1) {
      throw new Error(`glog(${n})`);
    }

    return QRMath.LOG_TABLE[n];
  },
  gexp(n) {
    while (n < 0) {
      n += 255;
    }

    while (n >= 256) {
      n -= 255;
    }

    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256)
};

module.exports = QRMath;
