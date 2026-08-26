import { clamp } from './tween.js';

export const input = {
  keys: new Set(),
  move: { x: 0, y: 0 },
  boost: false,
  interactPressed: false,
  mapPressed: false,
  look: { x: 0, y: 0 },
  cursor: { x: 0.5, y: 0.5 },
  zoomDelta: 0,
  dragging: false
};

let canvas = null;
let joyBase = null, joyKnob = null;
let joyActive = false, joyId = null, joyOrigin = { x: 0, y: 0 };
const JOY_MAX = 52;

function keyToMove() {
  let x = 0, y = 0;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y += 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y -= 1;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  return { x, y: Math.max(y, -0.55) };
}

export function initInput(el) {
  canvas = el;

  addEventListener('keydown', e => {
    if (e.target && e.target.matches && e.target.matches('input, textarea, select')) return;
    if (e.repeat) {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      return;
    }
    input.keys.add(e.code);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyE' || e.code === 'Space') input.interactPressed = true;
    if (e.code === 'KeyM') input.mapPressed = true;
    if (e.code === 'Escape') dispatchEvent(new CustomEvent('odyssey-esc'));
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.boost = true;
  });
  addEventListener('keyup', e => {
    input.keys.delete(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.boost = false;
  });

  addEventListener('mousemove', e => {
    input.cursor.x = e.clientX / innerWidth;
    input.cursor.y = e.clientY / innerHeight;
    if (dragInfo.down) {
      input.look.x += (e.clientX - dragInfo.px) * 0.0045;
      input.look.y += (e.clientY - dragInfo.py) * 0.0035;
      dragInfo.px = e.clientX; dragInfo.py = e.clientY;
      input.dragging = true;
    }
  });
  addEventListener('mouseup', () => { dragInfo.down = false; setTimeout(() => { input.dragging = false; }, 60); });

  el.addEventListener('mousedown', e => {
    dragInfo = { down: true, px: e.clientX, py: e.clientY, t: performance.now(), x: e.clientX, y: e.clientY };
  });

  el.addEventListener('wheel', e => {
    e.preventDefault();
    input.zoomDelta += Math.sign(e.deltaY) * 4;
  }, { passive: false });

  el.addEventListener('touchstart', onTouchStart, { passive: false });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('touchend', onTouchEnd);
  el.addEventListener('touchcancel', onTouchEnd);

  el.addEventListener('contextmenu', e => e.preventDefault());
}

let dragInfo = { down: false, px: 0, py: 0, t: 0, x: 0, y: 0 };
let lookTouchId = null, lookLast = { x: 0, y: 0 };

function isUI(target) {
  return target.closest && target.closest('.ui-el, #ui .ui-block');
}

function onTouchStart(e) {
  for (const t of e.changedTouches) {
    if (isUI(t.target)) continue;
    if (t.clientX < innerWidth * 0.45 && !joyActive) {
      joyActive = true; joyId = t.identifier;
      joyOrigin = { x: t.clientX, y: t.clientY };
      showJoy(t.clientX, t.clientY);
    } else if (lookTouchId === null) {
      lookTouchId = t.identifier;
      lookLast = { x: t.clientX, y: t.clientY };
      dragInfo = { down: false, px: 0, py: 0, t: performance.now(), x: t.clientX, y: t.clientY };
    }
  }
  if (e.cancelable) e.preventDefault();
}

function onTouchMove(e) {
  for (const t of e.changedTouches) {
    if (joyActive && t.identifier === joyId) {
      let dx = t.clientX - joyOrigin.x;
      let dy = t.clientY - joyOrigin.y;
      const len = Math.hypot(dx, dy);
      if (len > JOY_MAX) { dx *= JOY_MAX / len; dy *= JOY_MAX / len; }
      joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      input.joy = { x: dx / JOY_MAX, y: -dy / JOY_MAX, active: true };
    } else if (t.identifier === lookTouchId) {
      input.look.x += (t.clientX - lookLast.x) * 0.006;
      input.look.y += (t.clientY - lookLast.y) * 0.0045;
      lookLast = { x: t.clientX, y: t.clientY };
      input.dragging = true;
    }
  }
  if (e.cancelable) e.preventDefault();
}

function onTouchEnd(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) {
      joyActive = false; joyId = null; input.joy = { x: 0, y: 0, active: false };
      hideJoy();
    } else if (t.identifier === lookTouchId) {
      lookTouchId = null;
      setTimeout(() => { input.dragging = false; }, 80);
      const dt = performance.now() - dragInfo.t;
      if (dt < 350 && Math.hypot(t.clientX - dragInfo.x, t.clientY - dragInfo.y) < 14 && dragInfo.t > 0) {
        dispatchEvent(new CustomEvent('odyssey-tap', { detail: { x: t.clientX, y: t.clientY } }));
      }
      dragInfo.t = 0;
    }
  }
}

function showJoy(x, y) {
  if (!joyBase) {
    joyBase = document.createElement('div');
    joyBase.className = 'joystick ui-el';
    joyBase.innerHTML = '<div class="joystick-ring"></div><div class="joystick-knob"></div>';
    document.getElementById('ui').appendChild(joyBase);
    joyKnob = joyBase.querySelector('.joystick-knob');
  }
  joyBase.style.left = `${x}px`;
  joyBase.style.top = `${y}px`;
  joyBase.style.display = 'block';
  requestAnimationFrame(() => joyBase.classList.add('active'));
}

function hideJoy() {
  if (!joyBase) return;
  joyBase.classList.remove('active');
  joyKnob.style.transform = 'translate(0px, 0px)';
  setTimeout(() => { if (!joyActive && joyBase) joyBase.style.display = 'none'; }, 220);
}

if (!('joy' in input)) input.joy = { x: 0, y: 0, active: false };

export function pollMove() {
  if (input.joy && input.joy.active) {
    return { x: clamp(input.joy.x * 1.35, -1, 1), y: clamp(input.joy.y * 1.35, -1, 1) };
  }
  return keyToMove();
}

export function consumeInteract() {
  if (input.interactPressed) { input.interactPressed = false; return true; }
  return false;
}
export function consumeMap() {
  if (input.mapPressed) { input.mapPressed = false; return true; }
  return false;
}
