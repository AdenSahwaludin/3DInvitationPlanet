import { CONFIG } from '../config.js';
import { state, emit } from '../core/state.js';
import { audio } from '../core/audio.js';
import { hud } from './hud.js';
import { PLANETS } from '../objects/planets.js';

let panelEl = null;
let currentPlanet = null;
let countdownTimer = null;
let onFireworks = null;

export function initPanels({ fireworksFn }) {
  onFireworks = fireworksFn;
  panelEl = document.createElement('div');
  panelEl.id = 'planet-panel';
  panelEl.className = 'ui-el hidden';
  document.getElementById('ui').appendChild(panelEl);

  addEventListener('odyssey-esc', () => {
    if (currentPlanet) closePanel();
    const lb = document.getElementById('lightbox');
    if (lb && !lb.classList.contains('hidden')) lb.classList.add('hidden');
  });
}

export function isOpen() { return !!currentPlanet; }

export function openPanel(planet) {
  if (window.__tracePanels) console.log(`[TRACE] openPanel ${planet.id} mode=${state.mode}`);
  currentPlanet = planet;
  panelEl.innerHTML = template(planet);
  panelEl.classList.remove('hidden');
  requestAnimationFrame(() => panelEl.classList.add('open'));
  wire(planet);
}

export function closePanel() {
  if (!currentPlanet) return;
  if (window.__tracePanels) console.log(`[TRACE] closePanel ${currentPlanet.id} mode=${state.mode}`);
  currentPlanet = null;
  clearInterval(countdownTimer);
  countdownTimer = null;
  panelEl.classList.remove('open');
  setTimeout(() => panelEl.classList.add('hidden'), 420);
  emit('panelClosed');
}

function template(p) {
  const head = `
    <div class="pp-head">
      <div class="pp-icon">${p.def.icon}</div>
      <div>
        <h2>${p.name}</h2>
        <span class="pp-sub">${p.sub}</span>
      </div>
      <button class="icon-btn pp-close" id="pp-close">✕</button>
    </div>`;

  const bodies = {
    love: loveTpl,
    story: storyTpl,
    wedding: weddingTpl,
    destination: destinationTpl,
    rsvp: rsvpTpl,
    gift: giftTpl,
    memory: memoryTpl,
    wishes: wishesTpl,
    forever: foreverTpl
  };
  return head + `<div class="pp-body">${bodies[p.id]()}</div>`;
}

function wishesTpl() {
  const wp = PLANETS.find(x => x.id === 'wishes');
  return `
    <p class="pp-intro">Every message becomes a glowing card orbiting this planet.</p>
    <form class="wish-form" id="wish-form">
      <input type="text" id="wish-name" required maxlength="40" placeholder="Your name"/>
      <textarea id="wish-msg" rows="3" maxlength="180" placeholder="Write your wishes for the stars... ✨" required></textarea>
      <button type="submit" class="cta-btn ui-el">SEND TO THE UNIVERSE 🌠</button>
    </form>
    <div class="wishes-list">
      ${wp.wishCards.slice().reverse().map(w => `
        <div class="wish-item glass-panel">
          <b>${escapeHtml(w.name)}</b>
          <p>${escapeHtml(w.message)}</p>
        </div>`).join('')}
    </div>`;
}

function loveTpl() {
  const d = new Date(CONFIG.weddingDate);
  const photo = CONFIG.couplePhoto
    ? `<img class="couple-photo" src="${CONFIG.couplePhoto}" alt="couple"/>`
    : `<div class="couple-monogram">A<span>♥</span>C</div>`;
  return `
    <div class="center-col">
      ${photo}
      <h1 class="names">${CONFIG.groom} <em>&</em> ${CONFIG.bride}</h1>
      <p class="quote">“${CONFIG.quote}”</p>
      <div class="date-chip">✦ ${d.getDate()} ${d.toLocaleString('en', { month: 'long' })} ${d.getFullYear()} ✦</div>
      <div class="countdown" id="countdown"></div>
      <p class="mini-note">You arrived at the heart of our universe.</p>
    </div>`;
}

function storyTpl() {
  return `
    <p class="pp-intro">Fly around this planet to find glowing story orbs — or read the journey below.</p>
    <div class="timeline">
      ${CONFIG.story.map(s => `
        <div class="tl-item">
          <div class="tl-year">${s.icon} ${s.year}</div>
          <div class="tl-card glass-panel"><h3>${s.title}</h3><p>${s.text}</p></div>
        </div>`).join('')}
    </div>`;
}

