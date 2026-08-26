import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { QUALITY } from '../core/quality.js';
import {
  planetTexture, ringTexture, iconSprite, glowSprite, textSprite,
  photoFrameTexture, photoArt, starSprite, wishCardTexture, heartNebulaTexture, nebulaTexture
} from '../graphics/textures.js';

export const PLANETS = [];
export const INTERACTIVE_3D = { photos: [], nodes: [] };

const DEFS = [
  { id: 'love', name: 'Love Planet', sub: 'Home · The Couple', icon: '💗', angle: 0, dist: 60, y: 0, size: 10, base: '#c77dff', accent: '#ffb3d9', atmo: 0xffd88a, ring: { color: 0xffd88a, tilt: 0.38 }, seed: 3 },
  { id: 'story', name: 'Story Planet', sub: 'Our Story', icon: '📖', angle: Math.PI * 2 / 9, dist: 100, y: 4, size: 9, base: '#5b6cff', accent: '#9ad5ff', atmo: 0x9ad5ff, seed: 7 },
  { id: 'wedding', name: 'Wedding Planet', sub: 'The Event', icon: '💍', angle: Math.PI * 4 / 9, dist: 138, y: -2, size: 11, base: '#e8d5b5', accent: '#ffd88a', atmo: 0xffd88a, ring: { color: 0xffe9c0, tilt: 0.2 }, seed: 11 },
  { id: 'destination', name: 'Destination Planet', sub: 'Location', icon: '📍', angle: Math.PI * 6 / 9, dist: 106, y: 6, size: 8, base: '#4fc3f7', accent: '#8ff0c8', atmo: 0x8fd8ff, poles: true, seed: 5 },
  { id: 'rsvp', name: 'RSVP Planet', sub: 'Confirm Attendance', icon: '💌', angle: Math.PI * 8 / 9, dist: 152, y: 2, size: 9, base: '#8f6cff', accent: '#e0b3ff', atmo: 0xc9a8ff, seed: 13 },
  { id: 'gift', name: 'Gift Planet', sub: 'Wedding Gift', icon: '🎁', angle: Math.PI * 10 / 9, dist: 118, y: -5, size: 8, base: '#d99a4e', accent: '#ffe1a8', atmo: 0xffcf8a, seed: 17 },
  { id: 'memory', name: 'Memory Galaxy', sub: 'Photo Gallery', icon: '📸', angle: Math.PI * 12 / 9, dist: 160, y: 3, size: 10, base: '#9fa8ff', accent: '#ffc3e5', atmo: 0xd0b8ff, ring: { color: 0xcfc3ff, tilt: 0.5 }, seed: 19 },
  { id: 'wishes', name: 'Wish Planet', sub: 'Guest Wishes', icon: '🌠', angle: Math.PI * 14 / 9, dist: 130, y: -3, size: 8, base: '#b06bd9', accent: '#ffd0f0', atmo: 0xe3a8ff, ring: { color: 0xe8c8ff, tilt: 0.32 }, seed: 29 },
  { id: 'forever', name: 'Forever Planet', sub: 'Finale', icon: '💞', angle: Math.PI * 16 / 9, dist: 205, y: 0, size: 14, base: '#f3eaff', accent: '#ffb8e0', atmo: 0xffc9ec, ring: { color: 0xffe2f4, tilt: 0.16 }, seed: 23 }
];

function atmosphere(radius, hex) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(hex) }, uIntensity: { value: 0.55 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; uniform vec3 uColor; uniform float uIntensity;
      void main(){ float f = pow(clamp(1.0 - abs(dot(vN,vV)), 0.0, 1.0), 2.6);
      gl_FragColor = vec4(uColor, f * uIntensity); }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.24, 36, 24), mat);
}

function makeOrbitParticles(count, radius, hex, spread = 0.16) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = radius * (0.92 + Math.random() * spread);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.16;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    map: starSprite('#ffffff'), color: hex, size: 1.1, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  }));
  pts.frustumCulled = false;
  return pts;
}

