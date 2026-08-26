import * as THREE from 'three';
import { CONFIG } from './config.js';
import { QUALITY } from './core/quality.js';
import { state, bus, emit, on } from './core/state.js';
import { initInput, consumeMap } from './core/input.js';
import { audio } from './core/audio.js';
import { api } from './core/api.js';
import { GUEST } from './core/guest.js';
import { updateTweens, tween } from './core/tween.js';
import { createUniverse } from './world/universe.js';
import { createRocket } from './objects/rocket.js';
import { createPlanets, PLANETS, INTERACTIVE_3D } from './objects/planets.js';
import { createEggs } from './objects/eggs.js';
import { createGuestHologram } from './objects/guestHologram.js';
import { createPlayer } from './game/player.js';
import { cameraRig } from './game/cameraRig.js';
import { playFinale, spawnFirework, updateFireworks } from './game/finale.js';
import { hud } from './ui/hud.js';
import { minimap } from './ui/minimap.js';
import { initPanels, openPanel, closePanel, loadCustomWishes } from './ui/panels.js';
import { runOpening, getWarp } from './ui/opening.js';

// Loading Manager
const loadingScreen = document.getElementById('loading-screen');
const loadingBarFill = document.getElementById('loading-bar-fill');
const loadingPercentage = document.getElementById('loading-percentage');

let loadingProgress = 0;
const loadingSteps = [
  { name: 'Initializing renderer', weight: 10 },
  { name: 'Creating universe', weight: 15 },
  { name: 'Loading assets', weight: 25 },
  { name: 'Building planets', weight: 20 },
  { name: 'Preparing scene', weight: 15 },
  { name: 'Final touches', weight: 15 }
];

function updateLoadingProgress(step) {
  const stepData = loadingSteps[step];
  if (!stepData) return;
  
  loadingProgress += stepData.weight;
  if (loadingBarFill) loadingBarFill.style.width = `${loadingProgress}%`;
  if (loadingPercentage) loadingPercentage.textContent = `${Math.round(loadingProgress)}%`;
}

function hideLoadingScreen() {
  loadingProgress = 100;
  if (loadingBarFill) loadingBarFill.style.width = '100%';
  if (loadingPercentage) loadingPercentage.textContent = '100%';
  
  setTimeout(() => {
    if (loadingScreen) {
      loadingScreen.classList.add('loaded');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 600);
    }
  }, 300);
}

const canvas = document.getElementById('scene');
initInput(canvas);

updateLoadingProgress(0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: QUALITY.antialias,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(QUALITY.dpr);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.15;

updateLoadingProgress(1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0f2e, 0.00085);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 4000);
cameraRig.init(camera);

scene.add(new THREE.HemisphereLight(0x93a7ff, 0x241a4a, 0.85));
const sun = new THREE.DirectionalLight(0xfff0dd, 1.15);
sun.position.set(80, 140, 60);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x8899ff, 0.35);
rim.position.set(-60, -30, -80);
scene.add(rim);

const universe = createUniverse(scene);
updateLoadingProgress(2);

const rocket = createRocket();
scene.add(rocket.group);

const remotePhotos = await api.listPhotos();
const photoList = remotePhotos && remotePhotos.length
  ? remotePhotos.map(p => ({ filename: p.filename, caption: p.caption, url: `./assets/photos/${encodeURIComponent(p.filename)}` }))
  : null;

updateLoadingProgress(3);

createPlanets(scene, camera, photoList);
createEggs(scene);
const guestHologram = createGuestHologram(scene);

updateLoadingProgress(4);

{
  const wp = PLANETS.find(p => p.id === 'wishes');
  const remoteWishes = await api.listWishes();
  if (remoteWishes && remoteWishes.length) {
    wp.clearWishes();
    remoteWishes.forEach(w => wp.addWish(w.name, w.message));
  } else {
    loadCustomWishes().forEach(w => wp.addWish(w.name, w.message));
  }
}

const player = createPlayer(rocket);
const rocketProxy = {
  pos: rocket.group.position,
  yaw: 0
};

hud.build(QUALITY.isTouch);
minimap.init();
initPanels({
  fireworksFn: () => {
    const c = rocket.group.position;
    spawnFirework(scene, c, 5);
    setTimeout(() => spawnFirework(scene, c, 8), 380);
  }
});

tween({ from: 0.15, to: 1.05, dur: 3.5, ease: 'outQuad', onUpdate: v => { renderer.toneMappingExposure = v; } });

bus.on('discover', p => {
  hud.updateProgress();
  const contentCount = [...state.discovered].filter(id => id !== 'forever').length;
  if (contentCount >= 8) {
    hud.banner('UNIVERSE COMPLETE ✨', 'The Forever Planet awaits your arrival...');
    setTimeout(() => hud.showToast('💞 <b>Forever Planet</b> has been unlocked. Fly to its golden light.'), 4600);
  } else {
    hud.banner(`PLANET DISCOVERED`, `${p.name} · ${contentCount} / 8`);
  }
});

bus.on('secret', egg => {
  hud.updateSecrets();
  hud.showToast(`You discovered a little secret ✨<br><small>${egg.hint}</small>`);
});

bus.on('interactTarget', p => hud.setPrompt(p, QUALITY.isTouch));

bus.on('openPanel', p => openPanel(p));
bus.on('panelClosed', () => player.exitOrbit());

on('wantInteract', () => player.tryInteract());

