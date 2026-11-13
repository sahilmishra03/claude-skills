// Renders demo.html frame by frame.
//   node record.cjs stills 3,20,40      -> out/still-<t>.png
//   node record.cjs poster              -> out/poster.png
//   node record.cjs video [fps]         -> out/frames.mp4 (final-quality video, silent) + out/sfx.json
// Frames are captured at 2x (3840x2160) and downscaled once with Lanczos to
// 2560x1440, which keeps the small phone UI text sharp.
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { chromium } = require("playwright-core");

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const OUT = path.join(__dirname, "out");
const DSF = 2;
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const [mode = "stills", arg = "3,20,40"] = process.argv.slice(2);
  const browser = await chromium.launch({ channel: "chrome", args: ["--force-color-profile=srgb", "--hide-scrollbars", "--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DSF });
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
  await page.goto("file://" + path.join(__dirname, "demo.html").replace(/\\/g, "/"));
  await page.evaluate(() => window.READY);
  const duration = await page.evaluate(() => window.DURATION);

  if (mode === "poster") {
    await page.evaluate(() => window.renderPoster());
    await page.screenshot({ path: path.join(OUT, "poster.png") });
    console.log("poster");
  } else if (mode === "stills") {
    for (const t of arg.split(",").map(Number)) {
      await page.evaluate((x) => window.render(x), t);
      await page.screenshot({ path: path.join(OUT, `still-${t}.png`) });
      console.log("still", t);
    }
  } else {
    const fps = Number(arg) || 30;
    fs.writeFileSync(path.join(OUT, "sfx.json"), JSON.stringify({ duration, sfx: await page.evaluate(() => window.SFX) }, null, 1));
    const n = Math.round(duration * fps);
    const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-vf", "scale=2560:1440:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-tune", "animation",
      "-profile:v", "high", "-pix_fmt", "yuv420p", path.join(OUT, "frames.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
    const started = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate((x) => window.render(x), i / fps);
      const buf = await page.screenshot({ type: "jpeg", quality: 97 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      if (i % 150 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on("close", r));
    console.log("done", n, "frames");
  }
  await browser.close();
})();
