import * as THREE from 'three';
import { state } from '../core/state.js';
import { input } from '../core/input.js';
import { clamp, damp, lerp } from '../core/tween.js';

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

export const cameraRig = {
  cam: null,
  dist: 16,
  distTarget: 16,
  yawOff: 0,
  pitchOff: 0,
  fov: 58,
  fovTarget: 58,
  cinePos: new THREE.Vector3(),
  cineLook: new THREE.Vector3(),
  panelPlanet: null,
  panelAngle: 0,
  curPos: new THREE.Vector3(),
  curLook: new THREE.Vector3(),
  shake: 0,

  init(camera) {
    this.cam = camera;
    this.cam.position.set(0, 6, -20);
    this.cam.lookAt(0, 2, 10);
    this.curPos.copy(this.cam.position);
    this.curLook.set(0, 2, 10);
  },

  snapBehindRocket(rocketPos, yaw) {
    tmpA.set(Math.sin(yaw), 0, Math.cos(yaw));
    this.curPos.copy(rocketPos).addScaledVector(tmpA, -this.dist).add(tmpB.set(0, this.dist * 0.42, 0));
    this.curLook.copy(rocketPos);
    this.cam.position.copy(this.curPos);
  },

  beginCinematic(pos, look) {
    this.cinePos.copy(pos);
    this.cineLook.copy(look);
  },

  tweenCinematic(pos, look) {
    this.cinePos.copy(pos);
    this.cineLook.copy(look);
  },

  endCinematic() {
    this.panelPlanet = null;
  },

  openPanelOrbit(planet) {
    this.panelPlanet = planet;
    this.panelAngle = Math.atan2(this.curPos.x - planet.pos.x, this.curPos.z - planet.pos.z);
  },

  update(dt, rocket, speedNorm, boostOn) {
    const cam = this.cam;

    this.distTarget = clamp(this.distTarget + input.zoomDelta, 13, 130);
    input.zoomDelta = 0;
    this.dist = damp(this.dist, this.distTarget, 3.5, dt);

    this.yawOff -= input.look.x;
    this.pitchOff = clamp(this.pitchOff + input.look.y, -0.45, 0.85);
    if (!input.dragging) {
      this.yawOff = damp(this.yawOff, 0, 1.4, dt);
      this.pitchOff = damp(this.pitchOff, 0, 1.4, dt);
    }
    input.look.x *= Math.exp(-dt * 12);
    input.look.y *= Math.exp(-dt * 12);

    const parallaxX = (input.cursor.x - 0.5) * 2.2;
    const parallaxY = (input.cursor.y - 0.5) * -1.2;

    let desired = tmpA, desiredLook = tmpB;

    if (state.mode === 'cinematic') {
      desired.copy(this.cinePos);
      desiredLook.copy(this.cineLook);
      this.curPos.lerp(desired, 1 - Math.exp(-dt * 2.2));
      this.curLook.lerp(desiredLook, 1 - Math.exp(-dt * 2.6));
    } else if (state.mode === 'panel' && this.panelPlanet) {
      const p = this.panelPlanet;
      this.panelAngle += dt * 0.14;
      const r = p.radius * 3.1;
      desired.set(p.pos.x + Math.sin(this.panelAngle) * r, p.pos.y + p.radius * 1.05, p.pos.z + Math.cos(this.panelAngle) * r);
      desiredLook.copy(p.pos);
      this.curPos.lerp(desired, 1 - Math.exp(-dt * 2.0));
      this.curLook.lerp(desiredLook, 1 - Math.exp(-dt * 2.4));
    } else {
      const yaw = rocket.yaw + this.yawOff;
      const pitch = 0.34 + this.pitchOff;
      desired.set(
        rocket.pos.x - Math.sin(yaw) * Math.cos(pitch) * this.dist,
        rocket.pos.y + Math.sin(pitch) * this.dist,
        rocket.pos.z - Math.cos(yaw) * Math.cos(pitch) * this.dist
      );
      desiredLook.set(
        rocket.pos.x + Math.sin(rocket.yaw) * 7,
        rocket.pos.y + 1.1 + parallaxY * 0.6,
        rocket.pos.z + Math.cos(rocket.yaw) * 7
      );
      desired.y += parallaxY;
      const lag = 1 - Math.exp(-dt * (state.mode === 'launching' ? 1.6 : 3.4));
      this.curPos.lerp(desired, lag);
      this.curLook.lerp(desiredLook, 1 - Math.exp(-dt * 5));

      const overviewK = clamp((this.dist - 60) / 60, 0, 1);
      if (overviewK > 0) desiredLook.lerp(rocket.pos.clone().lerp(new THREE.Vector3(0, 0, 0), 0.35 * overviewK), overviewK * 0.5);
    }

    this.shake = damp(this.shake, (speedNorm * 0.05 + (boostOn ? 0.05 : 0)), 4, dt);
    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;

    cam.position.copy(this.curPos);
    cam.position.x += sx; cam.position.y += sy;
    cam.lookAt(this.curLook);

    this.fovTarget = 58 + speedNorm * 9 + (boostOn ? 4 : 0);
    this.fov = damp(this.fov, this.fovTarget, 3, dt);
    if (Math.abs(cam.fov - this.fov) > 0.01) {
      cam.fov = this.fov;
      cam.updateProjectionMatrix();
    }
  },

  projectToScreen(worldVec, out) {
    tmpA.copy(worldVec).project(this.cam);
    out.x = (tmpA.x * 0.5 + 0.5) * innerWidth;
    out.y = (-tmpA.y * 0.5 + 0.5) * innerHeight;
    out.behind = tmpA.z > 1;
    return out;
  }
};

void lerp;
