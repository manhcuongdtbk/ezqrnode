const QRMath = require("./qr-math");

class QRPolynomial {
  constructor(num, shift) {
    if (num.length === undefined) {
      throw new Error(`${num.length}/${shift}`);
    }

    let offset = 0;

    while (offset < num.length && num[offset] === 0) {
      offset += 1;
    }

    this.num = new Array(num.length - offset + shift);

    for (let i = 0; i < num.length - offset; i += 1) {
      this.num[i] = num[i + offset];
    }
  }

  get(index) {
    return this.num[index];
  }

  getLength() {
    return this.num.length;
  }

  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1);

    for (let i = 0; i < this.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }

    return new QRPolynomial(num, 0);
  }

  mod(e) {
    if (this.getLength() - e.getLength() < 0) {
      return this;
    }

    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());

    for (let i = 0; i < this.getLength(); i += 1) {
      num[i] = this.get(i);
    }

    for (let i = 0; i < e.getLength(); i += 1) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }

    return new QRPolynomial(num, 0).mod(e);
  }
}

module.exports = QRPolynomial;
