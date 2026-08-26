import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { state, emit } from '../core/state.js';
import { GUEST_LINE } from '../core/guest.js';
import { audio } from '../core/audio.js';
import { cameraRig } from '../game/cameraRig.js';

export function runOpening({ rocket }) {
  const intro = document.getElementById('intro');
  const longName = (CONFIG.groom + CONFIG.bride).length > 18 ? ' long' : '';
  intro.innerHTML = `
    <div class="intro-vignette"></div>
    <div class="intro-content">
      <div class="intro-eyebrow">WEDDING SPACE ODYSSEY</div>
      <h1 class="intro-title${longName}"><span>${CONFIG.groom.toUpperCase()}</span><i>&</i><span>${CONFIG.bride.toUpperCase()}</span></h1>
      <p class="intro-sub">${CONFIG.tagline}</p>
      ${GUEST_LINE ? `<p class="intro-guest">${GUEST_LINE}</p>` : ''}
      <button class="cta-btn launch-btn" id="launch-btn">🚀 LAUNCH OUR STORY</button>
      <p class="intro-hint">Best with sound · headphones recommended</p>
    </div>`;
  requestAnimationFrame(() => intro.classList.add('show'));

  state.mode = 'intro';
  rocket.group.position.set(-30, 16, -175);
  rocket.group.rotation.y = Math.PI * 0.8;

  const camPos = new THREE.Vector3(0, 3.2, -34);
  const start = performance.now();
  const DUR = 5200;
  const from = rocket.group.position.clone();
  const to = new THREE.Vector3(0, 2.6, -17);

  function approach(now) {
    if (state.mode !== 'intro') return;
    const k = Math.min(1, (now - start) / DUR);
    const e = 1 - Math.pow(1 - k, 3);
    rocket.group.position.lerpVectors(from, to, e);
    rocket.group.rotation.y = Math.PI * 0.8 + Math.sin(k * 5) * 0.06;
    rocket.group.rotation.z = Math.sin(k * 3) * 0.05;
    rocket.update(0.016, 0.18 + k * 0.25);
    rocket.parts.engineCore.getWorldPosition(tmpV);
    rocket.emit(tmpV, tmpF.set(Math.sin(rocket.group.rotation.y), 0, Math.cos(rocket.group.rotation.y)), 0.3, 0.016);
    rocket.updateTrail(0.016);
    cameraRig.beginCinematic(camPos, tmpL.copy(rocket.group.position).add(tmpF.set(0, 0.6, 0)));
    if (k < 1) requestAnimationFrame(approach);
  }
  requestAnimationFrame(approach);

  document.getElementById('launch-btn').addEventListener('click', () => launch());

  let launchedOnce = false;
  function launch() {
    if (launchedOnce) return;
    launchedOnce = true;
    audio.init();
    audio.engineStart();
    audio.startMusic();
    audio.click();
    audio.whoosh();

    const btn = document.getElementById('launch-btn');
    btn.disabled = true;
    btn.textContent = 'IGNITION...';
    intro.classList.add('launching');

    state.mode = 'launching';
    emit('launching');

    const lStart = performance.now();
    const L_DUR = 2100;
    const pFrom = rocket.group.position.clone();
    const pTo = new THREE.Vector3(0, 0, 36);
    const yawFrom = rocket.group.rotation.y;
    let warp = 0;

    function fly(now) {
      const k = Math.min(1, (now - lStart) / L_DUR);
      const e = k * k;
      rocket.group.position.lerpVectors(pFrom, pTo, e);
      rocket.group.position.y += Math.sin(k * Math.PI) * 2.2;
      let dy = 0 - yawFrom;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      rocket.group.rotation.y = yawFrom + dy * Math.min(1, k * 1.6);
      rocket.update(0.016, 0.4 + e * 0.6);
      audio.engine(0.4 + e * 0.6);
      rocket.parts.engineCore.getWorldPosition(tmpV);
      rocket.emit(tmpV, tmpF.set(Math.sin(rocket.group.rotation.y), 0, Math.cos(rocket.group.rotation.y)), 1, 0.016);
      rocket.updateTrail(0.016);

      warp = k < 0.85 ? Math.min(1, warp + 0.05) : Math.max(0, warp - 0.08);
      currentWarp = warp;

      if (k > 0.42 && !state.launched) {
        state.launched = true;
        cameraRig.distTarget = 16;
        cameraRig.fovTarget = 74;
        emit('universeOpen');
      }

      if (k < 1) {
        requestAnimationFrame(fly);
      } else {
        finishLaunch();
      }
    }
    requestAnimationFrame(fly);
  }

  function finishLaunch() {
    state.mode = 'play';
    intro.classList.add('gone');
    setTimeout(() => { intro.style.display = 'none'; }, 900);
    emit('play');
  }
}

export function setWarp(v) { currentWarp = v; }
export function getWarp() { return currentWarp; }

let currentWarp = 0;

const tmpV = new THREE.Vector3();
const tmpF = new THREE.Vector3();
const tmpL = new THREE.Vector3();
