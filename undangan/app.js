// Undangan klasik (versi scroll) — Aden & Mega
// Konten dari src/config.js · API & nama tamu dipakai ulang dari src/core
import { CONFIG, DATE_DOT } from '../src/config.js';
import { GUEST } from '../src/core/guest.js';
import { api } from '../src/core/api.js';
import { initFx } from './fx.js';
import { initFlora } from './flora.js';
import { MusicBox } from './audio.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// undangan selalu dimulai dari sampul/hero
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);
addEventListener('beforeunload', () => scrollTo(0, 0));
const fmtDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  .format(new Date(CONFIG.weddingDate));

/* ---------- Isi konten dari config ---------- */
$('cover-names').innerHTML = `${esc(CONFIG.groom)} <span>&amp;</span> ${esc(CONFIG.bride)}`;
$('cover-date').textContent = `· ${DATE_DOT} ·`;
$('cover-guest-name').textContent = GUEST || 'Bapak/Ibu/Saudara/i';

$('hero-greeting').textContent = CONFIG.greeting || '';
$('hero-names').innerHTML = `${esc(CONFIG.groom)} <span>&amp;</span> ${esc(CONFIG.bride)}`;
$('hero-date').textContent = fmtDate;
$('hero-tagline').textContent = CONFIG.tagline || '';
$('countdown-date').textContent = fmtDate;
document.title = `${CONFIG.couple} — Undangan Pernikahan`;

initFlora();

if (CONFIG.verse?.text) {
  $('verse-text').textContent = `“${CONFIG.verse.text}”`;
  $('verse-source').textContent = CONFIG.verse.source || '';
} else {
  $('ayat').remove();
}

$('groom-name').textContent = CONFIG.groom;
$('bride-name').textContent = CONFIG.bride;
$('groom-parents').textContent = CONFIG.groomParents || '';
$('bride-parents').textContent = CONFIG.brideParents || '';
if (!CONFIG.groomParents) $('groom-parents').remove();
if (!CONFIG.brideParents) $('bride-parents').remove();
$('couple-quote').textContent = `“${CONFIG.quote}”`;

/* Timeline cerita */
const timelineEl = $('timeline');
for (const s of CONFIG.story) {
  const item = document.createElement('div');
  item.className = 'tl-item';
  item.innerHTML = `
    <span class="tl-dot"></span>
    <span class="tl-icon">${esc(s.icon || '✦')}</span>
    <p class="tl-year">${esc(s.year)}</p>
    <h3 class="tl-title">${esc(s.title)}</h3>
    <p class="tl-text">${esc(s.text)}</p>`;
  timelineEl.appendChild(item);
}
const tlItems = [...timelineEl.querySelectorAll('.tl-item')];
let tlThresholds = [];
function measureTimeline() {
  const h = timelineEl.offsetHeight || 1;
  tlThresholds = tlItems.map(it => {
    const dot = it.querySelector('.tl-dot');
    return clamp01((it.offsetTop + dot.offsetTop + dot.offsetHeight / 2) / h);
  });
}
const clamp01 = v => Math.min(1, Math.max(0, v));
function lightDots(p) {
  tlItems.forEach((it, i) => it.classList.toggle('lit', p >= tlThresholds[i] - 0.005));
}
measureTimeline();

/* Jalur emas terisi + titik menyala mengikuti scroll */
const tlFill = $('timeline-fill');
function updateTimeline() {
  const r = timelineEl.getBoundingClientRect();
  const y = Math.min(Math.max(innerHeight * 0.55, r.top + 40), r.bottom - 40);
  const p = clamp01((y - r.top) / (r.height || 1));
  tlFill.style.transform = `scaleY(${p})`;
  lightDots(p);
}

/* Acara */
$('event-grid').innerHTML = CONFIG.events.map(e => `
  <div class="event-card reveal">
    <div class="event-icon">${esc(e.icon || '✦')}</div>
    <h3 class="event-name">${esc(e.name)}</h3>
    <div class="event-divider"></div>
    <p class="event-row"><b>${esc(e.date)}</b></p>
    <p class="event-row">${esc(e.time)}</p>
    <p class="event-row">${esc(e.place)}</p>
  </div>`).join('');

