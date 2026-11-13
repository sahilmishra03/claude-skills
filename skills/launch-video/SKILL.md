---
name: launch-video
description: Make a polished product demo / launch video for an app (MacBook + iOS Simulator, Recordly-style backdrop, cursor taps, chapter titles, original synthesized soundtrack) from the app's real source code, render it sharp at 1440p, make a thumbnail, and embed it on the landing page with a clean custom player. Use when the user gives a repo link or project and asks for a demo video, launch video, product tour, app walkthrough or promo video.
---

# Launch video

One prompt in, finished video out: read the app → write a storyboard → rebuild the real screens in HTML → render frame by frame → add an original soundtrack → thumbnail → embed on the landing page → verify. Don't stop to ask unless a step says so.

`template/` is a complete, working video (the RunwayX finance app). Copy it, keep the engine, and replace the parts marked **project-specific** below. `landing/VideoTour.tsx` is the player component.

## 0. Inputs and tools

- **Repo link**: if the user gives a GitHub URL, clone it (`gh repo clone <owner/repo>` or `git clone`) next to the current workspace. Find two things: the **app source** (Flutter/React Native/Swift/Kotlin/web) and the **landing site** (often a separate repo; ask once only if there is none and the user asked to embed).
- **Prompt**: whatever the user adds (length, tone, features to show, captions language) overrides the defaults here.
- Tools: Node 20+, Python 3.10+ with `numpy scipy pillow`, ffmpeg, and Google Chrome.
  - ffmpeg missing on Windows: `winget install --id Gyan.FFmpeg -e`, then call the full path under `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\...\bin\ffmpeg.exe` (PATH doesn't refresh in the same shell). macOS: `brew install ffmpeg`.
  - In the copied folder: `npm install` (installs `playwright-core`, which drives the installed Chrome via `channel: "chrome"`; no browser download).
- Work in `<landing>/video/` (copy `template/*` there). Add `/video/node_modules` and `/video/out` to `.gitignore`.

## 1. Read the app (read-only)

Collect, without asking:
- Name, one-line value prop, audience: README, store listing text, landing copy.
- **Theme tokens**: colours, fonts, radii, light and dark palettes (Flutter: `lib/theme/*`; web: tailwind config / CSS vars). Copy the app's font files into `video/assets/` if they're bundled.
- **Navigation**: tab bar items, main screens, push flows (Flutter: the navigation wrapper and `features/*/screens`).
- **Real labels**: grep each key screen for UI strings so titles, buttons and empty states match the app word for word, e.g. PowerShell `Select-String -Pattern "(Text|label|title|hint)\s*[:(]\s*'([^']{3,60})'"`.
- Logos: transparent mark for dark backgrounds, **ink (black) mark for light backgrounds**, and the app-icon tile. If only a light mark exists, make the ink one with the `logo-branding` skill's `make-ink.cjs`.

## 2. Storyboard (write it down first)

About 75–90 s at 30 fps. Default arc, adjust to the product:
1. **Kinetic intro, 0–8 s** on white: a question line ("Still guessing / How long will [card stack] your cash last?") then "Meet [logo] Name" with UI chips flying outward.
2. **MacBook rises, 8–10 s**: the Simulator sits centred on the desktop showing the iOS home screen.
3. **Cursor taps the app icon**, the app zooms open from the icon, splash.
4. **Chapters, ~4–8 s each**: sign in → home dashboard → the core action (e.g. scan / create) → the result updating → list view → secondary tabs → the AI or "wow" feature → settings / dark mode. One chapter = one title + one short subtitle.
5. **Outro, last ~7 s**: ink logo + wordmark + tagline + 1–2 pills. Hold the final frame.

Use one consistent sample dataset and make the numbers add up (e.g. runway = cash ÷ burn, totals = sum of rows) across every screen and chapter.

## 3. Build the scene (`demo.js`, `demo.css`)

Engine pieces to **keep**: helpers (`pr`, `eo`, `eio`, `back`, `win`, `typed`), `render(t)`, `renderNav` (push / pop / fade / zoom transitions), tab switching, `renderCursor` (waypoints, press, drag, ripple), `renderCaption`, `camAt`, MacBook / Simulator / menu bar markup, `renderPoster`, `SFX` export, `READY`.

**Project-specific**, rewrite for the new app:
- `buildIntro()` words and chips, `#outro` content in `init()`.
- `buildPhone()`: every screen, rebuilt from the real source with the app's tokens as CSS vars on `#phone` (light + `.dark`). Screens are `.scr` divs; scrollable bodies are `.content`.
- Timeline tables: `A` (app launch time), `NAV`, `TABNAV`, `CURSOR`, `SCROLLS`, `CAPTIONS`, `CHAT_ANSWER`/typed strings, `DARK_AT`, and the per-screen animations in `renderScreens(t)`.
- Web apps: replace `#sim` with a browser window (traffic lights + URL bar) at ~1300×820 and keep everything else.

Hard rules (each one was a real bug or a user rejection):
- **No Xcode, no code, no terminal on screen.** Desktop = menu bar ("Simulator File Edit Device …") + the Simulator only.
- **The whole MacBook stays in frame the entire time.** No crop-zooms into the phone. Camera ≈ `scale 0.8`, centred, with only a slow drift. Chapter titles sit centred **above** the MacBook, never over the phone.
- **Backdrop**: a clean, soft light gradient (`gen_bg.py` → `assets/backdrop.jpg`). Desktop wallpaper: a simple CSS gradient. Never Apple's official wallpapers (copyrighted) and never artwork reused from the website.
- **Logo contrast**: ink/black logo on light backgrounds (splash, login, outro); the light mark only on dark ones.
- **Text must not overlap**: `.content` starts at `top: 54px` under the status bar, and status bars get `background: var(--bg)` so scrolled content passes under them.
- **Visibility**: CSS `visibility` is inherited but a child set to `visible` overrides a hidden parent. When the tab layer is hidden, explicitly hide its children (tabs, tab bar, floating buttons, sheets).
- Hide inactive screens with `visibility`, not `display:none`, so cursor targets keep their geometry.
- **Sharpness**: never use `will-change` in the scene (Chrome rasterises scaled layers at low resolution). `record.cjs` captures at `deviceScaleFactor: 2` and downscales once with Lanczos to 2560×1440.
- Measure text widths only after `document.fonts.ready` (the `measure()` step).

## 4. Check stills before the long render

```powershell
node record.cjs stills "10.5,13.5,16.6,23,34.5,40,47.5,57,64.5,73"   # -> out/still-<t>.png
node record.cjs poster                                               # -> out/poster.png
```
Tile them into one contact sheet with ffmpeg `xstack` and look at it. Fix and repeat until every chapter reads clearly. The image viewer can show a stale cached file after an overwrite: write sheets under a **new file name** each time.

## 5. Render, sound, mux

```powershell
$env:FFMPEG="<path to ffmpeg>"; node record.cjs video 30     # ~6–10 min; run in the background, poll out/record.log
python make_audio.py                                          # reads out/sfx.json -> out/audio.wav
ffmpeg -y -i out/frames.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest ../public/videos/<app>-demo.mp4
ffmpeg -y -i out/poster.png -vf scale=2560:-1:flags=lanczos -q:v 2 ../public/videos/<app>-demo-poster.jpg
```
- `make_audio.py` synthesises everything (pads, pluck arpeggio, bass, drums from the MacBook reveal, a riser, plus click / key / whoosh / pop / chime / shutter / sparkle effects at the `SFX` cue times). It is original, so there's no licensing risk. Never download music. Its 4-bar intro is tuned so the drop lands on the MacBook reveal at 7.85 s; if you move the reveal, change `BPM` so `16 × 60 / BPM` equals the new time.
- Targets: 2560×1440 H.264, about 12–20 MB for 80 s, around −14 LUFS, peak under −1 dBTP. Check with `ffmpeg -i <mp4> -af loudnorm=print_format=summary -f null -`.

## 6. Embed on the landing page

- Copy `landing/VideoTour.tsx` to `src/components/`, set `SRC`, `POSTER` and the copy, and place `<VideoTour />` **directly under the hero** so it's the first thing people see. Add a secondary "Watch the tour" link (play icon) next to the hero CTA pointing at `#demo`.
- The player: poster thumbnail, `preload="none"` (nothing downloads until play), a big centre play button, plays **with sound**, and a minimal pill control bar (play/pause, time, seek, mute, fullscreen) that fades while playing.
- Next.js: in-page anchors from the hero use `<Link href="/#demo">` or a plain `href="#demo"` (the lint rule `no-html-link-for-pages` rejects `<a href="/...">`).
- Other frameworks: same markup in plain HTML/JSX.

## 7. Verify (all required)

1. Frame checks from the **final mp4** (not the stills): `ffmpeg -ss <t> -i <mp4> -frames:v 1` at several chapters, and one full-resolution crop of phone text to confirm it's sharp.
2. `ffprobe`: resolution, duration, an audio stream present. Loudness as above.
3. Lint and production build the site. Start it and use Playwright to: click "Watch the tour", screenshot the poster, press play, then confirm `paused=false`, `muted=false` and `currentTime` advancing. Restart the server after rebuilding, or you'll be testing the old build.
4. Report: length, size, resolution, the chapters, where it's embedded, what was verified, and anything not verified.

## Copy-paste prompt

> Use the `launch-video` skill. Repo: <github url>. Make a ~80 s launch video of the app on a MacBook running the iOS Simulator, Recordly-style clean gradient backdrop, cursor taps, chapter titles above the laptop, original soundtrack, sharp 1440p, a thumbnail, and embed it under the hero of the landing page with a clean player. Only ask me if something is missing.
