export const state = {
  mode: 'boot',
  discovered: new Set(),
  secrets: new Set(),
  muted: false,
  interactTarget: null,
  nearestNode: null,
  launched: false,
  fpsSamples: [],
  downgraded: false
};

const listeners = {};
export function on(evt, fn) {
  (listeners[evt] || (listeners[evt] = [])).push(fn);
}
export function emit(evt, data) {
  const list = listeners[evt];
  if (list) for (const fn of list) fn(data);
}
export const bus = { on, emit };
