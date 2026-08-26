import * as THREE from 'three';
import { QUALITY } from '../core/quality.js';
import { starSprite, nebulaTexture, glowSprite } from '../graphics/textures.js';

export function createUniverse(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1600, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new THREE.Color(0x05081f) }, mid: { value: new THREE.Color(0x141a4d) }, bot: { value: new THREE.Color(0x1d1445) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
        void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h,0.6)) : mix(mid, bot, pow(-h,0.7));
        gl_FragColor = vec4(c,1.0); }`
    })
  );
  group.add(dome);

  function makeStars(count, radiusMin, radiusMax, size, color, opacity) {
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = radiusMin + Math.random() * (radiusMax - radiusMin);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: size },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uTex: { value: starSprite('#ffffff') }
      },
      vertexShader: `attribute float aPhase; varying float vA; uniform float uTime; uniform float uSize;
        void main(){ vA = 0.55 + 0.45*sin(uTime*1.6 + aPhase);
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = uSize * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; uniform sampler2D uTex; uniform vec3 uColor; uniform float uOpacity;
        void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA * uOpacity); }`
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    return { pts, mat };
  }

  const near = makeStars(QUALITY.stars, 260, 700, 2.6, 0xffffff, 0.95);
  const far = makeStars(QUALITY.farStars, 700, 1300, 2.0, 0xbfd0ff, 0.8);
  group.add(near.pts, far.pts);

  const tinted = makeStars(Math.floor(QUALITY.stars * 0.18), 280, 650, 3.2, 0xffc9e8, 0.85);
  const tinted2 = makeStars(Math.floor(QUALITY.stars * 0.14), 280, 650, 3.0, 0xffdfae, 0.85);
  group.add(tinted.pts, tinted2.pts);

  const nebColors = [
    ['#7c6cff', '#ff9ad5'], ['#3d2f8f', '#cfc3ff'], ['#ff9ad5', '#ffd88a'],
    ['#5b3fbf', '#ff9ad5'], ['#2a1e66', '#7c6cff']
  ];
  const nebulaSprites = [];
  for (let i = 0; i < QUALITY.nebulae; i++) {
    const tex = nebulaTexture(nebColors[i % nebColors.length]);
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, rotation: Math.random() * Math.PI });
    const s = new THREE.Sprite(m);
    const r = 420 + Math.random() * 500;
    const a = (i / QUALITY.nebulae) * Math.PI * 2 + Math.random();
    s.position.set(Math.cos(a) * r, (Math.random() - 0.35) * 320, Math.sin(a) * r);
    const sc = 340 + Math.random() * 380;
    s.scale.set(sc, sc * 0.75, 1);
    s.userData.baseOpacity = 0.28 + Math.random() * 0.14;
    s.userData.spin = (Math.random() - 0.5) * 0.008;
    nebulaSprites.push(s);
    group.add(s);
  }

  const galaxyMatFor = hex => new THREE.SpriteMaterial({ map: glowSprite(hex, 256), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  [[0xcfc3ff, [-520, 140, -640], 190], [0xffd88a, [600, -90, -480], 150], [0xff9ad5, [420, 210, 560], 170]].forEach(([hex, p, sc]) => {
    const g = new THREE.Sprite(galaxyMatFor(hex));
    g.position.set(...p);
    g.scale.set(sc, sc * 0.42, 1);
    g.material.rotation = Math.random();
    group.add(g);
  });

  let dustGeo, dustPts, dustMat;
  {
    const n = QUALITY.dust;
    dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dustMat = new THREE.PointsMaterial({
      map: starSprite('#ffffff'), color: 0xcfc3ff, size: 0.55, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    dustPts = new THREE.Points(dustGeo, dustMat);
    dustPts.frustumCulled = false;
    group.add(dustPts);
  }

  const asteroids = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x8f86c9, roughness: 0.9, metalness: 0.15, flatShading: true }),
    QUALITY.asteroids
  );
  {
    const dummy = new THREE.Object3D();
    const beltR = 175;
    for (let i = 0; i < QUALITY.asteroids; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = beltR + (Math.random() - 0.5) * 70;
      dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 46, Math.sin(a) * r);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const s = 0.5 + Math.random() * 2.4;
      dummy.scale.set(s, s * (0.6 + Math.random() * 0.6), s * (0.7 + Math.random() * 0.6));
      dummy.updateMatrix();
      asteroids.setMatrixAt(i, dummy.matrix);
    }
    asteroids.instanceMatrix.needsUpdate = true;
    group.add(asteroids);
  }
  const asteroidData = [];
  {
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    for (let i = 0; i < QUALITY.asteroids; i++) {
      asteroids.getMatrixAt(i, m);
      m.decompose(p, q, s);
      asteroidData.push({ base: p.clone(), spinAxis: q.clone(), scale: s.clone(), ang: Math.atan2(p.z, p.x), r: Math.hypot(p.x, p.z), y: p.y, rotSpd: 0.05 + Math.random() * 0.12, orbSpd: (Math.random() - 0.5) * 0.02 });
    }
  }

  const warpGeo = new THREE.BufferGeometry();
  const WARP_N = 90;
  const wpos = new Float32Array(WARP_N * 6);
  for (let i = 0; i < WARP_N; i++) {
    const a = Math.random() * Math.PI * 2, rr = 6 + Math.random() * 30;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.6;
    wpos[i * 6] = x; wpos[i * 6 + 1] = y; wpos[i * 6 + 2] = -10 - Math.random() * 80;
    wpos[i * 6 + 3] = x; wpos[i * 6 + 4] = y; wpos[i * 6 + 5] = -10 - Math.random() * 80;
  }
  warpGeo.setAttribute('position', new THREE.BufferAttribute(wpos, 3));
  const warpMat = new THREE.LineBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const warpLines = new THREE.LineSegments(warpGeo, warpMat);
  warpLines.frustumCulled = false;
  warpLines.visible = false;

  const cometGroup = new THREE.Group();
  scene.add(cometGroup);
  const comets = [];
  for (let i = 0; i < 3; i++) {
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(i === 0 ? 0xbfe0ff : i === 1 ? 0xffc9e8 : 0xffe6b0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    head.scale.set(4, 4, 1);
    const TRAIL = 26;
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    const tp = new THREE.Points(tg, new THREE.PointsMaterial({ map: starSprite('#ffffff'), color: 0xcfe4ff, size: 2.4, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    tp.frustumCulled = false;
    cometGroup.add(head, tp);
    comets.push({
      head, trail: tp, TRAIL,
      axis: new THREE.Vector3().randomDirection(),
      radius: 150 + Math.random() * 180,
      speed: 0.05 + Math.random() * 0.08,
      angle: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.2,
      history: []
    });
  }

  const meteors = [];
  const meteorPool = [];
  function spawnMeteor(centerNearPlayer = true) {
    let m = meteorPool.pop();
    if (!m) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xfff2cf, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      line.frustumCulled = false;
      m = { line, vel: new THREE.Vector3(), life: 0 };
    }
    const base = centerNearPlayer ? cameraAnchor.clone() : new THREE.Vector3();
    const off = new THREE.Vector3((Math.random() - 0.5) * 160, 40 + Math.random() * 60, (Math.random() - 0.5) * 160);
    m.line.position.copy(base).add(off);
    m.vel.set((Math.random() - 0.5) * 60, -30 - Math.random() * 40, (Math.random() - 0.5) * 60);
    m.life = 1.4 + Math.random();
    m.maxLife = m.life;
    const pos = m.line.geometry.attributes.position.array;
    pos[0] = 0; pos[1] = 0; pos[2] = 0;
    pos[3] = m.vel.x * 0.12; pos[4] = m.vel.y * 0.12; pos[5] = m.vel.z * 0.12;
    m.line.geometry.attributes.position.needsUpdate = true;
    m.line.material.opacity = 0.9;
    scene.add(m.line);
    meteors.push(m);
  }

  const cameraAnchor = new THREE.Vector3();
  let meteorTimer = 14, showerTimer = 60 + Math.random() * 50, showerLeft = 0;

  let time = 0;
  function update(dt, rocketPos, camQuat, warp) {
    time += dt;
    near.mat.uniforms.uTime.value = time;
    far.mat.uniforms.uTime.value = time;
    tinted.mat.uniforms.uTime.value = time * 1.2;
    tinted2.mat.uniforms.uTime.value = time * 0.9;

    for (const s of nebulaSprites) {
      s.material.rotation += s.userData.spin * dt;
    }

    if (rocketPos) {
      cameraAnchor.copy(rocketPos);
      const arr = dustGeo.attributes.position.array;
      const cx = rocketPos.x, cz = rocketPos.z;
      for (let i = 0; i < arr.length; i += 3) {
        const dx = arr[i] - cx, dz = arr[i + 2] - cz;
        if (dx * dx + dz * dz > 3600) {
          arr[i] = cx + (Math.random() - 0.5) * 100;
          arr[i + 1] = rocketPos.y + (Math.random() - 0.5) * 50;
          arr[i + 2] = cz + (Math.random() - 0.5) * 100;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;
      dustMat.opacity = 0.4 + warp * 0.5;
    }

    const dummyM = new THREE.Matrix4();
    asteroids.getMatrixAt(0, dummyM);
    for (let i = 0; i < asteroidData.length; i++) {
      const d = asteroidData[i];
      d.ang += d.orbSpd * dt;
      const px = Math.cos(d.ang) * d.r, pz = Math.sin(d.ang) * d.r;
      dummyM.compose(
        new THREE.Vector3(px, d.y + Math.sin(time * 0.4 + i) * 1.5, pz),
        d.spinAxis,
        d.scale
      );
      asteroids.setMatrixAt(i, dummyM);
    }
    asteroids.instanceMatrix.needsUpdate = true;

    for (const c of comets) {
      c.angle += c.speed * dt;
      const v = new THREE.Vector3(Math.cos(c.angle) * c.radius, c.tilt * 60, Math.sin(c.angle) * c.radius);
      c.head.position.copy(v);
      c.history.unshift(v.clone());
      if (c.history.length > c.TRAIL) c.history.pop();
      const arr = c.trail.geometry.attributes.position.array;
      for (let i = 0; i < c.TRAIL; i++) {
        const hp = c.history[Math.min(i, c.history.length - 1)] || v;
        arr[i * 3] = hp.x; arr[i * 3 + 1] = hp.y; arr[i * 3 + 2] = hp.z;
      }
      c.trail.geometry.attributes.position.needsUpdate = true;
    }

    meteorTimer -= dt;
    showerTimer -= dt;
    if (showerTimer <= 0) { showerLeft = 12; showerTimer = 80 + Math.random() * 60; }
    if (showerLeft > 0) { showerLeft -= dt; if (meteorTimer > 0.25) meteorTimer = 0.25; }
    if (meteorTimer <= 0) {
      spawnMeteor(true);
      meteorTimer = 2.5 + Math.random() * 6;
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.life -= dt;
      m.line.position.addScaledVector(m.vel, dt);
      m.line.material.opacity = Math.min(1, m.life / m.maxLife) * 0.9;
      if (m.life <= 0) {
        scene.remove(m.line);
        meteors.splice(i, 1);
        meteorPool.push(m);
      }
    }

    warpLines.visible = warp > 0.02;
    if (warpLines.visible) {
      warpLines.quaternion.copy(camQuat);
      warpLines.position.copy(cameraAnchor);
      warpLines.translateZ(-40);
      warpMat.opacity = warp * 0.75;
      const arr = warpGeo.attributes.position.array;
      const stretch = 6 + warp * 26;
      for (let i = 0; i < WARP_N; i++) {
        arr[i * 6 + 5] += stretch;
        if (arr[i * 6 + 5] > 20) arr[i * 6 + 5] = -80 - Math.random() * 40;
      }
      warpGeo.attributes.position.needsUpdate = true;
    }

    dome.position.set(cameraAnchor.x, 0, cameraAnchor.z);
    return { time };
  }

  function reduce() {
    near.pts.visible = false;
    tinted2.pts.visible = false;
    dustMat.size = 0.4;
    warpMat.opacity = 0;
  }

  function setWarpLinesParent(parentScene) {
    parentScene.add(warpLines);
  }

  setWarpLinesParent(scene);

  return { update, reduce, spawnMeteor, warpLines, setWarp: () => {} };
}
