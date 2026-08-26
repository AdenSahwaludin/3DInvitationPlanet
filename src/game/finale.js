import * as THREE from 'three';
import { CONFIG, DATE_DOT } from '../config.js';
import { state, emit } from '../core/state.js';
import { audio } from '../core/audio.js';
import { cameraRig } from '../game/cameraRig.js';
import { hud } from '../ui/hud.js';
import { starSprite } from '../graphics/textures.js';

const bursts = [];

export function spawnFirework(scene, center, spread = 26) {
  const N = 90;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const vels = [];
  const base = new THREE.Vector3(
    center.x + (Math.random() - 0.5) * spread,
    center.y + Math.random() * spread * 0.7 + 8,
    center.z + (Math.random() - 0.5) * spread
  );
  for (let i = 0; i < N; i++) {
    pos[i * 3] = base.x; pos[i * 3 + 1] = base.y; pos[i * 3 + 2] = base.z;
    vels.push(new THREE.Vector3().randomDirection().multiplyScalar(6 + Math.random() * 14));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const colors = [0xffd88a, 0xff9ad5, 0xcfc3ff, 0x9ad5ff];
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    map: starSprite('#ffffff'), color: colors[(Math.random() * colors.length) | 0],
    size: 2.2, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  pts.frustumCulled = false;
  scene.add(pts);
  bursts.push({ pts, vels, life: 1.8 });
  audio.firework();
}

export function updateFireworks(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life -= dt;
    const arr = b.pts.geometry.attributes.position.array;
    for (let j = 0; j < b.vels.length; j++) {
      arr[j * 3] += b.vels[j].x * dt;
      arr[j * 3 + 1] += b.vels[j].y * dt;
      arr[j * 3 + 2] += b.vels[j].z * dt;
      b.vels[j].y -= dt * 2.5;
      b.vels[j].multiplyScalar(1 - dt * 0.4);
    }
    b.pts.geometry.attributes.position.needsUpdate = true;
    b.pts.material.opacity = Math.max(0, Math.min(1, b.life / 1.2));
    if (b.life <= 0) {
      b.pts.parent && b.pts.parent.remove(b.pts);
      bursts.splice(i, 1);
    }
  }
}

export function playFinale({ scene, rocket, player, foreverPlanet }) {
  state.mode = 'cinematic';

  const dirToCenter = new THREE.Vector3(-foreverPlanet.pos.x, 0, -foreverPlanet.pos.z).normalize();
  const parkPoint = foreverPlanet.pos.clone().addScaledVector(dirToCenter, foreverPlanet.radius + 10);
  parkPoint.y = foreverPlanet.pos.y + 2;

  const startPos = rocket.group.position.clone();
  const yawFrom = rocket.group.rotation.y;
  const targetYaw = Math.atan2(foreverPlanet.pos.x - parkPoint.x, foreverPlanet.pos.z - parkPoint.z);

  const frontCam = foreverPlanet.pos.clone().addScaledVector(dirToCenter, foreverPlanet.radius * 3.4);
  frontCam.y = foreverPlanet.pos.y + 6;

  cameraRig.beginCinematic(frontCam, foreverPlanet.pos.clone());
  audio.whoosh();

  const start = performance.now();
  function approach(now) {
    const k = Math.min(1, (now - start) / 2000);
    const e = 1 - Math.pow(1 - k, 3);
    rocket.group.position.lerpVectors(startPos, parkPoint, e);
    let dy = targetYaw - yawFrom;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    rocket.group.rotation.y = yawFrom + dy * e;
    rocket.update(0.016, 0.5);
    if (k < 1) requestAnimationFrame(approach);
    else captions();
  }
  requestAnimationFrame(approach);

  function captions() {
    const ov = document.getElementById('finale-overlay');
    const cap = document.getElementById('finale-caption');
    const ret = document.getElementById('finale-return');
    ov.classList.remove('hidden');
    cap.innerHTML = '<span>💍</span>';
    setTimeout(() => cap.innerHTML = '<span class="fade-in">Our journey has just begun.</span>', 1200);
    setTimeout(() => cap.innerHTML = '<span>Thank you for being part of our universe.</span>', 5200);
    setTimeout(() => {
      cap.innerHTML = `
        <div class="finale-initials fade-in">${CONFIG.groom[0]} ♥ ${CONFIG.bride[0]}</div>
        <div class="finale-date">${DATE_DOT}</div>`;
    }, 9200);
    setTimeout(() => ret.classList.remove('hidden'), 10600);

    cameraRig.beginCinematic(frontCam, foreverPlanet.pos.clone());
    const widePos = new THREE.Vector3(0, 170, 270);
    const wideLook = new THREE.Vector3(0, 0, 40);
    const cStart = performance.now();
    function pull(now) {
      const k = Math.min(1, (now - cStart) / 14000);
      const e = k * k * (3 - 2 * k);
      cameraRig.cinePos.lerpVectors(frontCam, widePos, e);
      cameraRig.cineLook.lerpVectors(foreverPlanet.pos, wideLook, e);
      if (state.mode === 'cinematic') requestAnimationFrame(pull);
    }
    setTimeout(() => requestAnimationFrame(pull), 2500);

    let fwCount = 0;
    const fwInt = setInterval(() => {
      if (state.mode !== 'cinematic' || fwCount > 22) { clearInterval(fwInt); return; }
      spawnFirework(scene, foreverPlanet.pos, 60);
      fwCount++;
    }, 700);

    ret.onclick = () => {
      audio.click();
      ov.classList.add('hidden');
      ret.classList.add('hidden');
      state.mode = 'play';
      player.speed = 0;
      emit('finaleDone');
    };
  }
}