bus.on('finaleStart', () => {
  playFinale({
    scene,
    rocket,
    player,
    foreverPlanet: PLANETS.find(p => p.id === 'forever')
  });
});

bus.on('toggleMusic', () => {
  audio.setMuted(!state.muted);
  hud.setMutedIcon(state.muted);
});

function toggleMap(force) {
  const el = document.getElementById('bigmap');
  const open = force !== undefined ? force : !minimap.bigOpen;
  minimap.bigOpen = open;
  el.classList.toggle('hidden', !open);
}
bus.on('toggleMap', () => toggleMap());
bus.on('closeMap', () => toggleMap(false));

bus.on('labelClick', planet => {
  if (state.mode !== 'play') return;
  if (player.pos.distanceTo(planet.pos) < planet.triggerRadius * 1.25) {
    state.interactTarget = planet;
    player.tryInteract();
  } else {
    hud.showToast(`Fly closer to <b>${planet.name}</b> to enter orbit 🚀`);
  }
});

bus.on('storyNode', payload => {
  if (payload) {
    hud.showStoryCard(payload.entry);
  } else {
    hud.showStoryCard(null);
  }
});

bus.on('manualDowngrade', () => downgrade(true));
bus.on('play', () => {
  document.body.classList.add('playing');
  player.yaw = rocket.group.rotation.y;
  hud.showTutorial();
  hud.refreshLabelStates();
  startPerfMonitor();
});

addEventListener('odyssey-esc', () => {
  if (minimap.bigOpen) toggleMap(false);
  const lb = document.getElementById('lightbox');
  if (lb && !lb.classList.contains('hidden')) lb.classList.add('hidden');
});

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pickAt(clientX, clientY) {
  ndc.x = (clientX / innerWidth) * 2 - 1;
  ndc.y = -(clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);

  const photoObjs = INTERACTIVE_3D.photos.map(f => f.obj);
  const hitsPhoto = raycaster.intersectObjects(photoObjs, false);
  if (hitsPhoto.length) {
    const pf = INTERACTIVE_3D.photos.find(f => f.obj === hitsPhoto[0].object);
    if (pf) {
      hud.lightbox(pf.src || pf.obj.material.map.image, pf.caption);
      audio.click();
      return true;
    }
  }

  const nodeOrbs = INTERACTIVE_3D.nodes.map(n => n.obj.children[0]);
  const hitsNode = raycaster.intersectObjects(nodeOrbs, false);
  if (hitsNode.length) {
    const node = INTERACTIVE_3D.nodes.find(n => n.obj.children[0] === hitsNode[0].object);
    if (node) {
      hud.showStoryCard(node.entry);
      audio.click();
      setTimeout(() => hud.showStoryCard(null), 6000);
      return true;
    }
  }

  return false;
}

let downXY = null;
canvas.addEventListener('pointerdown', e => { downXY = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', e => {
  if (!downXY) return;
  const d = Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y);
  const dt = performance.now() - downXY.t;
  downXY = null;
  if (d < 8 && dt < 320) pickAt(e.clientX, e.clientY);
});
addEventListener('odyssey-tap', e => pickAt(e.detail.x, e.detail.y));

document.addEventListener('visibilitychange', () => {
  if (audio.ready && audio.ctx) {
    if (document.hidden) audio.ctx.suspend();
    else if (!state.muted) audio.ctx.resume();
  }
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function downgrade(manual) {
  if (state.downgraded) return;
  state.downgraded = true;
  renderer.setPixelRatio(Math.min(1.1, QUALITY.dpr * 0.65));
  universe.reduce();
  if (manual) hud.showToast('Performance mode ⚡');
}

let perfFrames = 0, perfTime = 0;
function startPerfMonitor() {
  setInterval(() => {
    if (perfTime > 0) {
      const fps = perfFrames / perfTime;
      if (fps < 30 && QUALITY.tier !== 'low') downgrade(false);
    }
    perfFrames = 0; perfTime = 0;
  }, 5000);
}

updateLoadingProgress(5);
hideLoadingScreen();

runOpening({ rocket });

fetch('/api/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: location.pathname,
    guest: GUEST,
    ref: document.referrer,
    screen: `${screen.width}x${screen.height}`,
    lang: navigator.language
  })
}).catch(() => {});

const clock = new THREE.Clock();
let elapsed = 0;

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const now = performance.now();

  updateTweens(now);
  perfFrames++; perfTime += dt;

  if (consumeMap()) toggleMap();

  if (state.mode !== 'intro' && state.mode !== 'launching') {
    player.update(dt, elapsed);
  }

  rocketProxy.yaw = rocket.group.rotation.y;

  for (const p of PLANETS) p.update(dt, elapsed);
  guestHologram && guestHologram.update(dt);

  const warp = Math.max(0, getWarp());
  universe.update(dt, player.pos, camera.quaternion, warp);

  cameraRig.update(dt, rocketProxy, player.speedNorm || 0, boostActive());
  hud.updateLabels(cameraRig);
  minimap.draw(player.pos, player.yaw);
  updateFireworks(dt);

  renderer.render(scene, camera);
}

function boostActive() {
  return player.thrSm > 0.85;
}

window.__odyssey = {
  state, PLANETS, player, rocket,
  rocketNDC() {
    const v = rocket.group.position.clone().project(camera);
    return { x: v.x, y: v.y, behind: v.z > 1 };
  }
};
loop();
