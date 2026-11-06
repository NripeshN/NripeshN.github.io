// Target tabs on the CrossTL stage: a plain ARIA tablist. Arrow keys move between tabs; the panel
// for the selected tab is shown and the others hidden. The pinned, scroll-driven morph (phase 2)
// drives the same select() function.
export function initTabs(root: HTMLElement): { select: (target: string) => void; targets: string[] } {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const targets = tabs.map((t) => t.dataset.target!);

  const select = (target: string, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.target === target;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach((p) => { p.hidden = p.dataset.target !== target; });
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.target!));
    t.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -i : e.key === 'End' ? tabs.length - 1 - i : 0;
      if (!dir) return;
      e.preventDefault();
      const next = (i + dir + tabs.length) % tabs.length;
      select(tabs[next]!.dataset.target!, true);
    });
  });
  return { select, targets };
}
