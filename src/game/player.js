import * as THREE from 'three';
import { state, bus, emit } from '../core/state.js';
import { input, pollMove, consumeInteract } from '../core/input.js';
import { audio } from '../core/audio.js';
import { clamp, damp } from '../core/tween.js';
import { cameraRig } from './cameraRig.js';
import { PLANETS } from '../objects/planets.js';
import { EGGS } from '../objects/eggs.js';

const tmpV = new THREE.Vector3();
const tmpF = new THREE.Vector3();

export function createPlayer(rocket) {
  const bankG = new THREE.Group();
  rocket.group.remove(rocket.body);
  bankG.add(rocket.body);
  rocket.body.rotation.x = Math.PI / 2;
  rocket.group.add(bankG);

  const player = {
    pos: rocket.group.position,
    yaw: 0,
    speed: 0,
    thrSm: 0,
    speedNorm: 0,
    storyNearNode: null,

    forward(out) { return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); },

    update(dt, t) {
      if (state.mode !== 'play') {
        this.idleVisual(dt, t, false);
        return;
      }

      const mv = pollMove();
      const boostOn = input.boost && mv.y > 0.1;

      let maxSpeed = boostOn ? 46 : 24;
      if (mv.y > 0.02) this.speed += (boostOn ? 34 : 26) * dt * mv.y;
      else if (mv.y < -0.02) this.speed += 20 * dt * mv.y;
      else this.speed *= Math.exp(-dt * 1.5);

      this.speed = clamp(this.speed, -11, maxSpeed);
      if (this.speed > maxSpeed) this.speed = damp(this.speed, maxSpeed, 3, dt);

      const turnIn = clamp(mv.x, -1, 1);
      const turnRate = 2.05 * (1 - 0.38 * Math.abs(this.speed) / 30);
      this.yaw -= turnIn * turnRate * dt;

      this.forward(tmpF);
      this.pos.addScaledVector(tmpF, this.speed * dt);

      const rLen = Math.hypot(this.pos.x, this.pos.z);
      if (rLen > 292) {
        this.pos.x *= 292 / rLen;
        this.pos.z *= 292 / rLen;
        this.speed *= Math.exp(-dt * 4);
      }
      this.pos.y = 0;

      for (const p of PLANETS) {
        const dx = this.pos.x - p.pos.x, dz = this.pos.z - p.pos.z;
        const d = Math.hypot(dx, dz);
        const minD = p.radius + 4;
        if (d < minD && d > 0.001) {
          const push = (minD - d) / d;
          this.pos.x += dx * push;
          this.pos.z += dz * push;
          this.speed *= Math.exp(-dt * 6);
        }
      }

      this.thrSm = damp(this.thrSm, mv.y > 0.02 ? (boostOn ? 1 : 0.45 + mv.y * 0.55) : mv.y < -0.02 ? 0.25 : 0.12, 5, dt);
      this.speedNorm = clamp(Math.abs(this.speed) / 46, 0, 1);

      rocket.group.position.copy(this.pos);
      rocket.group.rotation.y = this.yaw;
      this.bankGVisual(bankG, turnIn, boostOn, dt);

      rocket.update(dt, this.thrSm);
      audio.engine(this.thrSm);

      rocket.parts.engineCore.getWorldPosition(tmpV);
      rocket.emit(tmpV, tmpF, this.thrSm, dt);
      rocket.updateTrail(dt);

      if (boostOn && Math.random() < dt * 2.2) audio.boost();

      this.checkPlanets(dt);
      this.checkEggs();

      if (consumeInteract()) this.tryInteract();
      this.idleVisual(dt, t, true);
    },

    idleVisual(dt, t, moving) {
      const bob = Math.sin(t * (moving ? 2.2 : 1.5)) * (moving ? 0.08 : 0.22);
      rocket.body.position.y = bob * 0.35;
      if (!moving) {
        rocket.group.rotation.z = Math.sin(t * 0.7) * 0.03;
        rocket.update(dt, 0.14);
        audio.engine(0.1);
        rocket.parts.engineCore.getWorldPosition(tmpV);
        rocket.emit(tmpV, this.forward(tmpF), 0.15, dt);
        rocket.updateTrail(dt);
      } else {
        rocket.group.rotation.z = damp(rocket.group.rotation.z, 0, 3, dt);
      }
    },

    bankGVisual(bankG, turnIn, boostOn, dt) {
      const targetBank = turnIn * 0.5;
      bankG.rotation.z = damp(bankG.rotation.z, targetBank, 6, dt);
      const pitchT = boostOn ? -0.16 : 0;
      rocket.body.rotation.x = Math.PI / 2 + damp((rocket.body.rotation.x - Math.PI / 2), pitchT, 4, dt);
      void dt;
    },

    checkPlanets() {
      let nearest = null, nearestD = Infinity;
      for (const p of PLANETS) {
        const d = this.pos.distanceTo(p.pos);
        if (p.id === 'forever' && typeof p.locked === 'function' && p.locked()) {
          p.setGlow(clamp(1 - d / (p.discoverRadius * 2), 0, 1) * 0.7);
          continue;
        }
        if (d < p.triggerRadius && d < nearestD) { nearest = p; nearestD = d; }
        const glowTarget = d < p.discoverRadius ? 1 : d < p.triggerRadius * 1.8 ? 0.55 : 0;
        p.setGlow(Math.max(glowTarget, p.glowTarget * (d < p.triggerRadius ? 1 : 0)));
        if (!p.discovered && d < p.discoverRadius) this.discover(p);
      }
      if (nearest !== state.interactTarget) {
        state.interactTarget = nearest;
        bus.emit('interactTarget', nearest);
      }

      const storyP = PLANETS.find(p => p.id === 'story');
      if (storyP && this.pos.distanceTo(storyP.pos) < storyP.triggerRadius + 12 && storyP.storyNodes) {
        let node = null, nd = 5.2;
        for (const n of storyP.storyNodes) {
          n.obj.getWorldPosition(tmpV);
          const d = this.pos.distanceTo(tmpV);
          if (d < nd) { nd = d; node = n; }
        }
        if (node !== this.storyNearNode) {
          this.storyNearNode = node;
          emit('storyNode', node ? { entry: node.entry, node } : null);
        }
      } else if (this.storyNearNode) {
        this.storyNearNode = null;
        emit('storyNode', null);
      }
    },

    discover(p) {
      p.discovered = true;
      state.discovered.add(p.id);
      p.celebrate();
      audio.discover();
      emit('discover', p);
    },

    checkEggs() {
      for (const egg of EGGS) {
        if (egg.found) continue;
        if (this.pos.distanceTo(egg.obj.position) < egg.radius) {
          egg.found = true;
          state.secrets.add(egg.id);
          audio.secret();
          emit('secret', egg);
        }
      }
    },

    tryInteract() {
      if (state.mode !== 'play' || !state.interactTarget) return;
      const p = state.interactTarget;
      if (p.id === 'forever' && p.locked && p.locked()) return;
      audio.click();
      if (p.id === 'forever') {
        state.interactTarget = null;
        bus.emit('interactTarget', null);
        emit('finaleStart');
        return;
      }
      this.enterOrbit(p);
    },

    enterOrbit(p) {
      if (this._orbiting) return;
      this._orbiting = true;
      input.interactPressed = false;
      state.mode = 'cinematic';
      state.interactTarget = null;
      bus.emit('interactTarget', null);

      const dir = tmpV.copy(this.pos).sub(p.pos).setY(0).normalize();
      if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
      const orbitPoint = p.pos.clone().addScaledVector(dir, p.radius + 7.5);
      orbitPoint.y = p.pos.y + 2;

      const startPos = this.pos.clone();
      const startYaw = this.yaw;
      const toPlanet = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      let dy = toPlanet - startYaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;

      const cinePos = p.pos.clone().addScaledVector(dir, p.radius * 2.7);
      cinePos.y = p.pos.y + p.radius * 1.05;
      cameraRigRef.beginCinematic(cinePos, p.pos.clone());

      audio.whoosh();
      const h = tweenVal(0, 1, 1.9, k => {
        const e = 1 - Math.pow(1 - k, 3);
        this.pos.lerpVectors(startPos, orbitPoint, e);
        this.yaw = startYaw + dy * e;
        rocket.group.position.copy(this.pos);
        rocket.group.rotation.y = this.yaw;
        rocket.update(0.016, 0.5 + e * 0.4);
        rocket.parts.engineCore.getWorldPosition(tmpV);
        rocket.emit(tmpV, this.forward(tmpF), 0.6, 0.016);
        rocket.updateTrail(0.016);
      }, () => {
        this._orbiting = false;
        this.speed = 0;
        this.thrSm = 0.12;
        audio.land();
        state.mode = 'panel';
        cameraRigRef.openPanelOrbit(p);
        emit('openPanel', p);
      });
      activeTween = h;
    },

    exitOrbit() {
      if (activeTween) { activeTween.cancelled = true; this._orbiting = false; }
      emit('closePanel');
      cameraRigRef.endCinematic();
      setTimeout(() => { if (state.mode === 'panel' || state.mode === 'cinematic') state.mode = 'play'; }, 120);
    }
  };

  const cameraRigRef = cameraRig;

  let activeTween = null;

  function tweenVal(from, to, durMs, onUpdate, onDone) {
    const start = performance.now();
    const h = { cancelled: false };
    function step(now) {
      if (h.cancelled) return;
      const k = Math.min(1, (now - start) / durMs);
      onUpdate(from + (to - from) * k);
      if (k < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
    return h;
  }

  void activeTween;
  return player;
}
