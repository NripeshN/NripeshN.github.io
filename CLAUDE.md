# CLAUDE.md — NripeshNiketan.github.io (portfolio site)

Nripesh Niketan's personal site, deployed by GitHub Pages from this repo (user site, served at the domain root). Read this file, then `docs/DESIGN.md` and `docs/CONTENT_PLAN.md`, before touching anything.

## What this is

A one-page portfolio (Vite + TypeScript, vanilla DOM, Three.js, GSAP, Lenis) whose hero shader is translated by CrossTL at build time. Paper (white) page with dark "stages" where code and 3D run. The design rules in `docs/DESIGN.md` are binding: tokens, type (Archivo + Commit Mono), the anti-pattern list, the motion budget.

## Facts

1. **Every number on the site comes from `src/data/figures.json`** (pulled by `npm run figures` from the GitHub, PyPI, Lichess and OpenAlex APIs; refreshed weekly by the deploy workflow) or from `content/*.json`. Nothing is typed from memory. Quote an "as at" date next to any live figure.
2. The facts behind the copy are in `../profile/MASTER_PROFILE.md` (the Nripesh-CV workspace one level up; gitignored there, never copied here). If the two disagree, the live API wins for public figures and MASTER_PROFILE wins for everything else; say so in the PR.
3. **MetalFish:** never show the withdrawn figures (74× speedup, any Elo rating, Lc0 throughput comparisons, M1 Ultra scaling, early-stop savings). Citable: the Lichess bot record from the API; Metal inference 135/538 pos/s; alpha-beta 1.53M/11.81M nps (M2 Max, Oct 2026).
4. Company name is **CrossGL LLC**. The Leeds PhD is an **unconditional offer for October 2027**, never "incoming".
5. Not on the site: phone, address, immigration details, nationality, salary, unverified awards.
6. Copy is first person, British spelling, in the voice of his GitHub README (`github.com/NripeshN`). No "passionate", "excited", "leverage", "thought leader". Run the humanizer on new copy.

## Rules

- **Pushing to `main` deploys the live site.** Work on a branch (`portfolio`); merge only when Nripesh says so. Never force-push.
- Never commit secrets. The deploy workflow uses the repo's own `GITHUB_TOKEN` only.
- Third-party skills live in `.claude/skills/` and are gitignored; `bash scripts/install-skills.sh` restores them (versions in `scripts/skills.lock`). Only `.claude/skills/portfolio-site/` is committed.
- Hero shader: `src/hero/field.cgl` is the source; the emitted targets are committed with the CrossTL version in a header comment. Re-emit after every CrossTL release (`npm run hero`, to be written: runs `crosstl translate` for each backend).
- Keep first-load JS under 90 KB; Three.js stages load on intersection. Check with `npm run build` and read the size table.
- Before calling any stage done: capture real frames (3dviz-pro-max `scripts/capture.py` or Playwright) at 360, 768, 1024, 1440 and look at them. Respect `prefers-reduced-motion`.

## Which skill for what

| Task | Read first |
|---|---|
| Any visual or layout decision | `docs/DESIGN.md`, then `.claude/skills/ui-ux-pro-max/SKILL.md` (data in `data/*.csv`) and `.claude/skills/modern-web-design/SKILL.md` |
| Three.js stages (hub graph, chess board) | `.claude/skills/3dviz-pro-max/SKILL.md` (capture workflow), `.claude/skills/threejs-webgl/SKILL.md` |
| Scroll pin, code morph, counters | `.claude/skills/gsap-scrolltrigger/SKILL.md` (GSAP 3.13+ plugins are all free) |
| Smooth scroll | Lenis is already wired in `src/main.ts`; `.claude/skills/locomotive-scroll/references/gsap_integration.md` has the ScrollTrigger proxy pattern |
| Video loop for the LinkedIn banner / OG image | `.claude/skills/motion-graphics/SKILL.md` |
| Lottie / Rive / Spline | only if a stage genuinely needs authored animation; prefer procedural |

## Commands

```bash
npm install            # once
npm run figures        # refresh src/data/figures.json (network)
npm run dev            # http://localhost:5173
npm run typecheck && npm run build
npm run skills         # restore .claude/skills/
```
