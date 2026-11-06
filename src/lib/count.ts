// Figures count up once, the first time they come into view. Plain numbers only; text values
// (a version string) are left alone. Off under reduced motion.
export function initCounters(root: ParentNode = document): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = Array.from(root.querySelectorAll<HTMLElement>('.figures dd'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target as HTMLElement;
      const text = el.textContent?.trim() ?? '';
      const n = Number(text.replace(/,/g, ''));
      if (!Number.isFinite(n) || !/^[\d,]+$/.test(text)) continue;
      const start = performance.now(); const dur = 900 + Math.min(600, n / 4);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur); const k = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(n * k).toLocaleString('en-GB');
        if (t < 1) requestAnimationFrame(step); else el.textContent = n.toLocaleString('en-GB');
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}
