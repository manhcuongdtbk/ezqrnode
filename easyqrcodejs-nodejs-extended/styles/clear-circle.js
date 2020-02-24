/**
 * Draws a circle using the current state of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} diameter The diameter of the circle
 * @param {Number} scale The scale of the circle
 */

var circle = require('./circle')

function clearCircle(ctx, x, y, diameter, scale) {
  ctx.save();
  ctx.beginPath();
  circle(ctx, x, y, diameter, scale);
  ctx.clip();
  ctx.clearRect(x, y, diameter, diameter);
  ctx.restore();
}

module.exports = clearCircle;
