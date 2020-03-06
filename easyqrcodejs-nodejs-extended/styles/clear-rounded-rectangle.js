const roundedRect = require("./rounded-rectangle");

function clearRoundedRect(context, x, y, width, height, radius) {
  context.save();
  context.beginPath();
  roundedRect(context, x, y, width, height, radius);
  context.clip();
  context.clearRect(x, y, width, height);
  context.restore();
}

module.exports = clearRoundedRect;
