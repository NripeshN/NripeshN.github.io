import { defineConfig, type Plugin } from 'vite';
import glsl from 'vite-plugin-glsl';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHighlighter } from 'shiki';

// Build-time content: every figure on the page is read from src/data/figures.json and every code
// panel from content/targets/*.txt (CrossTL output), so the HTML is complete without JavaScript.
// Tokens in index.html:  {{fig:crosstl.stars}}  {{date:asAt}}  {{code:lanes.metal}}  {{lines:lanes.metal}}

const MAX_LINES = 140; // longer outputs are cut at build; the full file is linked

const TARGET_LANG: Record<string, string> = {
  webgl: 'glsl', opengl: 'glsl', metal: 'cpp', directx: 'hlsl', vulkan: 'text', wgsl: 'wgsl',
  cuda: 'cpp', hip: 'cpp', slang: 'hlsl', rust: 'rust', mojo: 'mojo', cgl: 'glsl',
};

// Three tones on the stage: text, dim (comments), bright (keywords). Colour stays semantic elsewhere.
const stageTheme = {
  name: 'stage',
  type: 'dark' as const,
  colors: { 'editor.background': '#121417', 'editor.foreground': '#D7D6D0' },
  settings: [
    { settings: { foreground: '#D7D6D0' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7E838B' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.new', 'meta.preprocessor', 'keyword.control.directive'], settings: { foreground: '#FFFFFF', fontStyle: 'bold' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#FFFFFF' } },
    { scope: ['constant.numeric', 'string', 'constant.language'], settings: { foreground: '#B9BBC2' } },
    { scope: ['storage.type.built-in', 'support.type', 'entity.name.type'], settings: { foreground: '#ECEBE6' } },
    { scope: ['variable.parameter'], settings: { foreground: '#D7D6D0' } },
  ],
};

function fmt(n: unknown): string {
  if (typeof n === 'number') return n.toLocaleString('en-GB');
  return String(n ?? '');
}
function longDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function portfolioContent(): Plugin {
  return {
    name: 'portfolio-content',
    async transformIndexHtml(html) {
      const root = process.cwd();
      const figures = JSON.parse(readFileSync(resolve(root, 'src/data/figures.json'), 'utf8'));
      const prs = JSON.parse(readFileSync(resolve(root, 'content/prs.json'), 'utf8')) as { asAt: string; prs: { project: string; repo: string; number: number; title: string | null; merged: string | null; url: string }[] };
      const month = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      const prTable = `<table class="table table--prs">
          <caption>Merged pull requests adding Apple Silicon (MPS) support</caption>
          <thead><tr><th scope="col">Project</th><th scope="col">Pull request</th><th scope="col">Merged</th></tr></thead>
          <tbody>
${prs.prs.map((r) => `            <tr><th scope="row">${escapeHtml(r.project)}</th><td><a href="${r.url}">${escapeHtml(r.title ?? `#${r.number}`)}</a></td><td>${r.merged ? month(r.merged) : ''}</td></tr>`).join('\n')}
          </tbody>
        </table>`;
      const targetsDir = resolve(root, 'content/targets');
      const highlighter = await createHighlighter({ themes: [stageTheme], langs: ['glsl', 'hlsl', 'wgsl', 'cpp', 'rust', 'mojo'] });

      const codeCache = new Map<string, { html: string; lines: number }>();
      const codeFor = (name: string) => {
        if (codeCache.has(name)) return codeCache.get(name)!;
        const [, target] = name.split('.');
        const file = resolve(targetsDir, `${name}.txt`);
        const srcFile = resolve(root, 'src/hero/lanes.cgl');
        const text = existsSync(file) ? readFileSync(file, 'utf8') : target === 'cgl' ? readFileSync(srcFile, 'utf8') : '';
        const allLines = text.replace(/\s+$/, '').split('\n');
        const cut = allLines.length > MAX_LINES;
        const shown = cut ? allLines.slice(0, MAX_LINES).join('\n') : allLines.join('\n');
        const lang = TARGET_LANG[target ?? ''] ?? 'text';
        const body = lang === 'text'
          ? `<pre class="shiki stage" tabindex="0"><code>${escapeHtml(shown)}</code></pre>`
          : highlighter.codeToHtml(shown, { lang, theme: 'stage' }).replace('<pre class="shiki', '<pre tabindex="0" class="shiki');
        const note = cut ? `<p class="code-cut">First ${MAX_LINES} of ${fmt(allLines.length)} lines. <a href="https://github.com/NripeshN/NripeshN.github.io/blob/main/content/targets/${name}.txt">Full output in the repo.</a></p>` : '';
        const out = { html: body + note, lines: allLines.length };
        codeCache.set(name, out);
        return out;
      };

      return html
        .replace(/\{\{prs\}\}/g, () => prTable)
        .replace(/\{\{fig:([\w.]+)\}\}/g, (_, p) => fmt(get(figures, p)))
        .replace(/\{\{date:([\w.]+)\}\}/g, (_, p) => longDate(String(get(figures, p))))
        .replace(/\{\{lines:([\w.]+)\}\}/g, (_, n) => fmt(codeFor(n).lines))
        .replace(/\{\{code:([\w.]+)\}\}/g, (_, n) => codeFor(n).html);
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [glsl(), portfolioContent()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
          return undefined;
        },
      },
    },
  },
});
