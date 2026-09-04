// Aset flora dekoratif (SVG pink watercolor) untuk undangan klasik.
// Diletakkan di sisi kiri/kanan layar per-section; animasi masuk saat section
// terlihat dan keluar saat hilang, plus sway 3D + parallax scroll & mouse.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const DEFS = `
<svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <linearGradient id="gPk1" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#c9557c"/><stop offset="1" stop-color="#ee8fb2"/></linearGradient>
    <linearGradient id="gPk2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#d9718f"/><stop offset="1" stop-color="#f4b7ca"/></linearGradient>
    <linearGradient id="gPk3" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ec9db8"/><stop offset="1" stop-color="#fbdce7"/></linearGradient>
    <linearGradient id="gPk4" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f3b3c8"/><stop offset="1" stop-color="#fdeef3"/></linearGradient>

    <path id="fl-leaf" d="M0 0 C14 -22 44 -28 64 -14 C48 6 16 10 0 0 Z"/>
    <path id="fl-vein" d="M6 -2 C24 -8 42 -12 56 -13" fill="none" stroke="#fdeef3" stroke-width="1.3" stroke-linecap="round"/>
    <path id="fl-round" d="M0 0 C10 -14 30 -16 38 -6 C28 6 10 8 0 0 Z"/>
    <path id="fl-vein2" d="M4 -1 C14 -4 24 -5 32 -5" fill="none" stroke="#fdeef3" stroke-width="1" stroke-linecap="round"/>
    <path id="fl-sliver" d="M0 0 C10 -16 24 -20 34 -14 C24 -4 10 2 0 0 Z"/>
    <path id="fl-petal" d="M0 0 C-11 -14 -9 -34 0 -42 C9 -34 11 -14 0 0 Z"/>

    <symbol id="sym-branch" viewBox="0 0 220 220">
      <path d="M18 206 C55 160 95 105 158 22" fill="none" stroke="#b98f45" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(38 182) rotate(-34)"><use href="#fl-leaf" fill="url(#gPk1)"/><use href="#fl-vein"/></g>
      <g transform="translate(56 156) scale(-1 1) rotate(-30)"><use href="#fl-leaf" fill="url(#gPk2)"/><use href="#fl-vein"/></g>
      <g transform="translate(78 126) rotate(-28) scale(0.95)"><use href="#fl-leaf" fill="url(#gPk2)"/><use href="#fl-vein"/></g>
      <g transform="translate(96 100) scale(-1 1) rotate(-24) scale(0.92)"><use href="#fl-leaf" fill="url(#gPk3)"/><use href="#fl-vein"/></g>
      <g transform="translate(116 74) rotate(-22) scale(0.9)"><use href="#fl-leaf" fill="url(#gPk1)"/><use href="#fl-vein"/></g>
      <g transform="translate(132 52) scale(-1 1) rotate(-20) scale(0.85)"><use href="#fl-leaf" fill="url(#gPk3)"/><use href="#fl-vein"/></g>
      <g transform="translate(148 34) rotate(-18) scale(0.8)"><use href="#fl-leaf" fill="url(#gPk2)"/><use href="#fl-vein"/></g>
      <g transform="translate(160 20) scale(-1 1) rotate(-16) scale(0.7)"><use href="#fl-leaf" fill="url(#gPk2)"/><use href="#fl-vein"/></g>
    </symbol>

    <symbol id="sym-euka" viewBox="0 0 120 220">
      <path d="M60 214 C57 160 63 100 54 14" fill="none" stroke="#b98f45" stroke-width="2.6" stroke-linecap="round"/>
      <g transform="translate(62 192) rotate(-10)"><use href="#fl-round" fill="url(#gPk3)"/><use href="#fl-vein2"/></g>
      <g transform="translate(58 168) scale(-1 1) rotate(-8) scale(0.92)"><use href="#fl-round" fill="url(#gPk2)"/><use href="#fl-vein2"/></g>
      <g transform="translate(63 144) rotate(-7) scale(0.88)"><use href="#fl-round" fill="url(#gPk4)"/><use href="#fl-vein2"/></g>
      <g transform="translate(57 120) scale(-1 1) rotate(-6) scale(0.84)"><use href="#fl-round" fill="url(#gPk3)"/><use href="#fl-vein2"/></g>
      <g transform="translate(62 96) rotate(-5) scale(0.8)"><use href="#fl-round" fill="url(#gPk2)"/><use href="#fl-vein2"/></g>
      <g transform="translate(57 74) scale(-1 1) rotate(-5) scale(0.74)"><use href="#fl-round" fill="url(#gPk4)"/><use href="#fl-vein2"/></g>
      <g transform="translate(60 52) rotate(-4) scale(0.68)"><use href="#fl-round" fill="url(#gPk3)"/><use href="#fl-vein2"/></g>
      <g transform="translate(57 32) scale(-1 1) rotate(-4) scale(0.6)"><use href="#fl-round" fill="url(#gPk2)"/><use href="#fl-vein2"/></g>
      <circle cx="54" cy="14" r="3.4" fill="url(#gPk4)"/>
    </symbol>

    <symbol id="sym-fern" viewBox="0 0 210 130">
      <path d="M12 120 C70 98 130 66 198 20" fill="none" stroke="#b98f45" stroke-width="2.4" stroke-linecap="round"/>
      <g transform="translate(34 110) rotate(-40) scale(0.72)"><use href="#fl-sliver" fill="url(#gPk3)"/></g>
      <g transform="translate(30 114) scale(-1 1) rotate(-36) scale(0.68)"><use href="#fl-sliver" fill="url(#gPk4)"/></g>
      <g transform="translate(58 99) rotate(-38) scale(0.66)"><use href="#fl-sliver" fill="url(#gPk2)"/></g>
      <g transform="translate(54 103) scale(-1 1) rotate(-34) scale(0.62)"><use href="#fl-sliver" fill="url(#gPk3)"/></g>
      <g transform="translate(82 87) rotate(-36) scale(0.6)"><use href="#fl-sliver" fill="url(#gPk4)"/></g>
      <g transform="translate(78 91) scale(-1 1) rotate(-32) scale(0.56)"><use href="#fl-sliver" fill="url(#gPk2)"/></g>
      <g transform="translate(106 74) rotate(-34) scale(0.54)"><use href="#fl-sliver" fill="url(#gPk3)"/></g>
      <g transform="translate(102 78) scale(-1 1) rotate(-30) scale(0.5)"><use href="#fl-sliver" fill="url(#gPk4)"/></g>
      <g transform="translate(130 60) rotate(-32) scale(0.48)"><use href="#fl-sliver" fill="url(#gPk2)"/></g>
      <g transform="translate(126 64) scale(-1 1) rotate(-28) scale(0.44)"><use href="#fl-sliver" fill="url(#gPk3)"/></g>
      <g transform="translate(152 48) rotate(-30) scale(0.42)"><use href="#fl-sliver" fill="url(#gPk4)"/></g>
      <g transform="translate(148 52) scale(-1 1) rotate(-26) scale(0.4)"><use href="#fl-sliver" fill="url(#gPk2)"/></g>
      <g transform="translate(172 36) rotate(-28) scale(0.36)"><use href="#fl-sliver" fill="url(#gPk3)"/></g>
    </symbol>

    <g id="fl-flo">
      <use href="#fl-petal" fill="url(#gPk4)"/>
      <use href="#fl-petal" transform="rotate(72)" fill="url(#gPk3)"/>
      <use href="#fl-petal" transform="rotate(144)" fill="url(#gPk4)"/>
      <use href="#fl-petal" transform="rotate(216)" fill="url(#gPk3)"/>
      <use href="#fl-petal" transform="rotate(288)" fill="url(#gPk4)"/>
      <circle r="5.5" fill="#e9c46a"/>
    </g>

    <symbol id="sym-bloom" viewBox="0 0 200 200">
      <path d="M28 192 C66 152 108 112 170 38" fill="none" stroke="#b98f45" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M96 128 C104 120 116 118 124 122" fill="none" stroke="#b98f45" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="127" cy="121" r="4.4" fill="url(#gPk2)"/>
      <g transform="translate(52 166) rotate(-140) scale(0.7)"><use href="#fl-leaf" fill="url(#gPk2)"/><use href="#fl-vein"/></g>
      <g transform="translate(118 96) scale(-1 1) rotate(-136) scale(0.6)"><use href="#fl-leaf" fill="url(#gPk3)"/><use href="#fl-vein"/></g>
      <use href="#fl-flo" transform="translate(74 138) scale(0.85)"/>
      <use href="#fl-flo" transform="translate(112 96) scale(0.72) rotate(30)"/>
      <use href="#fl-flo" transform="translate(152 52) scale(0.6) rotate(-24)"/>
    </symbol>

    <symbol id="sym-flower" viewBox="0 0 170 170">
      <path d="M85 164 C84 138 84 116 85 90" fill="none" stroke="#b98f45" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(84 142) scale(-1 1) rotate(-150) scale(0.8)"><use href="#fl-leaf" fill="url(#gPk2)"/><use href="#fl-vein"/></g>
      <g transform="translate(86 122) rotate(-26) scale(0.8)"><use href="#fl-leaf" fill="url(#gPk3)"/><use href="#fl-vein"/></g>
      <g transform="translate(85 64)">
        <use href="#fl-petal" transform="scale(1.4)" fill="url(#gPk1)"/>
        <use href="#fl-petal" transform="rotate(45) scale(1.4)" fill="url(#gPk2)"/>
        <use href="#fl-petal" transform="rotate(90) scale(1.4)" fill="url(#gPk1)"/>
        <use href="#fl-petal" transform="rotate(135) scale(1.4)" fill="url(#gPk2)"/>
        <use href="#fl-petal" transform="rotate(180) scale(1.4)" fill="url(#gPk1)"/>
        <use href="#fl-petal" transform="rotate(225) scale(1.4)" fill="url(#gPk2)"/>
        <use href="#fl-petal" transform="rotate(270) scale(1.4)" fill="url(#gPk1)"/>
        <use href="#fl-petal" transform="rotate(315) scale(1.4)" fill="url(#gPk2)"/>
        <use href="#fl-petal" transform="rotate(22) scale(0.85)" fill="url(#gPk4)"/>
        <use href="#fl-petal" transform="rotate(82) scale(0.85)" fill="url(#gPk3)"/>
        <use href="#fl-petal" transform="rotate(142) scale(0.85)" fill="url(#gPk4)"/>
        <use href="#fl-petal" transform="rotate(202) scale(0.85)" fill="url(#gPk3)"/>
        <use href="#fl-petal" transform="rotate(262) scale(0.85)" fill="url(#gPk4)"/>
        <use href="#fl-petal" transform="rotate(322) scale(0.85)" fill="url(#gPk3)"/>
        <circle r="11" fill="#f4d78a"/>
        <circle r="11" fill="none" stroke="#c9a254" stroke-width="1.4"/>
        <circle cx="0" cy="-6" r="1.7" fill="#c9a254"/><circle cx="5.5" cy="2.5" r="1.7" fill="#c9a254"/>
        <circle cx="-5.5" cy="2.5" r="1.7" fill="#c9a254"/><circle cx="0" cy="0" r="1.7" fill="#c9a254"/>
      </g>
    </symbol>

    <symbol id="sym-vine" viewBox="0 0 120 240">
      <path d="M62 234 C22 192 100 152 56 106 C22 70 96 40 60 6" fill="none" stroke="#b98f45" stroke-width="2.4" stroke-linecap="round"/>
      <g transform="translate(44 206) rotate(-14) scale(0.55)"><use href="#fl-round" fill="url(#gPk2)"/><use href="#fl-vein2"/></g>
      <g transform="translate(80 184) scale(-1 1) rotate(-12) scale(0.52)"><use href="#fl-round" fill="url(#gPk3)"/><use href="#fl-vein2"/></g>
      <g transform="translate(40 160) rotate(-10) scale(0.52)"><use href="#fl-round" fill="url(#gPk4)"/><use href="#fl-vein2"/></g>
      <g transform="translate(76 134) scale(-1 1) rotate(-10) scale(0.5)"><use href="#fl-round" fill="url(#gPk2)"/><use href="#fl-vein2"/></g>
      <g transform="translate(38 110) rotate(-8) scale(0.5)"><use href="#fl-round" fill="url(#gPk3)"/><use href="#fl-vein2"/></g>
      <g transform="translate(72 86) scale(-1 1) rotate(-8) scale(0.46)"><use href="#fl-round" fill="url(#gPk4)"/><use href="#fl-vein2"/></g>
      <g transform="translate(46 62) rotate(-6) scale(0.46)"><use href="#fl-round" fill="url(#gPk2)"/><use href="#fl-vein2"/></g>
      <g transform="translate(68 38) scale(-1 1) rotate(-6) scale(0.42)"><use href="#fl-round" fill="url(#gPk3)"/><use href="#fl-vein2"/></g>
      <g transform="translate(58 12) rotate(-4) scale(0.4)"><use href="#fl-round" fill="url(#gPk4)"/><use href="#fl-vein2"/></g>
    </symbol>

    <symbol id="sym-sprig" viewBox="0 0 100 100">
      <path d="M14 88 C36 66 56 44 84 18" fill="none" stroke="#b98f45" stroke-width="2.4" stroke-linecap="round"/>
      <g transform="translate(34 66) rotate(-38) scale(0.62)"><use href="#fl-leaf" fill="url(#gPk1)"/><use href="#fl-vein"/></g>
      <g transform="translate(52 46) scale(-1 1) rotate(-34) scale(0.55)"><use href="#fl-leaf" fill="url(#gPk3)"/><use href="#fl-vein"/></g>
      <g transform="translate(72 26) rotate(-28) scale(0.44)"><use href="#fl-leaf" fill="url(#gPk2)"/><use href="#fl-vein"/></g>
    </symbol>

    <symbol id="sym-butterfly" viewBox="0 0 120 100">
      <path d="M58 50 C36 16 6 16 10 38 C13 55 36 62 56 58 Z" fill="url(#gPk2)"/>
      <path d="M57 58 C36 66 22 82 34 88 C46 92 55 76 58 62 Z" fill="url(#gPk3)"/>
      <path d="M62 50 C84 16 114 16 110 38 C107 55 84 62 64 58 Z" fill="url(#gPk2)"/>
      <path d="M63 58 C84 66 98 82 86 88 C74 92 65 76 62 62 Z" fill="url(#gPk3)"/>
      <circle cx="40" cy="38" r="3.2" fill="#fdeef3"/><circle cx="80" cy="38" r="3.2" fill="#fdeef3"/>
      <circle cx="47" cy="52" r="2.2" fill="#fdeef3"/><circle cx="73" cy="52" r="2.2" fill="#fdeef3"/>
      <ellipse cx="60" cy="57" rx="3.2" ry="13" fill="#a8813c"/>
      <path d="M58 45 C54 38 50 34 46 32 M62 45 C66 38 70 34 74 32" stroke="#a8813c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    </symbol>
  </defs>
