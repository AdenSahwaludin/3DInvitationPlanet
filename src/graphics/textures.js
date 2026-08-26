import * as THREE from 'three';

const cache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(canvas, { repeat, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}

export function starSprite(color = '#ffffff', inner = '#ffffff') {
  const key = `star${color}${inner}`;
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(64, 64);
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function glowSprite(hex = 0xffd88a, size = 128) {
  const key = `glow${hex}${size}`;
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(size, size);
  const x = c.getContext('2d');
  const r = size / 2;
  const col = new THREE.Color(hex);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  const g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${rgb},0.85)`);
  g.addColorStop(0.35, `rgba(${rgb},0.28)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function nebulaTexture(colors) {
  const key = `nebula${colors.join('')}`;
  if (cache.has(key)) return cache.get(key);
  const S = 512;
  const c = makeCanvas(S, S);
  const x = c.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const col = colors[i % colors.length];
    const cx = S / 2 + (Math.random() - 0.5) * S * 0.55;
    const cy = S / 2 + (Math.random() - 0.5) * S * 0.55;
    const r = S * (0.08 + Math.random() * 0.22);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col + '55');
    g.addColorStop(0.6, col + '22');
    g.addColorStop(1, col + '00');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
  }
  for (let i = 0; i < 90; i++) {
    x.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
    const s = Math.random() < 0.9 ? 1 : 2;
    x.fillRect(Math.random() * S, Math.random() * S, s, s);
  }
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function heartNebulaTexture() {
  const key = 'heartnebula';
  if (cache.has(key)) return cache.get(key);
  const S = 512;
  const c = makeCanvas(S, S);
  const x = c.getContext('2d');
  const pts = [];
  for (let i = 0; i < 2400; i++) {
    const t = Math.random() * Math.PI * 2;
    const hr = 1 + (Math.random() - 0.5) * 0.42;
    let hx = 16 * Math.pow(Math.sin(t), 3) * hr;
    let hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * hr;
    hx *= 13 * 1.02; hy *= 13 * 1.02;
    pts.push([S / 2 + hx + (Math.random() - 0.5) * 14, S / 2 + hy + (Math.random() - 0.5) * 14]);
  }
  const maxR = Math.max(...pts.map(p => Math.hypot(p[0] - S / 2, p[1] - S / 2)));
  for (const [px, py] of pts) {
    const r = 7 + Math.random() * 22;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    const pink = Math.random() < 0.62;
    g.addColorStop(0, pink ? 'rgba(255,130,190,0.20)' : 'rgba(150,110,255,0.17)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  for (let i = 0; i < 130; i++) {
    const [px, py] = pts[(Math.random() * pts.length) | 0];
    x.fillStyle = 'rgba(255,235,250,' + (0.3 + Math.random() * 0.6) + ')';
    x.fillRect(px, py, 1.6, 1.6);
  }
  const inner = Math.min(0.94, (maxR + 4) / (S / 2));
  const mask = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  mask.addColorStop(0, 'rgba(0,0,0,1)');
  mask.addColorStop(inner, 'rgba(0,0,0,1)');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalCompositeOperation = 'destination-in';
  x.fillStyle = mask;
  x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'source-over';
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function planetTexture({ base = '#7c6cff', accent = '#ff9ad5', banding = 0.5, spots = 0.3, poles = false, seed = 1 }) {
  const key = `planet${base}${accent}${banding}${spots}${poles}${seed}`;
  if (cache.has(key)) return cache.get(key);
  const W = 512, H = 256;
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  let rnd = seed * 9301 + 49297;
  const rand = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  x.fillStyle = base;
  x.fillRect(0, 0, W, H);
  const bands = 7 + Math.floor(rand() * 6);
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * H + rand() * 10;
    const h = H / bands * (0.5 + rand());
    x.globalAlpha = 0.12 + rand() * banding * 0.22;
    x.fillStyle = rand() < 0.5 ? accent : base;
    x.beginPath();
    x.moveTo(0, y);
    for (let px = 0; px <= W; px += 32) {
      x.lineTo(px, y + Math.sin(px * 0.02 + i * 1.7 + seed) * 6 * rand() * 2);
    }
    for (let px = W; px >= 0; px -= 32) {
      x.lineTo(px, y + h + Math.sin(px * 0.03 + i * 2.3) * 5);
    }
    x.closePath();
    x.fill();
  }
  x.globalAlpha = 1;
  for (let i = 0; i < spots * 40; i++) {
    const px = rand() * W, py = H * 0.15 + rand() * H * 0.7;
    const r = 2 + rand() * 14;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, (rand() < 0.5 ? accent : '#ffffff') + '44');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  if (poles) {
    const pg = x.createLinearGradient(0, 0, 0, H);
    pg.addColorStop(0, 'rgba(255,255,255,0.5)');
    pg.addColorStop(0.18, 'rgba(255,255,255,0)');
    pg.addColorStop(0.82, 'rgba(255,255,255,0)');
    pg.addColorStop(1, 'rgba(255,255,255,0.45)');
    x.fillStyle = pg;
    x.fillRect(0, 0, W, H);
  }
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function ringTexture(hex = 0xffd88a) {
  const key = `ring${hex}`;
  if (cache.has(key)) return cache.get(key);
  const W = 256, H = 64;
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  const col = new THREE.Color(hex);
  const rgb = `${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0}`;
  for (let i = 0; i < 42; i++) {
    const px = (i / 42) * W;
    const w = 1 + Math.random() * 3.5;
    x.fillStyle = `rgba(${rgb},${0.15 + Math.random() * 0.75})`;
    x.fillRect(px, 0, w, H);
  }
  const grad = x.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0.35)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.fillStyle = grad;
  x.fillRect(0, 0, W, H);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function iconSprite(char = '✨', pad = 0.18) {
  const key = `icon${char}`;
  if (cache.has(key)) return cache.get(key);
  const S = 128;
  const c = makeCanvas(S, S);
  const x = c.getContext('2d');
  x.font = `${S * (1 - pad * 2)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.shadowColor = 'rgba(255,220,160,0.9)';
  x.shadowBlur = 22;
  x.fillText(char, S / 2, S / 2 + S * 0.04);
  x.fillText(char, S / 2, S / 2 + S * 0.04);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function textSprite(text, { font = '600 44px Quicksand, sans-serif', fill = '#fff', glow = 'rgba(200,180,255,0.9)', pad = 24 } = {}) {
  const key = `text${text}${font}${fill}`;
  if (cache.has(key)) return cache.get(key);
  const m = makeCanvas(8, 8).getContext('2d');
  m.font = font;
  const w = Math.ceil(m.measureText(text).width) + pad * 2;
  const h = 96;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  x.font = font;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.shadowColor = glow;
  x.shadowBlur = 16;
  x.fillStyle = fill;
  x.fillText(text, w / 2, h / 2);
  x.fillText(text, w / 2, h / 2);
  const t = toTexture(c);
  t.userData = { aspect: w / h };
  cache.set(key, t);
  return t;
}

export function photoArt(idx, caption) {
  const palettes = [
    ['#2b1055', '#7597de', '#ffb86c'],
    ['#0f2027', '#2c5364', '#f7b2d9'],
    ['#41295a', '#8360c3', '#ffd88a'],
    ['#1a2a6c', '#b21f1f', '#fdb750'],
    ['#134e5e', '#71b280', '#fdf3d8'],
    ['#360033', '#0b8793', '#ffc3e5']
  ];
  const p = palettes[idx % palettes.length];
  const W = 512, H = 384;
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, p[0]);
  g.addColorStop(0.65, p[1]);
  g.addColorStop(1, p[2]);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  const sunX = W * (0.3 + (idx % 4) * 0.15);
  const sg = x.createRadialGradient(sunX, H * 0.62, 0, sunX, H * 0.62, 120);
  sg.addColorStop(0, 'rgba(255,240,220,0.95)');
  sg.addColorStop(0.3, 'rgba(255,210,170,0.55)');
  sg.addColorStop(1, 'rgba(255,200,160,0)');
  x.fillStyle = sg;
  x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(20,10,40,0.85)';
  x.beginPath();
  x.moveTo(0, H);
  for (let i = 0; i <= 8; i++) {
    x.lineTo((i / 8) * W, H * 0.78 - Math.sin(i * 1.7 + idx) * 34 - ((i * 37 + idx * 13) % 23));
  }
  x.lineTo(W, H);
  x.closePath();
  x.fill();
  for (let i = 0; i < 60; i++) {
    x.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
    x.fillRect(Math.random() * W, Math.random() * H * 0.55, 1.5, 1.5);
  }
  x.font = '28px Quicksand, sans-serif';
  x.textAlign = 'center';
  x.shadowColor = 'rgba(0,0,0,0.6)';
  x.shadowBlur = 8;
  x.fillStyle = 'rgba(255,245,230,0.92)';
  x.fillText(caption, W / 2, H - 26);
  return c;
}

export function photoFrameTexture(imgCanvasOrURL, caption, idx) {
  const W = 512, H = 420;
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  const frameGrad = x.createLinearGradient(0, 0, W, 0);
  frameGrad.addColorStop(0, 'rgba(180,170,255,0.9)');
  frameGrad.addColorStop(0.5, 'rgba(255,255,255,0.98)');
  frameGrad.addColorStop(1, 'rgba(255,190,235,0.9)');
  x.fillStyle = frameGrad;
  roundRect(x, 0, 0, W, H, 26);
  x.fill();
  x.save();
  roundRect(x, 16, 16, W - 32, H - 110, 18);
  x.clip();
  if (typeof imgCanvasOrURL === 'string' && imgCanvasOrURL) {
    x.fillStyle = '#1a1440';
    x.fillRect(16, 16, W - 32, H - 110);
  } else if (imgCanvasOrURL) {
    x.drawImage(imgCanvasOrURL, 16, 16, W - 32, H - 110);
  } else {
    x.drawImage(photoArt(idx, ''), 16, 16, W - 32, H - 110);
  }
  x.restore();
  x.strokeStyle = 'rgba(255,255,255,0.9)';
  x.lineWidth = 3;
  roundRect(x, 16, 16, W - 32, H - 110, 18);
  x.stroke();
  x.font = '600 30px Quicksand, sans-serif';
  x.textAlign = 'center';
  x.fillStyle = '#3a2c66';
  x.fillText(caption, W / 2, H - 46);
  return c;
}

export function wishCardTexture(name, message) {
  const W = 480, H = 300;
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(70,50,140,0.94)');
  g.addColorStop(1, 'rgba(160,80,180,0.9)');
  x.fillStyle = g;
  roundRect(x, 0, 0, W, H, 24);
  x.fill();
  x.strokeStyle = 'rgba(255,220,255,0.85)';
  x.lineWidth = 3;
  roundRect(x, 8, 8, W - 16, H - 16, 18);
  x.stroke();
  x.fillStyle = 'rgba(255,225,250,0.95)';
  x.font = '700 30px Quicksand, sans-serif';
  x.textAlign = 'left';
  wrapText(x, `💌 ${name}`, 28, 52, W - 56, 36);
  x.fillStyle = 'rgba(255,255,255,0.92)';
  x.font = '500 24px Quicksand, sans-serif';
  wrapText(x, message, 28, 100, W - 56, 32);
  return c;
}

function wrapText(x, text, px, py, maxW, lh) {
  const words = text.split(' ');
  let line = '', y = py;
  for (const w of words) {
    const test = line + w + ' ';
    if (x.measureText(test).width > maxW && line) {
      x.fillText(line.trim(), px, y);
      line = w + ' ';
      y += lh;
    } else line = test;
  }
  x.fillText(line.trim(), px, y);
}

function roundRect(x, px, py, w, h, r) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}
