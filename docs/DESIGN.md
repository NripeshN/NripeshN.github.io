# Design direction — nripeshn.github.io

Status: proposal, 6 Nov 2026. Decisions marked **[Nripesh]** need his answer before build.

## 1. The brief in one line

A site that proves, inside thirty seconds, that Nripesh builds real compilers that work — and then lets a compiler engineer, a hiring manager at Arm or Apple, or a PhD supervisor inspect the evidence at their own pace.

Audience, in order: compiler/GPU/ML-systems engineers and hiring managers (Arm, Apple, Modular, Codeplay, Graphcore, Hugging Face, Lightning); PhD supervisors (Edinburgh, Glasgow, Oxford, Imperial, Manchester, Leeds); Tech Nation / Global Talent assessors, who look for public evidence of "exceptional promise". All three are allergic to marketing copy and persuaded by code, numbers with dates, and things that run.

## 2. The one memorable thing

**The hero shader is translated by CrossTL.** The full-bleed canvas behind the headline runs a fragment shader whose GLSL ES (WebGL 2) and WGSL (WebGPU, where available) were emitted by `crosstl translate` from one CrossGL source file at build time. The source and the emitted code sit beside the canvas. Scrolling into the first section pins the code panel and morphs the output through the targets (Metal → HLSL → SPIR-V → WGSL → CUDA → Mojo …), each one real CrossTL output, while the shader keeps running. Nothing on the page says "universal shader translator"; the page *is* one.

Everything else on the site is quiet so that this lands.

## 3. Concept: paper and stage

The page is **paper**: white, black type, generous margins, the writer talking. Three sections are **stages**: dark, full-bleed, where the machine runs (the CrossTL translation stage, the MetalFish board, the 3D IR graph). Scrolling from paper into a stage is the site's one orchestrated transition — the background inverts over ~120px of scroll, like a terminal opening — and it is justified by content: on the stage, the thing being described is actually executing.

Light-first is a deliberate departure from the default "GPU engineer = black site with neon" look (and from crossgl.net, which is dark; this is the person, not the company). The dark stages give 3D and shader work the contrast they need without making the whole site a night mode.

## 4. Tokens

### Colour

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FFFFFF` | page background |
| `--ink` | `#000000` | headings, body |
| `--ink-2` | `#55585E` | secondary text, captions, dates |
| `--rule` | `#D9DBDF` | table rules only (tables encode structure; no decorative lines) |
| `--stage` | `#121417` | stage background |
| `--stage-ink` | `#ECEBE6` | text on stage |
| `--stage-ink-2` | `#8E9299` | secondary on stage |

**Colour means language.** The only chromatic colour on the site is semantic: each GPU language/target has a hue, used for its code-panel tab, its spoke in the IR graph, its row marker in the coverage chart, and nothing else. Headlines, buttons, links stay ink. (Approximations of the colours each ecosystem uses for itself; keep them unsaturated enough to sit on white; always paired with a text label, never colour alone.)

| Target | Token | Hue |
|---|---|---|
| CrossGL (hub) | `--lang-cgl` | ink / stage-ink (neutral) |
| CUDA | `--lang-cuda` | `#76B900` |
| HIP | `--lang-hip` | `#E0282E` |
| Metal | `--lang-metal` | `#8E6CFF` |
| HLSL / DirectX | `--lang-hlsl` | `#1F9D8F` |
| GLSL / OpenGL | `--lang-glsl` | `#4F7FD9` |
| GLSL ES / WebGL | `--lang-webgl` | `#7EA4E6` |
| SPIR-V / Vulkan | `--lang-spirv` | `#B3142A` |
| WGSL / WebGPU | `--lang-wgsl` | `#2457C5` |
| Slang | `--lang-slang` | `#D99A1E` |
| Rust (rust-gpu) | `--lang-rust` | `#B7410E` |
| Mojo | `--lang-mojo` | `#FF5A1F` |
| OpenCL C (input only) | `--lang-opencl` | `#F28C28` |

Twelve hues cannot all be far apart; the chart and tabs always carry the language name, so near neighbours (HIP/SPIR-V, Rust/Mojo/OpenCL) are acceptable.

### Type

Two families, clearly distinct.

- **Archivo** (variable: `wdth` 62–125, `wght` 100–900; Google Fonts, OFL). One family does two jobs by width: display at `wdth 72–78`, `wght 560`, tight tracking (−0.02em) and leading (0.95); body at `wdth 100`, `wght 400`. The narrow display reads as Swiss poster type and as engineering drawing labels; nothing about it says "AI template".
- **Commit Mono** (self-hosted, OFL) for code, terminal output and chess notation — i.e. for things that are actually monospaced in life. Not for data labels, dates or eyebrows.

