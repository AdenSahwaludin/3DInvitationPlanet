import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { QUALITY } from '../core/quality.js';
import { PLANETS } from '../objects/planets.js';
import { state, emit } from '../core/state.js';
import { input } from '../core/input.js';

const $ui = () => document.getElementById('ui');

export const hud = {
  els: {},
  toastQueue: [],

  build(isTouch) {
    const ui = $ui();
    ui.innerHTML = `
      <div class="ui-block hud-top-left">
        <div class="glass-chip progress-chip">
          <span class="pc-icon">🪐</span>
          <span id="pc-count">0 / 8</span>
          <span class="pc-label">DISCOVERED</span>
          <div class="progress-bar"><i id="pc-fill"></i></div>
        </div>
        <div class="glass-chip secrets-chip hidden" id="secrets-chip">✨ Secrets: <b id="secrets-n">0</b></div>
      </div>

      <div class="ui-block hud-top-right">
        <button class="icon-btn ui-el" id="btn-music" title="Music">🔊</button>
        <button class="icon-btn ui-el" id="btn-map" title="Universe Map">🗺️</button>
        ${QUALITY.tier !== 'low' ? '<button class="icon-btn ui-el" id="btn-quality" title="Performance">⚡</button>' : ''}
      </div>

      <div class="ui-block hud-title" id="hud-names">${CONFIG.couple}</div>

      <div class="ui-block prompt hidden ui-el" id="interact-prompt"></div>

      <div class="ui-block touch-controls ${isTouch ? '' : 'hidden'}">
        <button class="round-btn boost-btn ui-el" id="btn-boost">⬆<small>BOOST</small></button>
        <button class="round-btn interact-btn ui-el hidden" id="btn-interact">✦<small>ORBIT</small></button>
      </div>

      <div id="toasts"></div>

      <div class="tutorial glass-panel hidden ui-el" id="tutorial">
        ${CONFIG.tutorialLines.map(l => `<p>${l}</p>`).join('')}
        <div class="tut-keys">${isTouch ? '<span>Joystick to move · drag to look</span>' : '<span><b>WASD / Arrows</b> move · <b>Shift</b> boost · <b>E</b> orbit · <b>drag</b> look · <b>scroll</b> zoom</span>'}</div>
      </div>

      <div class="story-card glass-panel hidden ui-el" id="story-card"></div>

      <div class="banner hidden" id="banner"></div>

      <div class="finale-overlay hidden ui-el" id="finale-overlay">
        <div class="finale-caption" id="finale-caption"></div>
        <button class="cta-btn hidden" id="finale-return">RETURN TO THE STARS ✨</button>
      </div>

      <div class="bigmap hidden ui-el" id="bigmap">
        <canvas id="bigmap-canvas"></canvas>
        <div class="bigmap-legend"><span>🚀 You</span><span style="color:#ffd88a">● Discovered</span><span style="color:#8f86c9">○ Undiscovered</span></div>
        <button class="icon-btn ui-el bigmap-close" id="bigmap-close">✕</button>
      </div>
    `;

    this.els.count = document.getElementById('pc-count');
    this.els.fill = document.getElementById('pc-fill');
    this.els.secretsChip = document.getElementById('secrets-chip');
    this.els.secretsN = document.getElementById('secrets-n');
    this.els.prompt = document.getElementById('interact-prompt');
    this.els.tutorial = document.getElementById('tutorial');
    this.els.storyCard = document.getElementById('story-card');
    this.els.bannerEl = document.getElementById('banner');
    this.els.btnMusic = document.getElementById('btn-music');

    document.getElementById('btn-music').addEventListener('click', () => {
      emit('toggleMusic');
    });
    document.getElementById('btn-map').addEventListener('click', () => emit('toggleMap'));
    const bq = document.getElementById('btn-quality');
    if (bq) bq.addEventListener('click', () => emit('manualDowngrade'));
    const bb = document.getElementById('btn-boost');
    bb.addEventListener('touchstart', e => { e.preventDefault(); input.boost = true; }, { passive: false });
    bb.addEventListener('touchend', () => { input.boost = false; });
    bb.addEventListener('mousedown', () => { input.boost = true; });
    bb.addEventListener('mouseup', () => { input.boost = false; });
    const bi = document.getElementById('btn-interact');
    bi.addEventListener('click', () => emit('wantInteract'));
    const bc = document.getElementById('bigmap-close');
    bc.addEventListener('click', () => emit('closeMap'));

    this.buildLabels();
  },

  buildLabels() {
    const holder = document.getElementById('labels');
    holder.innerHTML = '';
    this.labels = [];
    for (const p of PLANETS) {
      const el = document.createElement('div');
      el.className = 'planet-label';
      el.innerHTML = `<span class="pl-dot"></span><span class="pl-name">${p.name}</span><span class="pl-status">${p.discovered ? 'DISCOVERED' : 'UNDISCOVERED'}</span>`;
      el.addEventListener('click', () => emit('labelClick', p));
      holder.appendChild(el);
      this.labels.push({ el, planet: p });
    }
  },

  refreshLabelStates() {
    for (const l of this.labels || []) {
      const st = l.el.querySelector('.pl-status');
      st.textContent = l.planet.discovered ? 'DISCOVERED' : l.planet.locked && l.planet.id === 'forever' && l.planet.locked() ? 'LOCKED' : 'UNDISCOVERED';
      l.el.classList.toggle('discovered', l.planet.discovered);
    }
  },

  updateLabels(rig) {
    const out = { x: 0, y: 0, behind: false };
    const v = new THREE.Vector3();
    for (const l of this.labels || []) {
      const p = l.planet;
      v.copy(p.pos);
      v.y += p.radius + 7.5;
      rig.projectToScreen(v, out);
      const dist = rig.cam.position.distanceTo(p.pos);
      const vis = !out.behind && out.x > -80 && out.x < innerWidth + 80 && out.y > -40 && out.y < innerHeight + 60;
      l.el.style.opacity = vis ? Math.max(0.25, Math.min(1, 1.15 - dist / 420)) : 0;
      l.el.style.transform = `translate(-50%,-100%) translate(${out.x}px,${out.y}px)`;
      l.el.classList.toggle('near', p.glowCur > 0.45);
      l.el.style.pointerEvents = vis && p.glowCur > 0.4 ? 'auto' : 'none';
    }
  },

  updateProgress() {
    const content = PLANETS.filter(p => p.id !== 'forever');
    const n = content.filter(p => p.discovered).length;
    const total = content.length;
    this.els.count.textContent = `${n} / ${total}`;
    this.els.fill.style.width = `${(n / total) * 100}%`;
    this.refreshLabelStates();
  },

  updateSecrets() {
    this.els.secretsN.textContent = state.secrets.size;
    this.els.secretsChip.classList.remove('hidden');
  },

  setPrompt(planet, isTouch) {
    const el = this.els.prompt;
    const btn = document.getElementById('btn-interact');
    if (!planet) {
      el.classList.add('hidden');
      if (btn) btn.classList.add('hidden');
      return;
    }
    const locked = planet.id === 'forever' && planet.locked && planet.locked();
    if (locked) {
      el.innerHTML = `<span class="prompt-lock">🔒 Discover all planets to unlock the Finale (${state.discovered.size}/7)</span>`;
      el.classList.remove('hidden');
      if (btn) btn.classList.add('hidden');
      return;
    }
    if (isTouch) {
      el.classList.add('hidden');
      if (btn) btn.classList.remove('hidden');
    } else {
      el.innerHTML = `<kbd>E</kbd> ENTER ORBIT <em>${planet.name}</em>`;
      el.classList.remove('hidden');
      if (btn) btn.classList.add('hidden');
    }
  },

  showToast(msg, ms = 3200) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast glass-chip';
    t.innerHTML = msg;
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 500);
    }, ms);
  },

  showTutorial() {
    this.els.tutorial.classList.remove('hidden');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => this.hideTutorial(), 9000);
  },

  hideTutorial() {
    if (!this.els.tutorial) return;
    this.els.tutorial.classList.add('fade-out');
    setTimeout(() => this.els.tutorial.classList.add('hidden'), 700);
  },

  showStoryCard(entry) {
    const el = this.els.storyCard;
    if (!entry) {
      el.classList.add('hidden');
      return;
    }
    el.innerHTML = `<div class="sc-year">${entry.icon} ${entry.year}</div><div class="sc-title">${entry.title}</div><p>${entry.text}</p>`;
    el.classList.remove('hidden');
  },

  banner(text, sub = '', ms = 4200) {
    const b = this.els.bannerEl;
    b.innerHTML = `<div class="banner-main">${text}</div>${sub ? `<div class="banner-sub">${sub}</div>` : ''}`;
    b.classList.remove('hidden');
    clearTimeout(this._bt);
    this._bt = setTimeout(() => b.classList.add('hidden'), ms);
  },

  missionConfirmed(onDone) {
    const ov = document.createElement('div');
    ov.className = 'mission-confirm';
    ov.innerHTML = `<div class="mc-text">Mission Confirmed 💫</div>`;
    document.body.appendChild(ov);
    setTimeout(() => ov.classList.add('show'), 30);
    setTimeout(() => {
      ov.classList.remove('show');
      setTimeout(() => { ov.remove(); if (onDone) onDone(); }, 600);
    }, 2600);
  },

  lightbox(contentCanvasOrSrc, caption = '') {
    const lb = document.getElementById('lightbox');
    let src;
    if (typeof contentCanvasOrSrc === 'string') {
      src = contentCanvasOrSrc;
    } else {
      src = contentCanvasOrSrc.toDataURL ? contentCanvasOrSrc.toDataURL() : '';
    }
    lb.innerHTML = `<div class="lb-inner glass-panel"><div class="lb-zoom-wrap" id="lb-zoom-wrap"><img id="lb-img" src="${src}" alt="${caption}" draggable="false"/></div><div class="lb-caption">${caption}</div><div class="lb-toolbar"><button class="icon-btn lb-zoom-btn" id="lb-zoom-out" title="Zoom Out" aria-label="Zoom Out">−</button><button class="icon-btn lb-zoom-btn" id="lb-zoom-reset" title="Reset Zoom" aria-label="Reset">⟲</button><button class="icon-btn lb-zoom-btn" id="lb-zoom-in" title="Zoom In" aria-label="Zoom In">+</button></div><button class="icon-btn lb-close" aria-label="Close">✕</button></div>`;
    lb.classList.remove('hidden');
    const wrap = lb.querySelector('#lb-zoom-wrap');
    const img = lb.querySelector('#lb-img');
    const btnIn = lb.querySelector('#lb-zoom-in');
    const btnOut = lb.querySelector('#lb-zoom-out');
    const btnReset = lb.querySelector('#lb-zoom-reset');
    const btnClose = lb.querySelector('.lb-close');
    btnClose.onclick = () => lb.classList.add('hidden');
    lb.onclick = e => { if (e.target === lb) lb.classList.add('hidden'); };

    let scale = 1;
    let tx = 0;
    let ty = 0;
    const MIN = 1;
    const MAX = 3;
    const STEP = 0.4;

    const clampPan = () => {
      if (scale <= 1) { tx = 0; ty = 0; return; }
      // keep image within wrap bounds
      const wrapW = wrap.clientWidth;
      const wrapH = wrap.clientHeight;
      // img natural display size
      const imgW = img.clientWidth * scale;
      const imgH = img.clientHeight * scale;
      const maxX = Math.max(0, (imgW - wrapW) / 2);
      const maxY = Math.max(0, (imgH - wrapH) / 2);
      tx = Math.max(-maxX, Math.min(maxX, tx));
      ty = Math.max(-maxY, Math.min(maxY, ty));
    };

    const apply = () => {
      clampPan();
      img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      btnOut.disabled = scale <= MIN + 0.001;
      btnIn.disabled = scale >= MAX - 0.001;
      btnOut.style.opacity = btnOut.disabled ? '0.35' : '1';
      btnIn.style.opacity = btnIn.disabled ? '0.35' : '1';
      wrap.style.cursor = scale > 1 ? 'grab' : 'default';
    };

    const setScale = (next) => {
      scale = Math.max(MIN, Math.min(MAX, next));
      if (scale === 1) { tx = 0; ty = 0; }
      apply();
    };

    btnIn.onclick = (e) => { e.stopPropagation(); setScale(scale + STEP); };
    btnOut.onclick = (e) => { e.stopPropagation(); setScale(scale - STEP); };
    btnReset.onclick = (e) => { e.stopPropagation(); scale = 1; tx = 0; ty = 0; apply(); };

    // Prevent wheel / pinch / gesture zoom via hands – only toolbar allowed
    const prevent = (e) => e.preventDefault();
    wrap.addEventListener('wheel', prevent, { passive: false });
    lb.addEventListener('wheel', prevent, { passive: false });
    const onTouch = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    lb.addEventListener('touchstart', onTouch, { passive: false });
    lb.addEventListener('touchmove', onTouch, { passive: false });
    lb.addEventListener('gesturestart', prevent);
    lb.addEventListener('gesturechange', prevent);
    lb.addEventListener('gestureend', prevent);
    img.addEventListener('dragstart', prevent);
    // block double-tap zoom
    let lastTap = 0;
    lb.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTap < 350) e.preventDefault();
      lastTap = now;
    }, { passive: false });
    img.addEventListener('dblclick', prevent);

    // Drag to pan when zoomed (single finger / mouse) – not a zoom gesture
    let isDragging = false;
    let startX = 0, startY = 0, startTX = 0, startTY = 0;
    let activePointer = null;
    wrap.addEventListener('pointerdown', (e) => {
      if (scale <= 1) return;
      isDragging = true;
      activePointer = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTX = tx;
      startTY = ty;
      wrap.setPointerCapture(activePointer);
      img.style.transition = 'none';
      wrap.style.cursor = 'grabbing';
      e.preventDefault();
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      tx = startTX + dx;
      ty = startTY + dy;
      apply();
      img.style.transition = 'none';
    });
    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      img.style.transition = 'transform 0.2s ease';
      wrap.style.cursor = scale > 1 ? 'grab' : 'default';
      if (activePointer !== null) {
        try { wrap.releasePointerCapture(activePointer); } catch {}
        activePointer = null;
      }
    };
    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);
    wrap.addEventListener('pointerleave', endDrag);

    img.style.transformOrigin = 'center center';
    img.style.transition = 'transform 0.2s ease';
    img.style.touchAction = 'none';
    wrap.style.touchAction = 'none';
    apply();
  },

  setMutedIcon(muted) {
    this.els.btnMusic.textContent = muted ? '🔇' : '🔊';
  }
};
