import * as THREE from 'three';
import { GUEST } from '../core/guest.js';

export function createGuestHologram(scene) {
  if (!GUEST) return null;

  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 360;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = () => {
    const x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);
    x.textAlign = 'center';
    x.shadowColor = 'rgba(170,150,255,0.9)';
    x.shadowBlur = 22;
    x.fillStyle = 'rgba(228,218,255,0.95)';
    x.font = '500 54px Quicksand, sans-serif';
    x.fillText('Kepada Yth.', 512, 110);

    const maxW = 980;
    const minSize = 38;
    let size = 116;
    x.font = `700 ${size}px Cinzel, serif`;
    let w = x.measureText(GUEST).width;
    while (w > maxW && size > minSize) {
      size -= 4;
      x.font = `700 ${size}px Cinzel, serif`;
      w = x.measureText(GUEST).width;
    }

    let lines = [GUEST];
    let lineHeight = size * 1.05;
    if (w > maxW) {
      lines = wrapGuestText(x, GUEST, maxW);
      // if wrapped, maybe slightly smaller to keep elegant
      if (lines.length > 1 && size > 64) {
        size = Math.max(minSize, size - 12);
        x.font = `700 ${size}px Cinzel, serif`;
        lineHeight = size * 1.1;
        // re-wrap at new size
        lines = wrapGuestText(x, GUEST, maxW);
        if (lines.length > 2) lines = lines.slice(0, 2);
      }
    }
    if (lines.length > 2) lines = lines.slice(0, 2);

    x.shadowColor = 'rgba(255,165,220,1)';
    x.shadowBlur = 36;
    x.fillStyle = '#ffffff';
    x.font = `700 ${size}px Cinzel, serif`;
    if (lines.length === 1) {
      x.fillText(lines[0], 512, 262);
    } else {
      const totalH = (lines.length - 1) * lineHeight;
      const startY = 262 - totalH / 2;
      lines.forEach((ln, i) => x.fillText(ln, 512, startY + i * lineHeight));
    }

    x.shadowBlur = 0;
    x.fillStyle = 'rgba(255,216,138,0.9)';
    x.font = '500 40px Quicksand, sans-serif';
    x.fillText('✦ ✦ ✦', 512, 330);
    tex.needsUpdate = true;
  };

  function wrapGuestText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return [text];
    if (text.includes(' ')) {
      const words = text.split(/\s+/);
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth && cur) {
          lines.push(cur);
          cur = w;
        } else cur = test;
      }
      if (cur) lines.push(cur);
      const final = [];
      for (const ln of lines) {
        if (ctx.measureText(ln).width <= maxWidth) final.push(ln);
        else {
          let chunk = '';
          for (const ch of ln) {
            if (ctx.measureText(chunk + ch).width > maxWidth) {
              if (chunk) final.push(chunk);
              chunk = ch;
            } else chunk += ch;
          }
          if (chunk) final.push(chunk);
        }
      }
      return final;
    }
    const lines = [];
    let cur = '';
    for (const ch of text) {
      if (ctx.measureText(cur + ch).width > maxWidth) {
        if (cur) lines.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 }));
  sprite.scale.set(15, 15 * 360 / 1024, 1);
  sprite.position.set(0, 9, 30);
  scene.add(sprite);

  let t = 0;
  function update(dt) {
    t += dt;
    sprite.position.y = 9 + Math.sin(t * 0.85) * 0.7;
    sprite.material.opacity = 0.78 + Math.sin(t * 1.6) * 0.1;
  }

  return { update, sprite };
}
