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
    x.shadowColor = 'rgba(255,165,220,1)';
    x.shadowBlur = 36;
    x.fillStyle = '#ffffff';
    x.font = '700 116px Cinzel, serif';
    x.fillText(GUEST, 512, 262);
    x.shadowBlur = 0;
    x.fillStyle = 'rgba(255,216,138,0.9)';
    x.font = '500 40px Quicksand, sans-serif';
    x.fillText('✦ ✦ ✦', 512, 330);
    tex.needsUpdate = true;
  };
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