function weddingTpl() {
  return `
    <div class="event-cards">
      ${CONFIG.events.map(e => `
        <div class="event-card glass-panel">
          <div class="ev-icon">${e.icon}</div>
          <h3>${e.name}</h3>
          <div class="ev-row"><span>📅</span><b>${e.date}</b></div>
          <div class="ev-row"><span>⏰</span><b>${e.time}</b></div>
          <div class="ev-row"><span>🏛️</span><b>${e.place}</b></div>
        </div>`).join('')}
    </div>
    <p class="mini-note center">Dress code : Elegance under the stars 🌌</p>`;
}

function destinationTpl() {
  const q = encodeURIComponent(CONFIG.venue.mapsQuery);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
  return `
    <div class="center-col">
      <div class="venue-pin">📍</div>
      <h3 class="venue-name">${CONFIG.venue.name}</h3>
      <p class="venue-addr">${CONFIG.venue.address}</p>
      <a class="cta-btn ui-el" href="${mapsUrl}" target="_blank" rel="noopener">🧭 OPEN GOOGLE MAPS</a>
      <p class="mini-note">Coordinates locked. Your rocket has done the hard part.</p>
    </div>`;
}

function rsvpTpl() {
  const saved = loadRSVP();
  if (saved) {
    return `
      <div class="center-col">
        <div class="rsvp-done">
          <div class="big-check">✓</div>
          <h3>Thank you, ${escapeHtml(saved.name)}!</h3>
          <p>${saved.attending ? `We can't wait to celebrate with you (${saved.guests} seat${saved.guests > 1 ? 's' : ''} reserved).` : 'We will miss you — thank you for the kind thoughts.'}</p>
        </div>
        <button class="ghost-btn ui-el" id="rsvp-edit">Edit response</button>
      </div>`;
  }
  return `
    <form class="rsvp-form" id="rsvp-form">
      <label>Your Name
        <input type="text" id="rsvp-name" required maxlength="60" placeholder="Full name"/>
      </label>
      <label>Number of Guests
        <select id="rsvp-guests">${[1,2,3,4,5,6].map(n => `<option value="${n}" ${n===2?'selected':''}>${n} ${n === 1 ? 'guest' : 'guests'}</option>`).join('')}</select>
      </label>
      <label>Will you attend?
        <div class="attend-pills">
          <label class="pill ui-el"><input type="radio" name="att" value="yes" checked/><span>✓ Akan Hadir</span></label>
          <label class="pill ui-el"><input type="radio" name="att" value="no"/><span>✕ Tidak Dapat Hadir</span></label>
        </div>
      </label>
      <button type="submit" class="cta-btn ui-el">TRANSMIT CONFIRMATION 💫</button>
    </form>`;
}

function giftTpl() {
  return `
    <p class="pp-intro">${CONFIG.giftNote}</p>
    <div class="gift-cards">
      ${CONFIG.gifts.map((g, i) => `
        <div class="gift-card glass-panel">
          <div class="gc-bank">${g.bank}</div>
          <div class="gc-number" id="gc-${i}">${g.number}</div>
          <div class="gc-holder">a.n. ${g.holder}</div>
          <button class="copy-btn ui-el" data-num="${g.number}" data-i="${i}">📋 COPY ACCOUNT NUMBER</button>
        </div>`).join('')}
    </div>
    <p class="mini-note">${CONFIG.giftAddress}</p>`;
}

function memoryTpl() {
  return `
    <p class="pp-intro">Moments frozen in stardust. Fly close to the floating frames — or tap one here.</p>
    <div class="memory-grid">
      ${PLANETS.find(x => x.id === 'memory').photoFrames.map((f, i) => {
        const src = f.src || f.obj.material.map.image.toDataURL();
        return `<figure class="mem-thumb ui-el" data-i="${i}"><img src="${src}" alt="${f.caption}"/><figcaption>${f.caption}</figcaption></figure>`;
      }).join('')}
    </div>`;
}

function foreverTpl() {
  return `
    <div class="center-col finale-content">
      <div class="finale-ring">💍</div>
      <h2 class="finale-quote">“Our journey has just begun.”</h2>
      <p>Thank you for being part of our universe.</p>
      <div class="finale-meta">
        <span class="fm-initials">A ♥ C</span>
        <span class="fm-date">12 · 12 · 2026</span>
        <span class="fm-tag">${CONFIG.hashtag}</span>
      </div>
      <p class="mini-note">Universe complete. All planets discovered. ✨</p>
    </div>`;
}

function wire(p) {
  document.getElementById('pp-close').addEventListener('click', () => { audio.click(); closePanel(); });

  if (p.id === 'love') startCountdown();

  if (p.id === 'destination') {
  }

  if (p.id === 'rsvp') {
    const form = document.getElementById('rsvp-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('rsvp-name').value.trim();
        if (!name) { hud.showToast('Please enter your name, traveller 🙏'); return; }
        const guests = parseInt(document.getElementById('rsvp-guests').value, 10);
        const attending = document.querySelector('input[name="att"]:checked').value === 'yes';
        saveRSVP({ name, guests, attending, ts: Date.now() });
        audio.success();
        if (onFireworks) onFireworks();
        hud.missionConfirmed();
        closePanel();
      });
    } else {
      const edit = document.getElementById('rsvp-edit');
      if (edit) edit.addEventListener('click', () => { localStorage.removeItem('wsy_rsvp'); openPanel(p); });
    }
  }

  if (p.id === 'gift') {
    panelEl.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const num = btn.dataset.num;
        let ok = false;
        try { await navigator.clipboard.writeText(num); ok = true; } catch (e) {
          try {
            const ta = document.createElement('textarea');
            ta.value = num;
            document.body.appendChild(ta);
            ta.select();
            ok = document.execCommand('copy');
            ta.remove();
          } catch (e2) { ok = false; }
        }
        if (ok) {
          btn.textContent = '✓ COPIED!';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = '📋 COPY ACCOUNT NUMBER'; btn.classList.remove('copied'); }, 2200);
          hud.showToast('Gift mission received ✨');
          audio.secret();
        } else {
          hud.showToast(`Account number: <b>${num}</b>`);
        }
      });
    });
  }

  if (p.id === 'wishes') {
    const form = document.getElementById('wish-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('wish-name').value.trim();
      const message = document.getElementById('wish-msg').value.trim();
      if (!name || !message) return;
      const wp = PLANETS.find(x => x.id === 'wishes');
      wp.addWish(name, message);
      saveWish(name, message);
      audio.success();
      hud.showToast('Your wish now orbits the universe ✨');
      openPanel(p);
    });
  }

  if (p.id === 'memory') {
    const memP = PLANETS.find(x => x.id === 'memory');
    panelEl.querySelectorAll('.mem-thumb').forEach(fig => {
      fig.addEventListener('click', () => {
        const f = memP.photoFrames[parseInt(fig.dataset.i, 10)];
        hud.lightbox(f.src || f.obj.material.map.image, f.caption);
        audio.click();
      });
    });
  }
}

function startCountdown() {
  const el = () => document.getElementById('countdown');
  const tick = () => {
    const box = el();
    if (!box) { clearInterval(countdownTimer); return; }
    let ms = new Date(CONFIG.weddingDate) - Date.now();
    if (ms < 0) ms = 0;
    const dd = Math.floor(ms / 86400000);
    const hh = Math.floor(ms / 3600000) % 24;
    const mm = Math.floor(ms / 60000) % 60;
    const ss = Math.floor(ms / 1000) % 60;
    box.innerHTML = [
      ['DAYS', dd], ['HOURS', hh], ['MIN', mm], ['SEC', ss]
    ].map(([l, v]) => `<div class="cd-box"><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
  };
  tick();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(tick, 1000);
}

function loadRSVP() {
  try { return JSON.parse(localStorage.getItem('wsy_rsvp')); } catch (e) { return null; }
}
function saveRSVP(data) {
  localStorage.setItem('wsy_rsvp', JSON.stringify(data));
}

export function loadCustomWishes() {
  try { return JSON.parse(localStorage.getItem('wsy_wishes')) || []; } catch (e) { return []; }
}
export function saveWish(name, message) {
  const list = loadCustomWishes();
  list.push({ name, message });
  localStorage.setItem('wsy_wishes', JSON.stringify(list));
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

void state;