function buildPlanet(def) {
  const group = new THREE.Group();
  const px = Math.sin(def.angle) * def.dist;
  const pz = Math.cos(def.angle) * def.dist;
  group.position.set(px, def.y, pz);

  const segs = QUALITY.tier === 'low' ? 30 : 46;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(def.size, segs, segs * 0.66 | 0),
    new THREE.MeshStandardMaterial({
      map: planetTexture({ base: def.base, accent: def.accent, banding: 0.6, spots: 0.5, poles: !!def.poles, seed: def.seed }),
      roughness: 0.85, metalness: 0.04,
      emissive: new THREE.Color(def.accent), emissiveIntensity: 0.07
    })
  );
  group.add(mesh);

  const atmo = atmosphere(def.size, def.atmo);
  group.add(atmo);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(def.atmo, 256), transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(def.size * 4.6);
  group.add(halo);

  const orbitTiltGroup = new THREE.Group();
  orbitTiltGroup.rotation.set(0.3 + Math.random() * 0.3, 0, 0.18 + Math.random() * 0.2);
  const orbParticles = makeOrbitParticles(QUALITY.orbitParticles, def.size * 1.8, def.atmo);
  orbitTiltGroup.add(orbParticles);
  group.add(orbitTiltGroup);

  const satellites = [];
  const satCount = def.id === 'forever' ? 3 : 1 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < satCount; i++) {
    const mSize = 0.5 + Math.random() * 0.9;
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(mSize, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xcabfe8, roughness: 0.9 })
    );
    const pivot = new THREE.Group();
    pivot.rotation.set((Math.random() - 0.5) * 1.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.6);
    moon.position.x = def.size * (2.3 + Math.random() * 1.2);
    pivot.add(moon);
    group.add(pivot);
    satellites.push({ pivot, spd: 0.12 + Math.random() * 0.2 });
  }

  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconSprite(def.icon), transparent: true, depthWrite: false }));
  icon.scale.setScalar(3.4);
  icon.position.y = def.size + 4.6;
  group.add(icon);

  let ringMesh = null;
  if (def.ring) {
    ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(def.size * 1.5, def.size * 2.15, 72),
      new THREE.MeshBasicMaterial({ map: ringTexture(def.ring.color), transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
    );
    ringMesh.rotation.x = -Math.PI / 2 + def.ring.tilt;
    group.add(ringMesh);
  }

  return { group, mesh, atmo, halo, icon, orbitTiltGroup, orbParticles, satellites, ringMesh };
}

