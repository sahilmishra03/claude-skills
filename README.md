# claude-skills

Agent skills you can run from a single prompt: give a repo link and say what you want.

| Skill | What it makes |
| --- | --- |
| [`launch-video`](skills/launch-video/SKILL.md) | An ~80 s product launch video: the app running in the iOS Simulator on a MacBook, clean gradient backdrop, cursor taps, chapter titles, original soundtrack, sharp 1440p, a thumbnail, and a clean player embedded under the landing page hero. |
| [`logo-branding`](skills/logo-branding/SKILL.md) | A logo from 6 AI-generated candidates, plus the transparent navbar mark, an ink version for light backgrounds, every favicon and app-icon size, and the navbar, metadata and manifest wired into the site. |

Both skills read the project first, so names, colours, fonts and screen labels come from your real code.

## Install

Each skill is a folder with a `SKILL.md`. Copy the folders into your agent's skills directory.

**Claude Code** (all projects):
```bash
git clone https://github.com/sahilmishra03/claude-skills.git
cp -r claude-skills/skills/* ~/.claude/skills/
```
For one project only, copy into `<project>/.claude/skills/`.

**Kiro**: copy into `~/.kiro/skills/` (or `<project>/.kiro/skills/`).

Windows PowerShell:
```powershell
git clone https://github.com/sahilmishra03/claude-skills.git
Copy-Item -Recurse claude-skills\skills\* "$HOME\.claude\skills\"
```

## Requirements

- **launch-video**: Node 20+, Python 3.10+ with `numpy scipy pillow`, ffmpeg, Google Chrome. No API keys; the music is synthesised locally.
- **logo-branding**: Node 20+ with `sharp`, and a free Pollinations key in `POLLINATIONS_KEY` (https://enter.pollinations.ai).

## One-prompt usage

```text
Use the launch-video skill. Repo: https://github.com/<you>/<app>
Make an 80 s launch video and embed it under the hero of the landing page.
```

```text
Use the logo-branding skill. Repo: https://github.com/<you>/<site>
Make the logo yourself and apply it everywhere.
```

Both together:
```text
Repo: https://github.com/<you>/<app>. First use logo-branding to make and apply the logo,
then use launch-video to make the launch video with that logo and put it on the landing page.
```

Add anything else to the prompt (length, features to show, colours, a subject for the logo) and it overrides the defaults.

## What's inside

```
skills/
  launch-video/
    SKILL.md              workflow, rules and verification
    template/             working video engine (demo.html/css/js), frame recorder, soundtrack and backdrop generators
    landing/VideoTour.tsx player component (poster, sound on, minimal controls)
  logo-branding/
    SKILL.md
    scripts/              Pollinations generator, mark/ink/icon builders
```

The `launch-video` template is a complete example (the RunwayX finance app). The skill keeps its engine and rewrites the screens, storyboard and copy for your app.
