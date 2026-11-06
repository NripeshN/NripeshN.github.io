// "Run CrossTL in your browser": loads Pyodide (CPython compiled to WebAssembly) from jsDelivr and
// installs crosstl from PyPI with micropip, then translates whatever is in the editor for the active
// target, entirely client-side. A refused construct shows CrossTL's own error, verbatim. The WebGL
// output is compiled into a preview canvas and, if it compiles, into the hero at the top of the page.
import toolchain from '../../content/toolchain.json';
import cglSource from '../hero/lanes.cgl?raw';
import type { Lanes } from '../hero/lanes';

type Pyodide = {
  loadPackage(name: string): Promise<void>;
  runPythonAsync(code: string): Promise<unknown>;
  FS: { writeFile(path: string, data: string): void; mkdir(path: string): void };
  globals: { get(name: string): (...args: unknown[]) => unknown };
};

export interface LiveOptions {
  stage: HTMLElement;
  current(): string;                 // active target
  onTargetChange(cb: () => void): void;
  hero: Lanes | null;
}

const PYODIDE = `https://cdn.jsdelivr.net/pyodide/v${toolchain.pyodide}/full/`;

export function mountLive(opts: LiveOptions): void {
  const { stage } = opts;
  const row = document.createElement('div');
  row.className = 'live';
  row.innerHTML = `
      <button type="button" class="live__button">Run CrossTL in your browser</button>
      <p class="live__note">Loads Python ${toolchain.python} and crosstl ${toolchain.crosstl} from PyPI, about 12 MB, and runs them here. Edit the source; the output follows. Nothing leaves this page.</p>
      <p class="live__status" aria-live="polite"></p>`;
  const intro = stage.querySelector('.stage__intro');
  intro?.insertAdjacentElement('afterend', row);
  const button = row.querySelector<HTMLButtonElement>('.live__button')!;
  const status = row.querySelector<HTMLElement>('.live__status')!;
  button.addEventListener('click', () => { button.disabled = true; void start(); }, { once: true });

  async function start() {
    const say = (t: string) => { status.textContent = t; };
    let py: Pyodide;
    try {
      say('Loading Python…');
      const mod = await import(/* @vite-ignore */ `${PYODIDE}pyodide.mjs`) as { loadPyodide(o: { indexURL: string }): Promise<Pyodide> };
      py = await mod.loadPyodide({ indexURL: PYODIDE });
      say('Installing crosstl from PyPI…');
      await py.loadPackage('micropip');
      await py.runPythonAsync(`import micropip\nawait micropip.install("crosstl==${toolchain.crosstl}")`);
      await py.runPythonAsync(`
import crosstl, traceback, os
os.makedirs('/work', exist_ok=True)
def run(src, backend):
    with open('/work/edit.cgl', 'w') as f:
        f.write(src)
    try:
        return crosstl.translate('/work/edit.cgl', backend=backend)
    except Exception as e:
        return 'refused: ' + ''.join(traceback.format_exception_only(type(e), e)).strip()
`);
    } catch (err) {
      say(`Couldn't start Python in this browser (${(err as Error).message}). The outputs above were made with the same version at build time.`);
      button.disabled = false;
      return;
    }
    const run = py.globals.get('run') as (src: string, backend: string) => string;
    say(`Python ${toolchain.python} and crosstl ${toolchain.crosstl}, running in your browser.`);
    button.textContent = 'Running in your browser';

    // Editor in place of the source panel's code.
    const sourcePanel = stage.querySelector<HTMLElement>('.panel--source')!;
    const pre = sourcePanel.querySelector('pre')!;
    const editor = document.createElement('textarea');
    editor.className = 'editor';
    editor.spellcheck = false;
    editor.setAttribute('aria-label', 'CrossGL source');
    editor.value = cglSource;
    pre.replaceWith(editor);
    sourcePanel.querySelector('.panel__meta')!.textContent = 'CrossGL, editable';

    // Preview canvas for the WebGL output, in the graph's slot while editing.
    const hubEl = stage.querySelector<HTMLElement>('#hub');
    const preview = document.createElement('div');
    preview.className = 'live__preview';
    preview.innerHTML = '<canvas aria-label="Your shader, translated to WebGL by CrossTL in this browser"></canvas><p class="live__preview-note"></p>';
    if (hubEl) { hubEl.classList.add('is-preview'); hubEl.appendChild(preview); } else row.appendChild(preview);
    const canvas = preview.querySelector('canvas')!;
    const previewNote = preview.querySelector<HTMLElement>('.live__preview-note')!;
    let lanes: Lanes | null = null;

    const outputs = Array.from(stage.querySelectorAll<HTMLElement>('.output'));
    const cache = new Map<string, string>();
    let timer = 0;
    const render = async () => {
      const src = editor.value;
      const target = opts.current();
      const key = `${target}\u0000${src}`;
      let out = cache.get(key);
      if (out === undefined) { out = run(src, target); cache.set(key, out); }
      const panel = outputs.find((o) => o.dataset.target === target);
      if (panel) {
        const code = panel.querySelector('pre');
        if (code) { code.classList.toggle('is-refused', out.startsWith('refused:')); code.innerHTML = `<code>${out.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code>`; }
        const meta = panel.querySelector('.panel__meta'); if (meta) meta.textContent = `${out.split('\n').length.toLocaleString('en-GB')} lines, translated here`;
        panel.querySelector('.code-cut')?.remove();
      }
      // Always keep the WebGL preview current.
      const wkey = `webgl\u0000${src}`;
      let web = cache.get(wkey);
      if (web === undefined) { web = run(src, 'webgl'); cache.set(wkey, web); }
      if (web.startsWith('refused:')) { previewNote.textContent = 'WebGL output refused; preview unchanged.'; return; }
      try {
        const { startLanes } = await import('../hero/lanes');
        if (!lanes) lanes = startLanes(canvas, web); else lanes.setSource(web);
        opts.hero?.setSource(web);
        previewNote.textContent = 'Your version, translated to WebGL here; the hero at the top runs it too.';
      } catch (err) {
        previewNote.textContent = `WebGL rejected the output: ${(err as Error).message.split('\n')[0]}`;
      }
    };
    editor.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(() => { void render(); }, 450); });
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); const s = editor.selectionStart, t = editor.selectionEnd; editor.setRangeText('    ', s, t, 'end'); }
    });
    opts.onTargetChange(() => { void render(); });
    await render();
  }
}
