import * as THREE from 'three';
import { QUALITY } from '../core/quality.js';
import { starSprite } from '../graphics/textures.js';

export function createRocket() {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const hullMat = new THREE.MeshStandardMaterial({ color: 0xf5efe2, roughness: 0.32, metalness: 0.45 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xd9b8ff, roughness: 0.4, metalness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf2c46d, roughness: 0.28, metalness: 0.75 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2440, roughness: 0.6, metalness: 0.5 });

  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 1.05, 6, 18), hullMat);
  body.add(capsule);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.85, 18), accentMat);
  nose.position.y = 1.32;
  nose.rotation.x = Math.PI;
  body.add(nose);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), goldMat);
  noseTip.position.y = 1.76;
  body.add(noseTip);

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 12),
    new THREE.MeshPhongMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.55, shininess: 120, specular: 0xffffff, emissive: 0x224466 })
  );
  cockpit.position.set(0, 0.62, 0.26);
  cockpit.scale.set(1, 0.82, 0.9);
  body.add(cockpit);

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.045, 8, 24), goldMat);
  band.position.y = 0.28;
  band.rotation.x = Math.PI / 2;
  body.add(band);

  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.72, 0.42), accentMat);
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    fin.position.set(Math.cos(a) * 0.55, -0.62, Math.sin(a) * 0.55);
    fin.rotation.y = -a;
    fin.rotation.z = 0.14;
    body.add(fin);
  }

  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.42, 14), darkMat);
  nozzle.position.y = -1.06;
  body.add(nozzle);

  const engineCore = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 16),
    new THREE.MeshBasicMaterial({ color: 0xffe9b8 })
  );
  engineCore.position.y = -1.28;
  engineCore.rotation.x = -Math.PI / 2;
  body.add(engineCore);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 1.1, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffc978, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  flame.position.y = -1.7;
  flame.rotation.x = Math.PI;
  body.add(flame);

  const flameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.7, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  flameInner.position.y = -1.5;
  flameInner.rotation.x = Math.PI;
  body.add(flameInner);

  const engineGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: starSprite('#ffd9a0', '#ffffff'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  engineGlow.scale.set(1.6, 1.6, 1);
  engineGlow.position.y = -1.35;
  body.add(engineGlow);

  const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff6f91 }));
  lightL.position.set(-0.56, 0.15, 0.1);
  const lightR = lightL.clone();
  lightR.material = new THREE.MeshBasicMaterial({ color: 0x7dd8ff });
  lightR.position.x = 0.56;
  body.add(lightL, lightR);

  const thrustLight = new THREE.PointLight(0xffc27a, 0, 14, 2);
  thrustLight.position.y = -1.4;
  body.add(thrustLight);

  const TRAIL_N = QUALITY.trailParticles;
  const trailGeo = new THREE.BufferGeometry();
  const tPos = new Float32Array(TRAIL_N * 3);
  const tLife = new Float32Array(TRAIL_N);
  const tSize = new Float32Array(TRAIL_N);
  for (let i = 0; i < TRAIL_N; i++) { tLife[i] = -1; }
  trailGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  trailGeo.setAttribute('aLife', new THREE.BufferAttribute(tLife, 1));
  trailGeo.setAttribute('aSize', new THREE.BufferAttribute(tSize, 1));
  const trailMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTexA: { value: starSprite('#ffb37a', '#fff3d9') },
      uTexB: { value: starSprite('#b39aff', '#ffffff') }
    },
    vertexShader: `attribute float aLife; attribute float aSize; varying float vL;
      void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position,1.0);
      gl_PointSize = aSize * max(0.0,aLife) * (240.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vL; uniform sampler2D uTexA; uniform sampler2D uTexB;
      void main(){ if(vL <= 0.0) discard; vec4 a = texture2D(uTexA, gl_PointCoord); vec4 b = texture2D(uTexB, gl_PointCoord);
      gl_FragColor = mix(a, b, clamp(1.0-vL,0.0,1.0)) * vL; }`
  });
  const trail = new THREE.Points(trailGeo, trailMat);
  trail.frustumCulled = false;

  let head = 0, emitAcc = 0;
  function emit(worldPos, dir, intensity, dt) {
    emitAcc += dt * (26 + intensity * 90);
    while (emitAcc >= 1 && intensity > 0.02) {
      emitAcc -= 1;
      const i = head = (head + 1) % TRAIL_N;
      tPos[i * 3] = worldPos.x + (Math.random() - 0.5) * 0.16;
      tPos[i * 3 + 1] = worldPos.y + (Math.random() - 0.5) * 0.16;
      tPos[i * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 0.16;
      tLife[i] = 0.9 + Math.random() * 0.1;
      tSize[i] = (2.2 + intensity * 3.4) * (0.7 + Math.random() * 0.6);
      velocities[i * 3] = -dir.x * (2.5 + intensity * 5) + (Math.random() - 0.5) * 1.4;
      velocities[i * 3 + 1] = -dir.y * (2.5 + intensity * 5) + (Math.random() - 0.5) * 1.4;
      velocities[i * 3 + 2] = -dir.z * (2.5 + intensity * 5) + (Math.random() - 0.5) * 1.4;
    }
  }
  const velocities = new Float32Array(TRAIL_N * 3);

  function updateTrail(dt, worldPos) {
    for (let i = 0; i < TRAIL_N; i++) {
      if (tLife[i] > 0) {
        tLife[i] -= dt * 1.15;
        tPos[i * 3] += velocities[i * 3] * dt;
        tPos[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        tPos[i * 3 + 2] += velocities[i * 3 + 2] * dt;
        velocities[i * 3 + 1] += dt * 0.6;
      }
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.aLife.needsUpdate = true;
    trailGeo.attributes.aSize.needsUpdate = true;
    void worldPos;
  }

  group.userData.parts = { body, flame, flameInner, engineGlow, engineCore, thrustLight, lightL, lightR, trail };

  let blinkT = 0;
  function setThrottle(t) {
    const f = Math.max(0.08, t);
    flame.scale.y = 0.35 + f * 1.25;
    flame.scale.x = flame.scale.z = 0.65 + f * 0.5;
    flameInner.scale.y = 0.3 + f * 1.1;
    flameInner.position.y = -1.32 - f * 0.38;
    flame.position.y = -1.48 - f * 0.42;
    engineGlow.scale.setScalar(1.1 + f * 1.9);
    engineGlow.material.opacity = 0.35 + f * 0.65;
    thrustLight.intensity = f * 5.5;
  }

  function update(dt, throttle) {
    blinkT += dt;
    const on = Math.sin(blinkT * 4) > 0.3;
    lightR.visible = on;
    lightL.visible = !on || Math.sin(blinkT * 4 + 1) > 0.3;
    setThrottle(throttle);
  }

  return { group, body, emit, updateTrail, update, setThrottle, parts: group.userData.parts };
}
