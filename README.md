# nripeshn.github.io

My personal site: [nripeshn.github.io](https://nripeshn.github.io/).

The shader behind the headline is written in CrossGL (`src/hero/lanes.cgl`). The GLSL ES the page runs is what [CrossTL](https://github.com/CrossGL/crosstl) emits from that file, unedited; the same source is shown translated to every other target in `content/targets/`. The "Run CrossTL in your browser" button loads Python with Pyodide and installs `crosstl` from PyPI, so the translation happens client-side.

Every figure on the page comes from `src/data/figures.json`, pulled from the GitHub, PyPI, Lichess and OpenAlex APIs with an "as at" date, and refreshed by the Monday build.

```bash
npm install
npm run figures   # refresh src/data/figures.json (network)
npm run prs       # refresh content/prs.json
npm run hero      # re-emit content/targets/ with the installed crosstl
npm run dev
npm run build
```

Vite, TypeScript, Three.js, GSAP, Lenis, Shiki. Archivo and Commit Mono, self-hosted. Deployed to GitHub Pages by `.github/workflows/deploy.yml`.
