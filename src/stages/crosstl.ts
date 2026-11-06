// The CrossTL stage: on wide screens the panels pin while scrolling walks through the targets
// (one short step per target, snapping), the tabs stay clickable, and the hub graph turns to the
// active spoke. Below 860px, or under reduced motion, nothing pins; the tabs and graph still work.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import type { Hub } from './hub';
import type { Lanes } from '../hero/lanes';
import { mountLive } from './live';

gsap.registerPlugin(ScrollTrigger);

type Tabs = { select: (target: string) => void; targets: string[] };

const STEP_VH = 34; // scroll distance per target, in viewport heights

export function initCrossTLStage(stage: HTMLElement, tabs: Tabs, lenis: Lenis | null, hero: Lanes | null): void {
  const { targets, select } = tabs;
  const listeners: (() => void)[] = [];
  if (lenis) lenis.on('scroll', ScrollTrigger.update);
  const pinEl = stage.querySelector<HTMLElement>('.stage__pin');
  const hubEl = stage.querySelector<HTMLElement>('#hub');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hub: Hub | null = null;
  let current = targets[0]!;

  const outputs = Array.from(stage.querySelectorAll<HTMLElement>('.output'));
  const show = (target: string) => {
    if (target === current) return;
    current = target;
    select(target);
    hub?.focus(target);
    listeners.forEach((l) => l());
    if (reduced) return;
    const panel = outputs.find((o) => o.dataset.target === target);
    if (panel) gsap.fromTo(panel, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', overwrite: true });
  };
  // Tab clicks route through show() so the graph follows; scroll-driven mode also moves the page.
  stage.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((b) => {
    b.addEventListener('click', () => { const t = b.dataset.target!; if (trigger && lenis) scrollToTarget(t); else show(t); });
  });

  mountLive({ stage, current: () => current, onTargetChange: (cb) => { listeners.push(cb); }, hero });

  // Hub graph, loaded when the stage is near.
  if (hubEl) {
    const load = async () => {
      try {
        const { createHub } = await import('./hub');
        hub = createHub(hubEl, targets, current);
      } catch (err) { console.warn('hub graph unavailable', err); hubEl.hidden = true; }
    };
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { io.disconnect(); void load(); } }, { rootMargin: '400px' });
    io.observe(hubEl);
  }

  // Pinned, scrubbed walk through the targets.
  let trigger: ScrollTrigger | null = null;
  const n = targets.length;
  const scrollToTarget = (t: string) => {
    if (!trigger || !lenis) return;
    const i = targets.indexOf(t);
    const y = trigger.start + (trigger.end - trigger.start) * (i / (n - 1));
    lenis.scrollTo(y, { duration: 0.9 });
  };

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
    if (!pinEl) return;
    stage.classList.add('is-pinned');
    trigger = ScrollTrigger.create({
      trigger: pinEl,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * (STEP_VH / 100) * (n - 1))}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      snap: { snapTo: 1 / (n - 1), duration: { min: 0.15, max: 0.45 }, delay: 0.05, ease: 'power1.inOut' },
      onUpdate: (self) => {
        const i = Math.round(self.progress * (n - 1));
        show(targets[Math.min(n - 1, Math.max(0, i))]!);
      },
    });
    return () => { trigger?.kill(); trigger = null; stage.classList.remove('is-pinned'); };
  });
}
