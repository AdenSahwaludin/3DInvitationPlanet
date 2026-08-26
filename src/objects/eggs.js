import * as THREE from 'three';
import { iconSprite, glowSprite, starSprite } from '../graphics/textures.js';

export const EGGS = [];

function register(scene, id, obj, radius, hint) {
  scene.add(obj);
  EGGS.push({ id, obj, pos: obj.position.clone(), radius, found: false, hint });
}

export function createEggs(scene) {
  const bobbers = [];

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x9fb8d8, roughness: 0.95 })
  );
  moon.position.set(38, -8, 118);
  const alien = new THREE.Group();
  const aBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.3, 4, 10), new THREE.MeshStandardMaterial({ color: 0x7ee787, roughness: 0.5 }));
  const aHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshStandardMaterial({ color: 0x9ff59f, roughness: 0.45 }));
  aHead.scale.set(1, 1.15, 0.85);
  aHead.position.y = 0.55;
  const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
  const eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.13, 0.62, 0.27);
  const eR = new THREE.Mesh(eyeGeo, eyeMat); eR.position.set(0.13, 0.62, 0.27);
  const antennaMat = new THREE.MeshBasicMaterial({ color: 0x7ee787 });
  const ant1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22), antennaMat);
  ant1.position.set(-0.1, 0.92, 0);
  const ant2 = ant1.clone(); ant2.position.x = 0.1;
  const ball1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
  ball1.position.set(-0.1, 1.05, 0);
  const ball2 = ball1.clone(); ball2.position.x = 0.1;
  alien.add(aBody, aHead, eL, eR, ant1, ant2, ball1, ball2);
  alien.position.set(0, 2.4, 0);
  moon.add(alien);
  moon.userData.alien = alien;
  register(scene, 'alien', moon, 6, 'A tiny friend waves from a lonely moon');

  const ringPair = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c46d, metalness: 0.85, roughness: 0.25, emissive: 0x664411, emissiveIntensity: 0.5 });
  const t1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.14, 10, 30), gold);
  const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.14, 10, 30), gold);
  t2.rotation.x = Math.PI / 2.4;
  t2.position.x = 1.1;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, metalness: 0.4, roughness: 0.1, emissive: 0x88bbff, emissiveIntensity: 0.8 }));
  gem.position.set(-0.9, 0.9, 0);
  ringPair.add(t1, t2, gem);
  const rg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(0xffd88a), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  rg.scale.setScalar(6);
  ringPair.add(rg);
  ringPair.position.set(-120, 10, -60);
  register(scene, 'rings', ringPair, 6, 'Two rings, drifting together since forever');

  const miniShip = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6, 4, 12), new THREE.MeshStandardMaterial({ color: 0xff9ad5, roughness: 0.35, metalness: 0.4 }));
  const win = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshPhongMaterial({ color: 0xbfefff, transparent: true, opacity: 0.7 }));
  win.position.set(0, 0.32, 0.18);
  const finGeo = new THREE.BoxGeometry(0.07, 0.4, 0.26);
  const finMat = new THREE.MeshStandardMaterial({ color: 0xc86bd9 });
  const f1 = new THREE.Mesh(finGeo, finMat); f1.position.set(0.3, -0.42, 0); f1.rotation.z = 0.3;
  const f2 = new THREE.Mesh(finGeo, finMat); f2.position.set(-0.3, -0.42, 0); f2.rotation.z = -0.3;
  const thr = new THREE.Sprite(new THREE.SpriteMaterial({ map: starSprite('#ffd9a0', '#ffffff'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  thr.position.y = -0.75;
  thr.scale.setScalar(1.1);
  miniShip.add(hull, win, f1, f2, thr);
  miniShip.rotation.z = 0.5;
  miniShip.position.set(150, 24, -140);
  register(scene, 'miniship', miniShip, 6, 'Someone else is exploring this universe too');

  const initialsGroup = new THREE.Group();
  const iTex = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    x.font = '700 64px Cinzel, serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.shadowColor = 'rgba(255,200,240,0.9)';
    x.shadowBlur = 18;
    x.fillStyle = '#ffeaf8';
    x.fillText('A ♥ C', 128, 64);
    return new THREE.CanvasTexture(c);
  })(), transparent: true, depthWrite: false }));
  iTex.scale.set(5, 2.5, 1);
  initialsGroup.add(iTex);
  initialsGroup.position.set(-40, 18, -190);
  register(scene, 'initials', initialsGroup, 7, 'Hidden initials among the stars');

  const constellation = new THREE.Group();
  const HEART_PTS = [[0,3],[1.8,4.4],[3.4,3.4],[3.2,1.4],[0,-1.6],[-3.2,1.4],[-3.4,3.4],[-1.8,4.4]];
  for (const [hx, hy] of HEART_PTS) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starSprite('#ffe4f2'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(hx * 2.2, hy * 2.2, 0);
    s.scale.setScalar(2.4);
    constellation.add(s);
  }
  const linePos = [];
  for (let i = 0; i < HEART_PTS.length; i++) {
    const [ax, ay] = HEART_PTS[i];
    const [bx, by] = HEART_PTS[(i + 1) % HEART_PTS.length];
    linePos.push(ax * 2.2, ay * 2.2, 0, bx * 2.2, by * 2.2, 0);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xffb8dc, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending }));
  constellation.add(lines);
  constellation.position.set(-170, 30, 90);
  register(scene, 'heartconstellation', constellation, 9, 'A constellation drawn by two hearts');
  constellation.userData.lines = lines;

  for (const egg of EGGS) {
    if (egg.id === 'alien') continue;
    bobbers.push({ egg, baseY: egg.obj.position.y, phase: Math.random() * 6.28, spin: 0.15 + Math.random() * 0.3 });
  }

  let t = 0;
  function update(dt, rocketPos) {
    t += dt;
    for (const b of bobbers) {
      b.egg.obj.position.y = b.baseY + Math.sin(t * 0.8 + b.phase) * 1.6;
      b.egg.obj.rotation.y += dt * b.spin;
      if (!b.egg.found && rocketPos && b.egg.obj.position.distanceTo(rocketPos) < b.egg.radius + 4) {
        b.egg.obj.children.forEach(ch => { if (ch.material && ch.material.opacity !== undefined) ch.material.transparent = true; });
      }
    }
    const alienMoon = EGGS.find(e => e.id === 'alien');
    if (alienMoon && !alienMoon.found) {
      alienMoon.obj.userData.alien.rotation.y = Math.sin(t * 0.5) * 0.6;
      alienMoon.obj.userData.alien.position.y = 2.4 + Math.sin(t * 1.4) * 0.2;
    }
  }

  function collectFx(egg) {
    const burst = makeBurst(egg.pos);
    scene.add(burst.points);
    bursts.push({ ...burst, life: 1.2 });
  }

  const bursts = [];
  function makeBurst(pos) {
    const N = 40;
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(N * 3);
    const v = [];
    for (let i = 0; i < N; i++) {
      p[i * 3] = pos.x; p[i * 3 + 1] = pos.y; p[i * 3 + 2] = pos.z;
      v.push(new THREE.Vector3().randomDirection().multiplyScalar(3 + Math.random() * 6));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      map: starSprite('#ffe9c9'), color: 0xffe0a8, size: 1.6, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    pts.frustumCulled = false;
    return { points: pts, vels: v };
  }

  function updateBursts(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life -= dt;
      const arr = b.points.geometry.attributes.position.array;
      for (let j = 0; j < b.vels.length; j++) {
        arr[j * 3] += b.vels[j].x * dt;
        arr[j * 3 + 1] += b.vels[j].y * dt;
        arr[j * 3 + 2] += b.vels[j].z * dt;
        b.vels[j].multiplyScalar(1 - dt * 1.5);
      }
      b.points.geometry.attributes.position.needsUpdate = true;
      b.points.material.opacity = Math.max(0, b.life / 1.2);
      if (b.life <= 0) {
        scene.remove(b.points);
        bursts.splice(i, 1);
      }
    }
  }

  return { update: (dt, rp) => { update(dt, rp); updateBursts(dt); }, collectFx };
}