function buildExtras(p, def, scene) {
  const extras = {};
  const g = p.group;

  if (def.id === 'love') {
    const hearts = [];
    for (let i = 0; i < 10; i++) {
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconSprite('💗'), transparent: true, depthWrite: false }));
      h.scale.setScalar(1 + Math.random());
      g.add(h);
      hearts.push({ obj: h, r: def.size * (1.5 + Math.random() * 0.8), a: Math.random() * Math.PI * 2, spd: 0.25 + Math.random() * 0.3, y: (Math.random() - 0.5) * def.size * 1.4 });
    }
    extras.hearts = hearts;
  }

  if (def.id === 'story') {
    extras.storyNodes = [];
    CONFIG.story.forEach((entry, i) => {
      const holder = new THREE.Group();
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.52, 14, 10),
        new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x6cd0ff, emissiveIntensity: 1.6 })
      );
      const lblTex = textSprite(`${entry.icon} ${entry.year}`, { font: '700 40px Quicksand, sans-serif', fill: '#cfeeff', glow: 'rgba(120,210,255,0.9)' });
      const lbl = new THREE.Sprite(new THREE.SpriteMaterial({ map: lblTex, transparent: true, depthWrite: false }));
      const asp = lblTex.userData.aspect || 2;
      lbl.scale.set(3.2, 3.2 / asp, 1);
      lbl.position.y = 1.15;
      holder.add(orb, lbl);
      g.add(holder);
      const node = { obj: holder, entry, index: i, a: (i / CONFIG.story.length) * Math.PI * 2, r: def.size * 2.35, spd: 0.14 };
      extras.storyNodes.push(node);
      INTERACTIVE_3D.nodes.push(node);
    });
  }

  if (def.id === 'wedding') {
    const ringsGroup = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf2c46d, roughness: 0.22, metalness: 0.85, emissive: 0xaa7722, emissiveIntensity: 0.35 });
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 12, 36), goldMat);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 12, 36), goldMat);
    r2.rotation.x = Math.PI / 2.3;
    ringsGroup.add(r1, r2);
    ringsGroup.position.y = def.size + 5.4;
    g.add(ringsGroup);
    extras.weddingRings = ringsGroup;

    const petals = [];
    for (let i = 0; i < 26; i++) {
      const petal = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconSprite(i % 2 ? '🌸' : '✿'), transparent: true, depthWrite: false }));
      petal.scale.setScalar(0.55 + Math.random() * 0.4);
      g.add(petal);
      petals.push({ obj: petal, r: def.size * (1.4 + Math.random() * 1.2), a: Math.random() * Math.PI * 2, y: def.size + Math.random() * def.size, fallSpd: 0.5 + Math.random(), orbSpd: 0.1 + Math.random() * 0.2, spin: Math.random() * 2 });
    }
    extras.petals = petals;
  }

  if (def.id === 'destination') {
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = mapCanvas.height = 256;
    const mx = mapCanvas.getContext('2d');
    mx.fillStyle = 'rgba(30,50,120,0.85)';
    mx.fillRect(0, 0, 256, 256);
    mx.strokeStyle = 'rgba(140,200,255,0.5)';
    mx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      mx.beginPath(); mx.moveTo(i * 32, 0); mx.lineTo(i * 32, 256); mx.stroke();
      mx.beginPath(); mx.moveTo(0, i * 32); mx.lineTo(256, i * 32); mx.stroke();
    }
    mx.strokeStyle = 'rgba(255,220,130,0.9)';
    mx.lineWidth = 5;
    mx.beginPath(); mx.moveTo(20, 230); mx.bezierCurveTo(90, 170, 150, 120, 236, 30); mx.stroke();
    const holo = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.14, 36),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(mapCanvas), transparent: true, opacity: 0.9 })
    );
    const holoPivot = new THREE.Group();
    holo.position.y = def.size + 5.2;
    holoPivot.add(holo);
    const pin = new THREE.Group();
    const pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff7ba8 }));
    const pinTip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 10), new THREE.MeshBasicMaterial({ color: 0xff7ba8 }));
    pinTip.rotation.x = Math.PI;
    pinTip.position.y = -0.5;
    pin.add(pinHead, pinTip);
    pin.position.y = 1;
    holo.add(pin);
    const pulse = new THREE.Mesh(
      new THREE.TorusGeometry(3.9, 0.06, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x9ad5ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
    );
    pulse.rotation.x = Math.PI / 2;
    holoPivot.add(pulse);
    g.add(holoPivot);
    extras.holoMap = holoPivot;
    extras.holoPin = pin;
    extras.holoPulse = pulse;
  }

  if (def.id === 'rsvp') {
    const envelopes = [];
    for (let i = 0; i < 3; i++) {
      const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconSprite('💌'), transparent: true, depthWrite: false }));
      e.scale.setScalar(1.6);
      g.add(e);
      envelopes.push({ obj: e, r: def.size * (1.7 + i * 0.35), a: i * 2.1, spd: 0.2 + i * 0.06, y: (i - 1) * 3 });
    }
    extras.envelopes = envelopes;
  }

  if (def.id === 'gift') {
    const boxGroup = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xff8fc0, roughness: 0.4, metalness: 0.1 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xffd88a, roughness: 0.3, metalness: 0.6, emissive: 0x886622, emissiveIntensity: 0.3 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), boxMat);
    const rb1 = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.3, 1.78), ribbonMat);
    const rb2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.78, 1.78), ribbonMat);
    const bow = new THREE.Mesh(new THREE.TorusKnotGeometry(0.34, 0.1, 48, 8), ribbonMat);
    bow.position.y = 1.15;
    boxGroup.add(box, rb1, rb2, bow);
    boxGroup.position.y = def.size + 5;
    g.add(boxGroup);
    extras.giftBox = boxGroup;

    const coins = [];
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconSprite('✨'), transparent: true, depthWrite: false }));
      c.scale.setScalar(0.7 + Math.random() * 0.5);
      g.add(c);
      coins.push({ obj: c, r: def.size * (1.5 + Math.random()), a: Math.random() * 6.28, spd: 0.3 + Math.random() * 0.4, y: (Math.random() - 0.5) * def.size });
    }
    extras.coins = coins;
  }

  if (def.id === 'memory') {
    extras.photoFrames = [];
    const captions = ['First Meeting', 'First Trip', 'Golden Hour', 'The Proposal', 'Little Moments', 'Stargazing', 'Always Us'];
    captions.forEach((cap, i) => {
      const art = CONFIG.photos[i] ? null : photoArt(i, '');
      const texCanvas = photoFrameTexture(CONFIG.photos[i] || art, cap, i);
      const tex = new THREE.CanvasTexture(texCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(4.1, 3.37),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
      );
      g.add(frame);
      const pf = {
        obj: frame, caption: cap, src: CONFIG.photos[i] || null,
        artIdx: i,
        r: def.size * (2.1 + (i % 3) * 0.45),
        a: (i / captions.length) * Math.PI * 2,
        spd: 0.1 + (i % 4) * 0.02,
        y: ((i % 3) - 1) * def.size * 0.62
      };
      extras.photoFrames.push(pf);
      INTERACTIVE_3D.photos.push(pf);
    });
  }

  if (def.id === 'wishes') {
    const stars = makeOrbitParticles(QUALITY.tier === 'low' ? 40 : 80, def.size * 2.1, 0xffd0f0, 0.3);
    g.add(stars);
    extras.wishStars = stars;
  }

  if (def.id === 'forever') {
    const nebulaHeart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartNebulaTexture(), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    nebulaHeart.scale.set(240, 240, 1);
    nebulaHeart.position.copy(g.position).multiplyScalar(1.28);
    scene.add(nebulaHeart);
    extras.nebulaHeart = nebulaHeart;

    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd88a, roughness: 0.25, metalness: 0.8, emissive: 0xcc9933, emissiveIntensity: 0.4 });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(def.size * 1.42, 0.22, 10, 80), ringMat);
    ringA.rotation.x = Math.PI / 2 - 0.12;
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(def.size * 1.58, 0.14, 10, 80), new THREE.MeshStandardMaterial({ color: 0xffc3e5, roughness: 0.3, metalness: 0.6, emissive: 0x994477, emissiveIntensity: 0.35 }));
    ringB.rotation.x = Math.PI / 2 + 0.22;
    ringB.rotation.z = 0.3;
    g.add(ringA, ringB);
    extras.bigRings = [ringA, ringB];

    const diamond = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconSprite('💍'), transparent: true, depthWrite: false }));
    diamond.scale.setScalar(6);
    diamond.position.y = def.size + 7;
    g.add(diamond);
    extras.diamond = diamond;

    const iniTex = textSprite('A ♥ C', { font: '700 54px Cinzel, serif', fill: '#ffe9f6', glow: 'rgba(255,170,220,0.95)' });
    const initials = new THREE.Sprite(new THREE.SpriteMaterial({ map: iniTex, transparent: true, depthWrite: false }));
    const iasp = iniTex.userData.aspect || 2;
    initials.scale.set(9, 9 / iasp, 1);
    g.add(initials);
    extras.initials = initials;

    const fireflies = makeOrbitParticles(QUALITY.tier === 'low' ? 60 : 120, def.size * 2.4, 0xffc3e5, 0.4);
    fireflies.material.size = 1.5;
    g.add(fireflies);
    extras.fireflies = fireflies;
  }

  if (def.id === 'rsvp') void 0;
  return extras;
}