</svg>`;

const VB = {
  branch: '0 0 220 220', euka: '0 0 120 220', fern: '0 0 210 130',
  bloom: '0 0 200 200', flower: '0 0 170 170', vine: '0 0 120 240',
  sprig: '0 0 100 100', butterfly: '0 0 120 100'
};

// [sectionId, sisi, top%, depth, item: {s: simbol, w: lebar px, m: mirror, o: opasitas}]
const LAYOUT = [
  ['hero', 'l', '6%', 0.07, [{ s: 'branch', w: 215 }, { s: 'euka', w: 140, o: 0.85 }]],
  ['hero', 'r', '12%', 0.07, [{ s: 'branch', w: 215, m: true }, { s: 'fern', w: 190, o: 0.85 }]],
  ['ayat', 'l', '18%', 0.05, [{ s: 'euka', w: 150 }]],
  ['ayat', 'r', '24%', 0.05, [{ s: 'euka', w: 150, m: true }]],
  ['hitung-mundur', 'r', '30%', 0.06, [{ s: 'bloom', w: 170 }]],
  ['hitung-mundur', 'l', '44%', 0.05, [{ s: 'sprig', w: 120 }]],
  ['mempelai', 'l', '10%', 0.06, [{ s: 'bloom', w: 180 }, { s: 'euka', w: 120, o: 0.8 }]],
  ['mempelai', 'r', '46%', 0.06, [{ s: 'flower', w: 155 }]],
  ['cerita', 'l', '8%', 0.07, [{ s: 'fern', w: 200 }, { s: 'euka', w: 120, o: 0.8 }]],
  ['cerita', 'r', '52%', 0.07, [{ s: 'branch', w: 190, m: true }]],
  ['acara', 'l', '16%', 0.06, [{ s: 'branch', w: 195 }]],
  ['acara', 'r', '40%', 0.06, [{ s: 'bloom', w: 165, m: true }]],
  ['galeri', 'l', '20%', 0.05, [{ s: 'euka', w: 150 }]],
  ['galeri', 'r', '12%', 0.05, [{ s: 'fern', w: 185, m: true }]],
  ['hadiah', 'l', '30%', 0.05, [{ s: 'flower', w: 150 }]],
  ['hadiah', 'r', '14%', 0.05, [{ s: 'euka', w: 145, m: true }]],
  ['rsvp', 'l', '10%', 0.06, [{ s: 'bloom', w: 170 }, { s: 'sprig', w: 110 }]],
  ['rsvp', 'r', '44%', 0.06, [{ s: 'fern', w: 175, m: true }]],
  ['ucapan', 'l', '18%', 0.05, [{ s: 'euka', w: 150 }]],
  ['ucapan', 'r', '34%', 0.05, [{ s: 'flower', w: 150, m: true }]],
  ['penutup', 'l', '10%', 0.07, [{ s: 'branch', w: 205 }, { s: 'euka', w: 125, o: 0.8 }]],
  ['penutup', 'r', '38%', 0.07, [{ s: 'branch', w: 205, m: true }, { s: 'bloom', w: 150, m: true, o: 0.85 }]]
];

// [sectionId, left%, top%, durasi flutter, delay]
const BUTTERFLIES = [
  ['hero', '9%', '34%', '13s', '0s'],
  ['hero', '72%', '58%', '16s', '-6s'],
  ['cerita', '80%', '36%', '15s', '-3s'],
  ['penutup', '12%', '26%', '14s', '-8s']
];

export function initFlora() {
  if (REDUCED) return;
  document.body.insertAdjacentHTML('beforeend', DEFS);

  const touched = new Set();
  for (const [secId, side, top, depth, items] of LAYOUT) {
    const sec = document.getElementById(secId);
    if (!sec) continue;
    touched.add(sec);
    const decor = document.createElement('div');
    decor.className = `decor side-${side}`;
    decor.dataset.depth = depth;
    decor.style.top = top;
    const scale = document.createElement('div');
    scale.className = 'fl-scale';
    items.forEach((it, i) => {
      const sway = document.createElement('div');
      sway.className = 'sway' + (i % 2 ? ' b' : '');
      sway.style.setProperty('--swd', (6.5 + Math.random() * 3).toFixed(2) + 's');
      sway.style.setProperty('--swdel', (-Math.random() * 7).toFixed(2) + 's');
      sway.innerHTML = `<span class="${it.m ? 'mir' : ''}">` +
        `<svg class="bot" style="--w:${it.w}px;--d:${(i * 0.15).toFixed(2)}s;--op:${it.o ?? 0.95}" viewBox="${VB[it.s]}">` +
        `<use href="#sym-${it.s}"/></svg></span>`;
      scale.appendChild(sway);
    });
    decor.appendChild(scale);
    sec.appendChild(decor);
  }

  for (const [secId, left, top, dur, del] of BUTTERFLIES) {
    const sec = document.getElementById(secId);
    if (!sec) continue;
    touched.add(sec);
    const b = document.createElement('div');
    b.className = 'fl-butterfly';
    b.style.left = left;
    b.style.top = top;
    b.style.setProperty('--fd', dur);
    b.style.setProperty('--fdel', del);
    b.innerHTML = `<svg viewBox="${VB.butterfly}" style="display:block;width:100%"><use href="#sym-butterfly"/></svg>`;
    sec.appendChild(b);
  }

  // animasi masuk / keluar mengikuti section di viewport
  const io = new IntersectionObserver(entries => {
    for (const en of entries) en.target.classList.toggle('flora-in', en.isIntersecting);
  }, { rootMargin: '-4% 0px -4% 0px' });
  touched.forEach(sec => io.observe(sec));

  // parallax scroll + mouse (batch: baca semua rect dulu, baru tulis transform)
  const decors = [...document.querySelectorAll('.decor')];
  let mx = 0, raf = 0;
  function frame() {
    raf = 0;
    const vh = innerHeight;
    const tops = decors.map(d => d.getBoundingClientRect().top - (d._y || 0));
    decors.forEach((d, i) => {
      const depth = +d.dataset.depth;
      const y = (tops[i] - vh / 2) * -depth;
      d._y = y;
      d.style.transform = `translate3d(${(mx * depth * 90).toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    queue();
  }, { passive: true });
  queue();
}
