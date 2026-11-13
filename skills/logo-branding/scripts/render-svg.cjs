// Usage: node render-svg.cjs <in.svg> <out.png> [size=512]
// Renders an SVG to a transparent square PNG, for use as the navbar mark and as
// the input to make-icons.cjs.
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));

const [, , SRC, OUT, SIZE = "512"] = process.argv;
if (!SRC || !OUT) throw new Error("usage: node render-svg.cjs <in.svg> <out.png> [size]");

sharp(SRC, { density: 600 })
  .resize(Number(SIZE), Number(SIZE), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(OUT)
  .then((i) => console.log(`${OUT} ${i.width}x${i.height}`));
