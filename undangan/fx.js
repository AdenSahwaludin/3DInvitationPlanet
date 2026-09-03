// Efek partikel mewah (2D canvas): debu emas melayang + kelopak jatuh.
// Juga mengatur langit malam (#sky-backdrop) yang menyala mendekati bagian penutup.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);

const PETAL_COLORS = [
  ['212, 175, 55', '247, 231, 206'],   // emas
  ['233, 218, 178', '253, 250, 243'],  // champagne
  ['233, 160, 170', '252, 226, 226'],  // rose lembut
  ['201, 162, 84', '240, 226, 182']    // emas tua
];

export function initFx() {
  const canvas = document.getElementById('fx-canvas');
  const backdrop = document.getElementById('sky-backdrop');
  const heroEl = document.getElementById('hero');
  const finaleEl = document.getElementById('penutup');
  if (!canvas || REDUCED) return { burst() {} };

  const ctx = canvas.getContext('2d');
  let vw = 0, vh = 0, nightOpacity = -1;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth; vh = innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  // —— debu emas (selalu ada, sangat halus) ——
  const dust = Array.from({ length: vw < 720 ? 26 : 46 }, () => ({
    x: rnd(0, vw), y: rnd(0, vh),
    r: rnd(0.6, 2.1),
    sp: rnd(5, 16),
    ph: rnd(0, Math.PI * 2),
    sw: rnd(8, 26),
    tw: rnd(0, Math.PI * 2),
    tws: rnd(0.6, 1.8),
    a: rnd(0.2, 0.5)
  }));

  // —— kelopak (lebih terlihat di hero & penutup) ——
  const petals = [];
  function spawnPetal(fromTop) {
    const c = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    petals.push({
      x: rnd(-30, vw + 30),
      y: fromTop ? rnd(-vh * 0.25, -20) : rnd(0, vh),
      s: rnd(5, 11),
      sp: rnd(13, 30),
      ph: rnd(0, Math.PI * 2),
      swA: rnd(18, 44),
      swF: rnd(0.4, 0.9),
      rot: rnd(0, Math.PI * 2),
      vr: rnd(-1.1, 1.1),
      c,
      a: rnd(0.55, 0.85)
    });
  }
  const petalTarget = vw < 720 ? 9 : 15;
  for (let i = 0; i < petalTarget; i++) spawnPetal(false);

  function drawPetal(p) {
    const s = p.s;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const g = ctx.createLinearGradient(0, -s, 0, s);
    g.addColorStop(0, `rgba(${p.c[1]}, ${p.a})`);
    g.addColorStop(1, `rgba(${p.c[0]}, ${p.a})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.35, s * 0.75, s * 0.65, 0, s);
    ctx.bezierCurveTo(-s * 0.75, s * 0.65, -s * 0.9, -s * 0.35, 0, -s);
    ctx.fill();
    ctx.strokeStyle = `rgba(${p.c[0]}, ${p.a * 0.55})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }

  function burst(n = 22) {
    for (let i = 0; i < n; i++) spawnPetal(true);
  }

  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;

    ctx.clearRect(0, 0, vw, vh);

    // kelopak: lebih pekat saat hero/penutup terlihat
    const heroR = heroEl.getBoundingClientRect();
    const finaleR = finaleEl.getBoundingClientRect();
    const near = heroR.bottom > 0 || (finaleR.top < vh && finaleR.bottom > 0);
    const targetA = near ? 1 : 0.35;
    for (const p of petals) {
      p.y += p.sp * dt;
      p.ph += p.swF * dt;
      p.x += Math.sin(p.ph) * p.swA * dt;
      p.rot += p.vr * dt;
      if (p.y > vh + 24) { p.y = rnd(-40, -16); p.x = rnd(-30, vw + 30); }
      if (p.x < -40) p.x = vw + 30;
      if (p.x > vw + 40) p.x = -30;
    }
    ctx.globalAlpha = targetA;
    for (const p of petals) drawPetal(p);
    ctx.globalAlpha = 1;

    // debu emas berkelip, melayang naik pelan
    for (const d of dust) {
      d.y -= d.sp * dt;
      d.ph += dt;
      if (d.y < -6) { d.y = vh + 6; d.x = rnd(0, vw); }
      const tw = 0.55 + 0.45 * Math.sin(d.tw + t * d.tws);
      ctx.beginPath();
      ctx.fillStyle = `rgba(228, 196, 110, ${d.a * tw})`;
      ctx.arc(d.x + Math.sin(d.ph) * d.sw * 0.16, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // langit malam mendekati penutup
    const nf = clamp((vh * 0.6 - finaleR.top) / (vh * 0.45), 0, 1);
    if (Math.abs(nf - nightOpacity) > 0.01) {
      nightOpacity = nf;
      backdrop.style.opacity = String(nf);
    }
  }
  requestAnimationFrame(loop);

  return { burst };
}