$('venue-name').textContent = CONFIG.venue.name;
$('venue-address').textContent = CONFIG.venue.address;
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.venue.mapsQuery || CONFIG.venue.name)}`;
$('maps-btn').href = mapsUrl;

/* Simpan ke kalender */
const dStart = new Date(CONFIG.weddingDate);
const dEnd = new Date(dStart.getTime() + 2 * 3600000);
const fmtUTC = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const calUrl = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
  action: 'TEMPLATE',
  text: `Pernikahan ${CONFIG.couple}`,
  dates: `${fmtUTC(dStart)}/${fmtUTC(dEnd)}`,
  details: CONFIG.tagline,
  location: CONFIG.venue.name
});
for (const id of ['calendar-btn', 'calendar-btn-2']) {
  const a = $(id);
  if (a) a.href = calUrl;
}

/* Hadiah */
$('gift-note').textContent = CONFIG.giftNote || '';
$('gift-address').textContent = CONFIG.giftAddress || '';
$('gift-grid').innerHTML = CONFIG.gifts.map(g => `
  <div class="gift-card reveal">
    <div class="gift-info">
      <b>${esc(g.bank)}</b>
      <span>${esc(g.number)}</span>
      <small>a.n. ${esc(g.holder)}</small>
    </div>
    <button class="btn btn-line copy-btn" data-number="${esc(g.number)}">Salin</button>
  </div>`).join('');

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const num = btn.dataset.number;
    try {
      await navigator.clipboard.writeText(num);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = num;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Nomor rekening disalin ✓');
  });
});

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (en.isIntersecting) {
      en.target.classList.add('in');
      io.unobserve(en.target);
    }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach(n => io.observe(n));

/* ---------- Sampul (pintu ganda) ---------- */
const music = new MusicBox();
const musicBtn = $('music-toggle');
function setMusic(on) {
  musicBtn.classList.toggle('on', on);
}
musicBtn.addEventListener('click', () => {
  if (music.playing) { music.stop(); setMusic(false); }
  else { music.start(); setMusic(true); }
});

const fx = initFx();

$('open-invite').addEventListener('click', () => {
  scrollTo(0, 0);
  const cover = $('cover');
  cover.classList.add('opening');
  fx.burst(26);
  music.start();
  setMusic(true);
  setTimeout(() => document.body.classList.remove('locked'), 1400);
  setTimeout(() => cover.classList.add('open'), 2150);
  setTimeout(() => cover.remove(), 2950);
});

/* ---------- Progress bar & timeline mengikuti scroll ---------- */
const progressBar = $('scroll-progress');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? clamp01(scrollY / max) : 0})`;
  updateTimeline();
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { measureTimeline(); onScroll(); }, { passive: true });
onScroll();

