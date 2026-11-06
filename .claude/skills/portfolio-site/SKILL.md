---
name: portfolio-site
description: Build and maintain Nripesh Niketan's portfolio site (NripeshNiketan.github.io) — where the repo, design rules, fact rules, skill packs and build commands live. Use for any work on his personal website, hero shader, stages, copy or deploy.
---

# portfolio-site

The site lives at `Nripesh-CV/NripeshNiketan.github.io/` in the connected Nripesh-CV folder. It is a Vite + TypeScript one-pager with Three.js, GSAP and Lenis, deployed by GitHub Pages from `main`.

## Start here, every time

1. Read `CLAUDE.md` in the site repo, then `docs/DESIGN.md` (look, tokens, motion, 3D, anti-patterns) and `docs/CONTENT_PLAN.md` (copy, data sources, open decisions).
2. Refresh figures before quoting any number: `npm run figures` writes `src/data/figures.json` with an "as at" date. The site never carries a number typed from memory.
3. The facts file is `../profile/MASTER_PROFILE.md` (gitignored in Nripesh-CV; never copy it into the site repo).

## Hard rules

- Pushing to `main` deploys live. Work on `portfolio`; merge only on Nripesh's go-ahead.
- Never show MetalFish's withdrawn figures (74×, Elo ratings, Lc0 throughput comparisons, M1 Ultra scaling, early-stop savings). The Lichess bot record from `lichess.org/api/user/Nripesh-MetalFish` is fine.
- "CrossGL LLC". Leeds PhD = unconditional offer, Oct 2027.
- No phone, address, immigration details, nationality, salary on the site.
- Copy in his README voice; British spelling; humanizer pass on anything new.
- Design anti-patterns in `docs/DESIGN.md` §7 are a hard no (cream+serif+terracotta, black+neon, hairline broadsheet, SaaS cards, eyebrow labels, middle dots, arrows on links, fade-up on every section).

## Skill packs in the repo

`bash scripts/install-skills.sh` restores 30 skills into `.claude/skills/` (gitignored; SHAs in `scripts/skills.lock`): ui-ux-pro-max (+ ui-styling, design-system, design, brand), the claudedesignskills set (threejs-webgl, gsap-scrolltrigger, modern-web-design, web3d-integration-patterns, lightweight-3d-effects, animejs, scroll-reveal-libraries, lottie-animations, locomotive-scroll, barba-js, pixijs-2d, spline-interactive, rive-interactive, blender-web-pipeline, motion-framer, react-three-fiber, react-spring-physics, animated-component-libraries, babylonjs-engine, playcanvas-engine, aframe-webxr, substance-3d-texturing), 3dviz-pro-max, and motion-graphics. Read the relevant `SKILL.md` before building a stage; the routing table is in the site's `CLAUDE.md`.

In a Cowork session the Mac shell is a Linux VM with the folder mounted: read the skill files with `cat`/`sed` there; network works for `npm`, `git` and the public APIs. Downloaded skill scripts may be blocked from executing by the sandbox; read their data files directly instead.

## Build and check

```bash
npm install && npm run figures && npm run typecheck && npm run build
```
Before calling a stage done, capture real frames at 360/768/1024/1440 (3dviz-pro-max `scripts/capture.py` or Playwright) and look at them. Check `prefers-reduced-motion`. First-load JS budget: 90 KB; Three.js is lazy.
