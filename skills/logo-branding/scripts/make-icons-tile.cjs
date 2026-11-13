// Usage: node make-icons-tile.cjs <logo-mark-ink.png> <outDir> [tileHex=#ffffff]
// White rounded tile that fills the whole icon, with the ink mark large on top.
// Same artwork as the navbar logo, so favicon, navbar and footer all match.
// Also writes logo-tile.png (512) for places that sit on dark backgrounds.
const path = require("path");
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));

const [, , MARK, OUT = "public", HEX = "#ffffff"] = process.argv;
if (!MARK) throw new Error("usage: node make-icons-tile.cjs <logo-mark-ink.png> <outDir> [tileHex]");
const n = parseInt(HEX.replace("#", ""), 16);
const TILE = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

(async () => {
  // Crop the mark tight and square it so it can be scaled precisely
  const trimmed = await sharp(MARK).trim({ threshold: 1 }).png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const side = Math.max(width, height);
  const square = await sharp(trimmed)
    .extend({
      top: Math.floor((side - height) / 2),
      bottom: Math.ceil((side - height) / 2),
      left: Math.floor((side - width) / 2),
      right: Math.ceil((side - width) / 2),
      background: CLEAR,
    })
    .png()
    .toBuffer();

  // rounded: full-bleed tile with ~22% corner radius; markFill: mark size relative to the icon
  async function icon(size, file, markFill, rounded = true) {
    const inner = Math.round(size * markFill);
    let mark = sharp(square).resize(inner, inner, { kernel: "lanczos3" });
    if (size <= 48) mark = mark.sharpen({ sigma: 0.5 });
    let img = sharp({ create: { width: size, height: size, channels: 4, background: TILE } })
      .composite([{ input: await mark.png().toBuffer(), gravity: "center" }]);
    if (rounded) {
      const r = Math.round(size * 0.22);
      const mask = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`,
      );
      img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: "dest-in" }]);
    }
    await img.png().toFile(path.join(OUT, file));
    console.log(file, size);
  }

  await icon(16, "favicon-16x16.png", 0.86);
  await icon(32, "favicon-32x32.png", 0.84);
  await icon(48, "favicon-48x48.png", 0.82);
  await icon(512, "favicon.png", 0.78);
  await icon(512, "logo-tile.png", 0.74);
  await icon(160, "app_icon.png", 0.76);
  await icon(192, "android-chrome-192x192.png", 0.74);
  await icon(512, "android-chrome-512x512.png", 0.74);
  await icon(180, "apple-touch-icon.png", 0.72, false); // iOS rounds it itself; keep it opaque
})();