export let CAMERA_REF = null;

export function createPlanets(scene, camera) {
  CAMERA_REF = camera;
  for (const def of DEFS) {
    const built = buildPlanet(def);
    const extras = buildExtras(built, def, scene);
    const planet = {
      ...built,
      ...extras,
      def,
      id: def.id,
      name: def.name,
      sub: def.sub,
      pos: built.group.position.clone(),
      radius: def.size,
      triggerRadius: def.size + 13,
      discoverRadius: def.size * 1.6 + 5,
      discovered: false,
      glowCur: 0,
      glowTarget: 0,
      celebrateT: -1,
      celebrateMesh: null,

      getWorldPos(out) { return out.copy(this.group.position); },

      setGlow(v) { this.glowTarget = v; },

      celebrate() {
        this.celebrateT = 0;
        if (!this.celebrateMesh) {
          const m = new THREE.Mesh(
            new THREE.TorusGeometry(this.radius * 1.4, 0.35, 8, 60),
            new THREE.MeshBasicMaterial({ color: this.def.atmo, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
          );
          m.rotation.x = Math.PI / 2;
          this.group.add(m);
          this.celebrateMesh = m;
        }
        this.celebrateMesh.visible = true;
        this.celebrateMesh.scale.setScalar(0.8);
        this.celebrateMesh.material.opacity = 0.95;
      },

      update(dt, t) {
        this.mesh.rotation.y += dt * 0.08;
        this.orbitTiltGroup.rotation.y += dt * 0.05;
        this.orbParticles.material.opacity = 0.5 + this.glowCur * 0.5;
        this.orbParticles.material.size = 0.9 + this.glowCur * 0.7;
        for (const s of this.satellites) s.pivot.rotation.y += dt * s.spd;
        this.icon.position.y = this.def.size + 4.6 + Math.sin(t * 1.4) * 0.5;
        this.icon.material.opacity = 0.75 + this.glowCur * 0.25;

        this.glowCur += (this.glowTarget - this.glowCur) * Math.min(1, dt * 4);
        const gl = this.glowCur;
        this.atmo.material.uniforms.uIntensity.value = 0.5 + gl * 1.15;
        this.halo.material.opacity = 0.12 + gl * 0.5;
        this.halo.scale.setScalar(this.def.size * (4.4 + gl * 0.9));

        if (this.ringMesh) this.ringMesh.rotation.z += dt * 0.03;

        if (this.hearts) for (const h of this.hearts) {
          h.a += dt * h.spd;
          h.obj.position.set(Math.cos(h.a) * h.r, h.y + Math.sin(t * 1.2 + h.a) * 0.6, Math.sin(h.a) * h.r);
          h.obj.material.rotation = Math.sin(t + h.a) * 0.3;
        }

        if (this.storyNodes) for (const n of this.storyNodes) {
          n.a += dt * n.spd;
          n.obj.position.set(Math.cos(n.a) * n.r, Math.sin(n.a * 0.7) * 2.4, Math.sin(n.a) * n.r);
          n.obj.rotation.y += dt * 0.6;
        }

        if (this.weddingRings) {
          this.weddingRings.rotation.y += dt * 0.5;
          this.weddingRings.position.y = this.def.size + 5.4 + Math.sin(t * 1.1) * 0.5;
        }
        if (this.petals) for (const pt of this.petals) {
          pt.a += dt * pt.orbSpd;
          pt.y -= dt * pt.fallSpd;
          if (pt.y < -this.def.size * 1.3) pt.y = this.def.size * 1.3;
          pt.obj.position.set(Math.cos(pt.a) * pt.r, pt.y, Math.sin(pt.a) * pt.r);
          pt.obj.material.rotation += dt * pt.spin;
        }

        if (this.holoMap) {
          this.holoMap.rotation.y += dt * 0.3;
          this.holoPin.position.y = 1 + Math.abs(Math.sin(t * 2.2)) * 0.5;
          const ps = 1 + (t % 1.6) / 1.6;
          this.holoPulse.scale.setScalar(ps);
          this.holoPulse.material.opacity = 0.75 * (1 - (t % 1.6) / 1.6);
        }

        if (this.envelopes) for (const e of this.envelopes) {
          e.a += dt * e.spd;
          e.obj.position.set(Math.cos(e.a) * e.r, e.y + Math.sin(t + e.a * 2) * 0.8, Math.sin(e.a) * e.r);
        }

        if (this.giftBox) {
          this.giftBox.rotation.y += dt * 0.6;
          this.giftBox.position.y = this.def.size + 5 + Math.sin(t * 1.3) * 0.6;
        }
        if (this.coins) for (const c of this.coins) {
          c.a += dt * c.spd;
          c.obj.position.set(Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r);
        }

        if (this.photoFrames) for (const f of this.photoFrames) {
          f.a += dt * f.spd;
          f.obj.position.set(Math.cos(f.a) * f.r, f.y + Math.sin(t * 0.8 + f.a) * 0.7, Math.sin(f.a) * f.r);
          if (CAMERA_REF) f.obj.quaternion.copy(CAMERA_REF.quaternion);
        }

        if (this.bigRings) {
          this.bigRings[0].rotation.z += dt * 0.1;
          this.bigRings[1].rotation.z -= dt * 0.07;
        }
        if (this.diamond) this.diamond.position.y = this.def.size + 7 + Math.sin(t * 0.9) * 0.8;
        if (this.initials) {
          const ia = t * 0.12;
          this.initials.position.set(Math.cos(ia) * this.def.size * 1.9, Math.sin(ia * 0.6) * 3, Math.sin(ia) * this.def.size * 1.9);
        }
        if (this.fireflies) this.fireflies.rotation.y -= dt * 0.04;
        if (this.wishStars) this.wishStars.rotation.y += dt * 0.06;

        if (this.celebrateT >= 0) {
          this.celebrateT += dt;
          const k = this.celebrateT / 1.4;
          this.celebrateMesh.scale.setScalar(0.8 + k * 2.2);
          this.celebrateMesh.material.opacity = 0.95 * (1 - k);
          if (k >= 1) { this.celebrateT = -1; this.celebrateMesh.visible = false; }
        }
      }
    };

    PLANETS.push(planet);
    scene.add(planet.group);
  }

  const forever = PLANETS.find(p => p.id === 'forever');
  forever.locked = () => PLANETS.filter(p => p.discovered && p.id !== 'forever').length < 8;

  const wishPlanet = PLANETS.find(p => p.id === 'wishes');
  attachWishes(wishPlanet);

  return PLANETS;
}

function attachWishes(wishPlanet) {
  wishPlanet.wishCards = [];
  wishPlanet.wishAngle = Math.random() * 6;

  const oldUpdate = wishPlanet.update;
  wishPlanet.update = (dt, t) => {
    oldUpdate.call(wishPlanet, dt, t);
    for (const w of wishPlanet.wishCards) {
      w.t += dt;
      w.a += dt * w.spd;
      w.obj.position.set(
        Math.cos(w.a) * w.r,
        w.y + Math.sin(w.t * 0.8 + w.a * 3) * 0.5,
        Math.sin(w.a) * w.r
      );
      if (CAMERA_REF) w.obj.quaternion.copy(CAMERA_REF.quaternion);
    }
  };

  wishPlanet.addWish = (name, message) => {
    if (wishPlanet.wishCards.length > 15) {
      const old = wishPlanet.wishCards.shift();
      wishPlanet.group.remove(old.obj);
    }
    const tex = new THREE.CanvasTexture(wishCardTexture(name, message));
    tex.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 2.75),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
    );
    wishPlanet.group.add(card);
    const w = {
      obj: card, name, message,
      a: wishPlanet.wishAngle,
      r: wishPlanet.radius * (2.3 + wishPlanet.wishCards.length % 3) * 0.35 + wishPlanet.radius * 1.9,
      y: (Math.random() - 0.5) * wishPlanet.radius * 1.4,
      spd: 0.08 + Math.random() * 0.06,
      t: Math.random() * 10
    };
    wishPlanet.wishAngle += 0.9;
    wishPlanet.wishCards.push(w);
    return w;
  };

  CONFIG.seedWishes.forEach(w => wishPlanet.addWish(w.name, w.message));
}
