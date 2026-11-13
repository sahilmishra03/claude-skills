---
name: logo-branding
description: Design and apply a complete logo and favicon set for a website or app (Next.js, Vite, React, plain HTML, Flutter). Reads the project, proposes 3 directions, generates 6 candidates with a real image model via Pollinations, builds a transparent navbar mark, an ink version for light backgrounds, rounded-tile app icons and every favicon size, then wires navbar, metadata and manifest and verifies the build. Use when the user gives a repo link or project and asks to brand it, make a logo, replace a favicon or fix the navbar logo.
---

# Logo branding

End to end: read the project → 3 directions → 6 images → pick one → build every asset → wire it in → verify. Don't ask again unless a step says to.

Scripts are in `scripts/` next to this file. Copy them into `<project>/brand/scripts/` and run them from the project root (they resolve `sharp` from the project).

## 0. Inputs and requirements

- **Repo link**: if the user gives a GitHub URL, clone it (`gh repo clone <owner/repo>` or `git clone`) and work inside it. The user's prompt (subject idea, colours, "do it yourself") overrides the defaults below.
- **Image key**: env var `POLLINATIONS_KEY` (free at https://enter.pollinations.ai). If it isn't set, ask for it once. Never write the key to a file, commit or log; pass it as an env var for the single command.
- **Model**: `openai/gpt-image-2`. If it errors, fall back in order to `community/vendouple/nano-banana-pro`, then `black-forest-labs/flux.1.1-pro`, and tell the user which one was used. Free-tier Gemini keys have zero image quota; don't use Gemini unless the user confirms billing.
- **sharp**: if `node -e "require('sharp')"` fails in the project root, `npm i -D sharp`, and remove it at the end if it wasn't there before.
- Note `git status` first so changes can be reverted cleanly.

## 1. Read the project (read-only)

- Name, purpose, audience: README, `package.json` / `pubspec.yaml`, landing copy.
- **Theme**: page background, surface, and one accent (grep Tailwind classes, CSS vars and hex values). Decide **light or dark theme**; it changes the assets in step 4.
- **Every logo use**: grep `favicon|app_icon|logo|apple-touch|webmanifest|icon.svg` in `src/`, `app/`, `public/`, `index.html`. Note each `<img>`/`<Image>` and any CSS filter on it (`brightness-0 invert` etc. must go).
- Framework docs for icons/metadata in the installed version (Next.js: `node_modules/next/dist/docs/` → `generate-metadata`).

## 2. Style rules

- Raw, severe, technical, premium. Flat geometry, crisp straight edges. **Not cute, not cartoon, not a mascot**: no pupils, no smile, no glow, no gradients, no 3D.
- Exactly 3 colours: off-white mark (`#F4F4F0`), the site's accent, and a solid very dark background (`#111111` or the site surface). Generation always happens on dark, so the background can be keyed out cleanly; the light-theme version is derived in step 4.
- 4–7 large shapes, one defining feature, readable at 32×32. Centred and symmetric, filling ~62% of the square.
- No text, letters, border, frame or rounded tile in the generated image. Tiles are added in post.

## 3. Directions and candidates

Write three one-line directions, `<subject> — <product connection> — <defining silhouette>`, tied to the product (finance runway → road with an up-chevron; trading → bull with candlestick; legal → pillar). If the user named a subject, keep it and vary the treatment. Then generate right away (six outputs are pre-authorised): A1, A2, B1, B2, C1, C2.

1. `brand/directions.json`:
   ```json
   {
     "background": "solid very dark charcoal (#111111)",
     "mark": "off-white (#F4F4F0)",
     "accent": "lime green (#9BE15D)",
     "directions": {
       "A": "a straight road in perspective narrowing to a point, with one lime upward chevron floating above it",
       "B": "…",
       "C": "…"
     }
   }
   ```
2. Run: `POLLINATIONS_KEY=<key> node brand/scripts/generate.mjs brand/directions.json brand/candidates` (PowerShell: `$env:POLLINATIONS_KEY='<key>'; node …`). Writes `A1.png … C2.png` plus a `.prompt.txt` each (model, seed, prompt).
3. Look at all six once; no automatic retries. If the user said "do it yourself", pick the most on-theme one that still reads at 32 px and say why in one line. Otherwise show them and ask.

## 4. Build the assets

```bash
node brand/scripts/make-mark.cjs brand/candidates/C2.png public/logo-mark.png              # transparent mark (light parts) for dark backgrounds
node brand/scripts/make-ink.cjs public/logo-mark.png public/logo-mark-ink.png "#111111"   # ink mark for light backgrounds
```
Then **one** icon set, by theme:
- **Dark site**: `node brand/scripts/make-icons.cjs public/logo-mark.png public "#11110f"`. Dark rounded tile (32-grid, inset 1, radius 9), light mark.
- **Light site**: `node brand/scripts/make-icons-tile.cjs public/logo-mark-ink.png public "#ffffff"`. White full-bleed tile (22% radius), ink mark; also writes `logo-tile.png`. This keeps the favicon, navbar and footer identical.
- **No tile wanted**: `make-icons-transparent.cjs <mark> public <appleBgHex>`. The mark fills the icon edge to edge; apple-touch stays opaque.

All of them write `favicon-16x16/32x32/48x48.png`, `favicon.png` (512), `app_icon.png` (160), `android-chrome-192x192/512x512.png` and `apple-touch-icon.png` (180, opaque). Small sizes use a bigger mark so they stay clear in a tab. If you have an SVG mark, `render-svg.cjs <in.svg> <out.png> 512` turns it into the transparent PNG input.

**Rule: use the ink logo on any light background and the light logo only on dark ones.** A light mark on white is invisible.

Verify visually, not by file size. Image viewers can show a stale cached file after an overwrite, so write previews under a new name. Check that the mark spans ~60–85% of each favicon.

## 5. Wire it in

- **Navbar/header**: the transparent mark matching the header background (ink on light, light on dark), never the tiled icon. Remove invert filters. Balance it with the wordmark: mark `h-9 w-9 shrink-0`, wordmark `text-xl font-bold leading-none`, `gap-2.5 items-center`. Add `priority` to the above-the-fold Next `<Image>`. Update every place: desktop nav, mobile menu, footer, login, emails.
- **Next.js** (`app/layout.tsx`): drop hand-written `<link rel="icon">` tags and use
  ```ts
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  ```
  `themeColor` goes in `export const viewport`, not `metadata`.
- **Vite / plain HTML**: the same set as `<link>` tags in `index.html`.
- **`site.webmanifest`**: `name`, `short_name`, `theme_color` and `background_color` = site background, 192/512 icons.
- **Flutter app** (if asked): `flutter_launcher_icons` with `android-chrome-512x512.png` / `favicon.png` as the source.

## 6. Verify (all required)

1. Re-read every edited file from disk to confirm the edit saved.
2. Lint the edited files, then a production build.
3. Grep the built HTML (Next: `.next/server/app/index.html`) for `rel="icon"`, `apple-touch-icon`, `manifest`, and the navbar `<img>` pointing at the right mark.
4. Screenshot the header on its real background and confirm the logo is clearly visible.
5. Tell the user to hard-refresh (Ctrl+F5); browsers cache favicons hard.

## 7. Clean up and report

Keep `brand/` (candidates, prompts, scripts, `directions.json`) so the logo can be swapped later; delete temporary previews. Report the chosen candidate and why, the files changed, what was verified and what wasn't. Remind the user to rotate any API key they pasted in chat. To revert: `git restore` the tracked files and delete the new ones listed by `git status`.

## Copy-paste prompt

> Use the `logo-branding` skill. Repo: <github url>. Read the project for name, purpose and theme; propose 3 directions and generate 6 candidates (key in `POLLINATIONS_KEY`), raw and technical, not cartoon. Pick the best yourself, build the transparent mark, the ink mark for light backgrounds and the full favicon/app-icon set for the site's theme, wire the navbar, metadata and manifest, then lint, build and verify. Only ask me for the key if it's missing.
