/**
 * Draws a circle using the current state of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} diameter The diameter of the circle
 */
function fillCircle(ctx, x, y, diameter) {
  const radius = diameter / 2; // Arc radius
  const startAngle = 0; // Starting point on circle, 0 degree
  const endAngle = Math.PI * 2; // End point on circle, 360 degree
  const xCenter = x + radius;
  const yCenter = y + radius;

  ctx.beginPath();
  ctx.arc(xCenter, yCenter, radius, startAngle, endAngle);
  ctx.fill();
  ctx.stroke();

  return ctx;
}

module.exports = fillCircle;
