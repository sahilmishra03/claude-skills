// Usage: node make-ink.cjs <logo-mark.png> <out logo-mark-ink.png> [inkHex=#111111] [accentHex]
// Makes the light-background version of a transparent mark: the off-white parts
// become ink, and the accent is darkened (or replaced with accentHex) so it still
// passes contrast on white. Use it anywhere the logo sits on a light surface.
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));
const [, , SRC, OUT, INK = "#111111", ACCENT] = process.argv;
if (!SRC || !OUT) throw new Error("usage: node make-ink.cjs <logo-mark.png> <out.png> [inkHex] [accentHex]");
const hex = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const ink = hex(INK);
const acc = ACCENT ? hex(ACCENT) : null;
(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0;
    let out;
    if (sat < 0.25) out = ink; // neutral (off-white) parts -> ink
    else if (acc) out = acc;
    else out = [r * 0.55, g * 0.55, b * 0.55]; // darken the accent for light backgrounds
    data[i] = out[0]; data[i + 1] = out[1]; data[i + 2] = out[2];
  }
  await sharp(data, { raw: info }).png().toFile(OUT);
  console.log(OUT, info.width, "x", info.height);
})();
