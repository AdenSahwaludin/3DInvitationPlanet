export const EASE = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1
};

const active = [];

export function tween({ from = 0, to = 1, dur = 1, delay = 0, ease = 'inOutQuad', onUpdate, onDone }) {
  const h = { cancelled: false, start: performance.now() + delay * 1000, from, to, dur: dur * 1000, ease: EASE[ease] || EASE.inOutQuad, onUpdate, onDone };
  active.push(h);
  return h;
}

export function updateTweens(now) {
  for (let i = active.length - 1; i >= 0; i--) {
    const h = active[i];
    if (h.cancelled) { active.splice(i, 1); continue; }
    if (now < h.start) continue;
    const raw = Math.min(1, (now - h.start) / h.dur);
    const val = h.from + (h.to - h.from) * h.ease(raw);
    if (h.onUpdate) h.onUpdate(val, raw);
    if (raw >= 1) {
      active.splice(i, 1);
      if (h.onDone) h.onDone();
    }
  }
}

export function cancelTween(h) { if (h) h.cancelled = true; }

export function lerp(a, b, t) { return a + (b - a) * t; }
export function damp(a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); }
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