/* ---------- Countdown ---------- */
const cdEl = $('countdown');
function tickCountdown() {
  let ms = new Date(CONFIG.weddingDate) - Date.now();
  if (ms <= 0) {
    cdEl.innerHTML = '<p class="section-sub">Hari bahagia telah tiba! ✨</p>';
    clearInterval(cdTimer);
    return;
  }
  const dd = Math.floor(ms / 86400000);
  const hh = Math.floor(ms / 3600000) % 24;
  const mm = Math.floor(ms / 60000) % 60;
  const ss = Math.floor(ms / 1000) % 60;
  cdEl.innerHTML = [
    ['Hari', dd], ['Jam', hh], ['Menit', mm], ['Detik', ss]
  ].map(([l, v]) => `<div class="cd-box"><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
}
const cdTimer = setInterval(tickCountdown, 1000);
tickCountdown();

/* ---------- Galeri ---------- */
const galleryEl = $('gallery');
const LB = { root: $('lightbox'), img: $('lightbox-img'), cap: $('lightbox-caption') };
function openLightbox(src, caption) {
  LB.img.src = src;
  LB.cap.textContent = caption || '';
  LB.root.classList.remove('hidden');
}
$('lightbox-close').addEventListener('click', () => LB.root.classList.add('hidden'));
LB.root.addEventListener('click', e => { if (e.target === LB.root) LB.root.classList.add('hidden'); });

function galleryFigure(src, caption) {
  const fig = document.createElement('figure');
  fig.innerHTML = `<img loading="lazy" src="${esc(src)}" alt="${esc(caption)}" />
    <figcaption>${esc(caption)}</figcaption>`;
  fig.addEventListener('click', () => openLightbox(src, caption));
  return fig;
}
function renderGallery(list) {
  galleryEl.innerHTML = '';
  galleryEl.classList.toggle('few', list.length > 0 && list.length <= 3);
  if (!list.length) {
    galleryEl.innerHTML = ['A', 'M', '&', '★'].map(ch =>
      `<figure><div class="ph">${ch}</div></figure>`).join('');
    return;
  }
  for (const p of list.slice(0, 12)) galleryEl.appendChild(galleryFigure(p.src, p.caption));
}
let galleryPhotos = [];
if (CONFIG.couplePhoto) galleryPhotos.push({ src: CONFIG.couplePhoto, caption: 'Aden & Mega' });
if (Array.isArray(CONFIG.photos)) {
  CONFIG.photos.forEach((src, i) => galleryPhotos.push({ src, caption: `Momen ${i + 1}` }));
}
renderGallery(galleryPhotos);

/* Foto couple di bingkai emas; kalau tidak ada, pakai monogram */
const couplePhotoEl = $('couple-photo');
if (CONFIG.couplePhoto) {
  couplePhotoEl.style.backgroundImage = `url("${CONFIG.couplePhoto}")`;
} else {
  couplePhotoEl.textContent = `${CONFIG.groom.charAt(0)} & ${CONFIG.bride.charAt(0)}`;
}
/* Monogram mempelai */
function setMonogram(el, name) {
  el.textContent = name.trim().charAt(0).toUpperCase();
}
setMonogram($('groom-photo'), CONFIG.groom);
setMonogram($('bride-photo'), CONFIG.bride);

api.listPhotos().then(rows => {
  if (!Array.isArray(rows) || !rows.length) return;
  const fromDb = rows.map(r => ({
    src: `/assets/photos/${encodeURIComponent(r.filename)}`,
    caption: r.caption || r.filename
  }));
  renderGallery(fromDb.length ? fromDb : galleryPhotos);
}).catch(() => {});

/* ---------- RSVP ---------- */
const rsvpForm = $('rsvp-form');
try {
  const saved = JSON.parse(localStorage.getItem('wsy_rsvp'));
  if (saved?.name) {
    $('rsvp-name').value = saved.name;
    const radio = rsvpForm.querySelector(`input[name="attending"][value="${saved.attending ? 1 : 0}"]`);
    if (radio) radio.checked = true;
    $('rsvp-guests').value = String(saved.guests || 1);
    $('rsvp-ok').classList.remove('hidden');
  }
} catch (e) { void e; }

function syncGuestCount() {
  const off = rsvpForm.querySelector('input[name="attending"]:checked')?.value === '0';
  $('rsvp-guests').closest('.field').classList.toggle('hidden', off);
}
rsvpForm.querySelectorAll('input[name="attending"]').forEach(r => r.addEventListener('change', syncGuestCount));
syncGuestCount();

rsvpForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('rsvp-name').value.trim();
  if (!name) return;
  const attending = rsvpForm.querySelector('input[name="attending"]:checked')?.value === '1';
  const guests = attending ? parseInt($('rsvp-guests').value, 10) || 1 : 0;
  const btn = $('rsvp-submit');
  btn.disabled = true;
  btn.textContent = 'Mengirim...';
  await api.addRsvp(name, guests, attending).catch(() => {});
  localStorage.setItem('wsy_rsvp', JSON.stringify({ name, guests, attending }));
  btn.textContent = 'Tersimpan ✓';
  $('rsvp-ok').classList.remove('hidden');
  toast(attending ? 'Terima kasih atas konfirmasinya! 🌟' : 'Terima kasih, doa terbaik untuk Anda 🙏');
  setTimeout(() => { btn.disabled = false; btn.textContent = 'Kirim Konfirmasi'; }, 2200);
});

/* ---------- Ucapan ---------- */
const wishListEl = $('wish-list');
if (GUEST) $('wish-name').value = GUEST;
let wishes = [];
function wishCard(w) {
  const div = document.createElement('div');
  div.className = 'wish-card';
  div.innerHTML = `
    <div class="wish-head">
      <span class="wish-ava">${esc((w.name || '?').trim().charAt(0).toUpperCase())}</span>
      <span class="wish-name">${esc(w.name)}</span>
    </div>
    <p class="wish-msg">${esc(w.message)}</p>`;
  return div;
}
function renderWishes() {
  wishListEl.innerHTML = '';
  for (const w of wishes.slice(-30).reverse()) wishListEl.appendChild(wishCard(w));
}
function localWishes() {
  try { return JSON.parse(localStorage.getItem('wsy_wishes')) || []; } catch (e) { return []; }
}
const seed = (CONFIG.seedWishes || []).map(w => ({ name: w.name, message: w.message }));
api.listWishes().then(rows => {
  wishes = rows && rows.length
    ? [...rows.map(w => ({ name: w.name, message: w.message })), ...seed]
    : [...seed, ...localWishes()];
  renderWishes();
}).catch(() => {
  wishes = [...seed, ...localWishes()];
  renderWishes();
});

$('wish-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('wish-name').value.trim();
  const message = $('wish-message').value.trim();
  if (!name || !message) return;
  const btn = $('wish-submit');
  btn.disabled = true;
  btn.textContent = 'Mengirim...';
  await api.addWish(name, message).catch(() => {});
  const local = localWishes();
  local.push({ name, message });
  localStorage.setItem('wsy_wishes', JSON.stringify(local));
  wishes.push({ name, message });
  renderWishes();
  e.target.reset();
  if (GUEST) $('wish-name').value = GUEST;
  btn.disabled = false;
  btn.textContent = 'Kirim Ucapan';
  toast('Ucapan Anda sudah terkirim 💫');
});

/* ---------- Penutup ---------- */
$('closing-note').textContent = CONFIG.closingNote || '';
$('finale-names').textContent = `${CONFIG.groom} & ${CONFIG.bride}`;
$('finale-date').textContent = DATE_DOT;
$('finale-quote').textContent = `“${CONFIG.quote}”`;
$('finale-hashtag').textContent = CONFIG.hashtag || '';

/* ---------- Kunjungan ---------- */
fetch('/api/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: location.pathname,
    guest: GUEST,
    ref: document.referrer,
    screen: `${screen.width}x${screen.height}`,
    lang: navigator.language
  })
}).catch(() => {});

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
