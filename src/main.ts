import './styles/main.css';
import Lenis from 'lenis';
import { startLanes, type Lanes } from './hero/lanes';
import { initTabs } from './lib/tabs';
import { refreshCrossTL, refreshBot } from './lib/live';
import { initCounters } from './lib/count';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Smooth scroll (off under reduced motion; anchors still work through scroll-behavior).
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.11, anchors: true });
  const raf = (t: number) => { lenis!.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

// Hero: the CrossTL-translated shader.
const canvas = document.getElementById('lanes') as HTMLCanvasElement | null;
let hero: Lanes | null = null;
if (canvas) {
  try { hero = startLanes(canvas); } catch (err) { console.warn('lanes shader unavailable', err); canvas.hidden = true; }
}

// The CrossTL stage. Tabs work immediately; the pinned scroll walk and the hub graph (GSAP,
// Three.js) load when the stage comes near, so the first paint carries only the hero.
const stage = document.getElementById('stage');
if (stage) {
  const tabs = initTabs(stage);
  const io = new IntersectionObserver(([e]) => {
    if (!e?.isIntersecting) return;
    io.disconnect();
    import('./stages/crosstl').then(({ initCrossTLStage }) => initCrossTLStage(stage, tabs, lenis, hero)).catch((err) => console.warn('stage unavailable', err));
  }, { rootMargin: '600px' });
  io.observe(stage);
}

// Chess boards (Three.js, lazy): the MetalFish mate and the Vienna Gambit position.
document.querySelectorAll<HTMLElement>('.board__scene[data-fen]').forEach((el) => {
  const io = new IntersectionObserver(([e]) => {
    if (!e?.isIntersecting) return;
    io.disconnect();
    import('./stages/board').then(({ createBoard }) => createBoard(el, {
      fen: el.dataset.fen!, lastMove: el.dataset.last, side: el.dataset.side as 'white' | 'black', theme: el.dataset.theme as 'stage' | 'paper',
    })).catch((err) => console.warn('board unavailable', err));
  }, { rootMargin: '500px' });
  io.observe(el);
});

initCounters();

// Live figures, once the page is idle.
const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 800));
idle(() => { void refreshCrossTL(); void refreshBot(); });
