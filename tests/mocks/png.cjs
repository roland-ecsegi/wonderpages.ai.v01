// PNG-uri reale pentru serviciile simulate: ilustrații color și pagini de colorat alb-negru.
const path = require('path');
const { createRequire } = require('module');
const { PNG } = createRequire(path.join(__dirname, '..', '..', 'package.json'))('pngjs');
function colour(seed = 1, w = 400, h = 500) {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; const inBody = Math.hypot(x - w / 2, y - h * 0.6) < 110;
    png.data[i] = inBody ? 60 + (seed * 37) % 150 : 140 + (y * 80) / h; png.data[i + 1] = inBody ? 170 : 200 - (y * 60) / h; png.data[i + 2] = inBody ? 90 : 240; png.data[i + 3] = 255; }
  return PNG.sync.write(png);
}
function lineart(w = 400, h = 500) {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; const d = Math.hypot(x - w / 2, y - h * 0.6), d2 = Math.hypot(x - w / 2, y - h * 0.3);
    const v = Math.abs(d - 110) < 3 || Math.abs(d2 - 50) < 3 || (y > h - 60 && y < h - 56) ? 0 : 255; png.data[i] = png.data[i + 1] = png.data[i + 2] = v; png.data[i + 3] = 255; }
  return PNG.sync.write(png);
}
module.exports = { colour, lineart };
