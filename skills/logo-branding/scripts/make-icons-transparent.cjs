// Usage: node make-icons-transparent.cjs <logo-mark.png> <outDir> [appleBgHex=#f1f1ef]
// Trims the mark tight and fills each icon edge to edge on a transparent background,
// so the favicon is as large as possible and matches the navbar logo exactly.
// apple-touch-icon stays opaque (iOS fills transparency with black), on the site paper color.
const path = require("path");
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));

const [, , MARK, OUT = "public", APPLE_HEX = "#f1f1ef"] = process.argv;
if (!MARK) throw new Error("usage: node make-icons-transparent.cjs <logo-mark.png> <outDir> [appleBgHex]");
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

(async () => {
  // Tight crop, then square it up so the mark stays centered
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

  async function icon(size, file, fill, bg = CLEAR) {
    const inner = Math.round(size * fill);
    let mark = sharp(square).resize(inner, inner, { kernel: "lanczos3" });
    if (size <= 48) mark = mark.sharpen({ sigma: 0.5 });
    await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: await mark.png().toBuffer(), gravity: "center" }])
      .png()
      .toFile(path.join(OUT, file));
    console.log(file, size);
  }

  const n = parseInt(APPLE_HEX.replace("#", ""), 16);
  const appleBg = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha: 1 };

  await icon(16, "favicon-16x16.png", 1);
  await icon(32, "favicon-32x32.png", 1);
  await icon(48, "favicon-48x48.png", 0.98);
  await icon(512, "favicon.png", 0.96);
  await icon(160, "app_icon.png", 0.96);
  await icon(192, "android-chrome-192x192.png", 0.92);
  await icon(512, "android-chrome-512x512.png", 0.92);
  await icon(180, "apple-touch-icon.png", 0.8, appleBg);
})();