Scale (Elements of Typographic Style, fluid):

```
--t-display: clamp(3.25rem, 1.5rem + 7vw, 8.5rem)   /* hero headline, section openers */
--t-h2:      clamp(2rem, 1.2rem + 3vw, 3.75rem)
--t-h3:      clamp(1.25rem, 1.05rem + 0.8vw, 1.625rem)
--t-body:    clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)  /* 17–19px, line-height 1.55, max 68ch */
--t-small:   0.9375rem
--t-code:    0.9375rem / 1.6
```

Body measure under 70 characters. Sentence case everywhere. No all-caps labels, no tracked-out eyebrows, no middle-dot separators, no arrows appended to links.

### Layout

12-column grid, max 1440px, gutter `clamp(1rem, 2vw, 2rem)`, outer margin `clamp(1.25rem, 6vw, 7rem)`. Left-aligned throughout.

- Headlines: columns 1–8.
- Prose: columns 2–8 (keeps the measure; the empty first column is the site's breathing room).
- Visuals: columns 7–13, bleeding to the right edge; stages are full-bleed.
- Tables (PR list, publications, coverage): columns 1–13, with real `<table>` markup.

Structure is carried by whitespace and the paper/stage flip, not by rules or cards. Numbered markers appear in exactly two places where the content is a sequence: the compilation pipeline (source → frontend → CrossGL → generator → target) and chess move lists.

```
PAPER
 Nripesh Niketan                                   Work  Research  Papers  Chess  Contact
 ┌──────────────────────────┐   ┌──────────────────────────────────────────────┐
 │ I write compilers,       │   │                                              │
 │ mostly for GPU code.     │   │   live canvas — fragment shader emitted by   │
 │                          │   │   CrossTL from field.cgl (GLSL ES / WGSL)    │
 │ CrossTL · MLX · MetalFish│   │                                              │
 │ Sheffield                │   └──────────────────────────────────────────────┘
 └──────────────────────────┘   field.cgl  →  webgl  (code strip, two lines)
STAGE ───────────────────────────────────────────────────────────── pinned, scrubbed
 │ shader Field {            │  #include <metal_stdlib>                        │
 │   fragment { ... }        │  fragment float4 main_fragment(...)             │
 │ }                         │  tabs: Metal HLSL SPIR-V WGSL CUDA HIP Mojo …    │
 │        ◉ hub-and-spoke graph (Three.js) orbits as the tab changes           │
 live: 1,696 stars · 129 forks · 64 contributors · v3.5.0 · 13 PyPI releases · as at 6 Nov 2026
 coverage.svg from the CrossTL CI branch
PAPER ─── Macs have GPUs (table of PRs) · MLX · ROCm PR (open)
STAGE ─── MetalFish: board, bot record (live from Lichess), the honest numbers
PAPER ─── Papers · Research direction · Timeline · Chess · Contact
```

## 5. Motion

One orchestrated moment, then restraint.

1. **Load:** canvas fades in (400ms), headline words settle from `wdth 62` to `wdth 75` (SplitText, once, 700ms). Nothing else animates on load.
2. **The stage (CrossTL):** Lenis smooth scroll; the panel pins for 7 × 100vh; ScrollTrigger scrub moves through the targets. Code morph is line-diff aware (FLIP on matched lines, fade for the rest) so the eye can follow `y[i] = a*x[i] + y[i]` becoming `y[i] = saxpy_Args.a * x[i] + y[i]`. Tabs are also clickable and keyboard-focusable; clicking jumps the scroll.
3. **Hub-and-spoke graph:** camera orbits ~25° per target; the active spoke brightens. It is a secondary element inside the stage, not a hero of its own.
4. **MetalFish stage:** pieces are placed by the move list — the board plays through the nine moves of the Vienna Gambit game on scroll, then the mate. Engine search stats (nodes, depth) count up from the recorded values.
5. **Everything else:** no scroll-reveal on sections, no hover lift on cards (there are no cards), link underlines animate on hover (150ms). Live figures count up once when first visible, then stay.
6. `prefers-reduced-motion`: shader renders one still frame; stage shows the Metal output with tabs working as plain buttons; board shows final positions; counters render final values.

## 6. 3D

Three.js (r187), lazy-loaded per stage (`import()` on intersection), never above the fold except the hero canvas (which is a 2D WebGL fragment shader, ~2 KB, no Three.js).

- **IR graph:** 11 target nodes on a ring, one hub, instanced line segments, `troika-three-text` or CSS2D labels so text stays crisp. Material: unlit, ink-on-stage, semantic hue only on the active spoke. Budget: < 30 KB geometry, 60 fps on an M1 Air.
- **Chess board:** low-poly set (own geometry, procedurally generated — no downloaded piece models with unclear rights), orthographic-ish camera at 35°, soft shadow. Pieces move by `gsap.to` on position with a small lift. Fall back to an SVG board (Lichess FEN images are already used in his README) if the WebGL budget is blown.
- Use the installed `3dviz-pro-max` capture workflow (`scripts/capture.py`) to inspect real frames before calling any 3D "done".

## 7. Anti-patterns (hard no)

Warm cream + serif + terracotta; near-black + acid green; hairline broadsheet rules; identical rounded cards with soft grey shadows; gradient washes; AI purple/pink gradients; ALL-CAPS eyebrow labels; `A · B · C` meta strings; `WORD — fragment` labels; `→` on links; monospace for non-code labels; emoji as icons; fade-up on every section; hover scale on every element; "passionate / excited / leverage / thought leader"; any number without a date; any number not in `src/data/figures.json` or `content/*.json`.

## 8. Quality floor

- Responsive 360 → 1920; no horizontal scroll; hero code strip collapses to a single tab on phones.
- Keyboard: visible focus (2px ink outline, offset 3px), skip link, tabs are `role="tablist"`.
- Contrast ≥ 7:1 for body on both paper and stage; semantic hues never carry text.
- Lighthouse: Performance ≥ 90 mobile, Accessibility 100. Budget: ≤ 90 KB JS on first load (hero shader + GSAP core + Lenis), Three.js deferred.
- `alt` on every image; the two chess diagrams keep the alt text from his README.
- Works with JS off: all copy, tables and links render; stages show static output.

## 9. Architecture

```
index.html                 one page; sections are <section id> anchors; /notes later as Vite MPA
src/main.ts                boot: Lenis, stage observers, live figures
src/stages/crosstl/        pinned code morph, tabs, hub graph (lazy)
src/stages/metalfish/      board (lazy), bot record fetch
src/hero/field.cgl         the CrossGL source of the hero shader (committed)
src/hero/field.webgl.glsl  emitted by crosstl at build time (committed with the crosstl version in a header comment)
src/hero/field.wgsl        same, for WebGPU
content/                   languages.json, publications.json, prs.json, timeline.json, copy.md
src/data/figures.json      pulled by scripts/pull-figures.mjs (weekly GitHub Action)
scripts/translate-hero.mjs runs `crosstl translate` for every target → content/targets/*.txt (Shiki-highlighted at build)
.github/workflows/deploy.yml  build → Pages; Monday cron re-pulls figures and redeploys
```

Runtime fetches (progressive): `api.github.com/repos/CrossGL/crosstl` (stars, forks), `lichess.org/api/user/Nripesh-MetalFish` (record). Both allow CORS; both fall back to `figures.json` on failure, and the "as at" date shown is whichever source answered.

Optional phase 3: **Run CrossTL in your browser** — Pyodide loads `crosstl` from PyPI on demand (pure Python, ~10 MB first load, cached), so a visitor can paste their own shader. Only after the static demo is perfect.

## 10. Phases

Status 6 Nov 2026: all five phases built (live mode on Pyodide included); published from `main`.

1. **Foundations (this week):** tokens, type, grid, copy in place, hero canvas with the translated shader, tables, live figures. Deployable on its own.
2. **The stage:** pinned code morph across all targets; hub graph.
3. **MetalFish stage:** board, moves, bot record.
4. **Polish:** capture-and-inspect pass on every stage at 360/768/1024/1440; Lighthouse; reduced-motion; OG image; `/notes` scaffold.
5. **Optional:** Pyodide live mode; a short hero loop rendered with the motion-graphics skill for the LinkedIn banner (1584×396) and the GitHub social preview.

## 11. Decisions for Nripesh

- Decided 6 Nov 2026: **paper-first with dark stages**; **portrait = LinkedIn photo** in the Timeline/About area; Leeds-offer line kept; build on the `portfolio` branch.
- **[Nripesh] Domain:** keep `nripeshn.github.io`, or buy a short domain (e.g. a `.dev`) and add a `CNAME`.
