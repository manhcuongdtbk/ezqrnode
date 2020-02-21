/**
 * Draws a circle using the current state of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} diameter The diameter of the circle
 * @param {Number} scale The scale of the circle
 */
function fillCircle(ctx, x, y, diameter, scale) {
  if (typeof scale === 'undefined') {
    scale = 1;
  }

  var radius = diameter / 2; // Arc radius
  var startAngle = 0; // Starting point on circle, 0 degree
  var endAngle = Math.PI * 2; // End point on circle, 360 degree
  var scaledRadius = radius * scale;
  var xCenter = x + scaledRadius;
  var yCenter = y + scaledRadius;

  ctx.beginPath();
  ctx.arc(xCenter, yCenter, scaledRadius, startAngle, endAngle);
  ctx.fill();
  ctx.stroke();

  return ctx;
}

module.exports = fillCircle;
