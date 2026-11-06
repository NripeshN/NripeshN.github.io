// Live figures: the page is built with src/data/figures.json; if the public APIs answer, newer values
// replace them and the "as at" date becomes today. Both APIs allow CORS. Any failure leaves the build-time
// numbers in place.
const fmt = (n: number) => n.toLocaleString('en-GB');
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const set = (key: string, value: string) => {
  document.querySelectorAll<HTMLElement>(`[data-live="${key}"]`).forEach((el) => { el.textContent = value; });
};

export async function refreshCrossTL(): Promise<void> {
  try {
    const r = await fetch('https://api.github.com/repos/CrossGL/crosstl', { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return;
    const d = await r.json();
    if (typeof d.stargazers_count === 'number') set('stars', fmt(d.stargazers_count));
    if (typeof d.forks_count === 'number') set('forks', fmt(d.forks_count));
    set('asat', today());
  } catch { /* keep build-time figures */ }
}

export async function refreshBot(): Promise<void> {
  try {
    const r = await fetch('https://lichess.org/api/user/Nripesh-MetalFish', { headers: { Accept: 'application/json' } });
    if (!r.ok) return;
    const d = await r.json();
    const c = d.count ?? {};
    if (typeof c.all === 'number') set('bot-games', fmt(c.all));
    if (typeof c.draw === 'number') set('bot-draws', fmt(c.draw));
    if (typeof c.win === 'number') set('bot-wins', fmt(c.win));
    if (typeof c.loss === 'number') set('bot-losses', fmt(c.loss));
    for (const k of ['bullet', 'blitz', 'rapid']) {
      const v = d.perfs?.[k]?.rating;
      if (typeof v === 'number') set(`bot-${k}`, fmt(v));
    }
    set('bot-asat', today());
  } catch { /* keep build-time figures */ }
}
