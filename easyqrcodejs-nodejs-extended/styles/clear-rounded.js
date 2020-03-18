const rounded = require("./rounded");

function clearRounded(context, x, y, width, height) {
  context.save();
  context.beginPath();
  rounded(context, x, y, width, height);
  context.clip();
  context.clearRect(x, y, width, height);
  context.restore();
}

module.exports = clearRounded;
