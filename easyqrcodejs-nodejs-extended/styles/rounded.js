/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last param, it will draw a filled rectangle
 * with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 30] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 */
function fillRounded(ctx, x, y, width, height, radius = 30) {
  if (typeof radius === "number") {
    radius = (width * radius) / 100; // Responsive radius
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };

    defaultRadius.forEach(side => {
      radius[side] = radius[side] || defaultRadius[side];
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const side in defaultRadius) {
      if (Object.prototype.hasOwnProperty.call(defaultRadius, side)) {
        // eslint-disable-next-line no-param-reassign
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  ctx.fill();

  return ctx;
}

module.exports = fillRounded;
