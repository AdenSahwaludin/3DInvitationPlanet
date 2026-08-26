import { state } from './state.js';

let ctx = null, master = null, musicBus = null, sfxBus = null;
let engineNodes = null;
let musicTimer = null, nextChordTime = 0, chordIdx = 0, beatCount = 0;
let delaySend = null;

const CHORDS = [
  [48, 55, 64, 71, 74],
  [45, 52, 60, 67, 71],
  [41, 48, 57, 64, 69],
  [43, 50, 59, 62, 69]
];
const ARP_SCALE = [72, 74, 76, 79, 81, 84, 86, 88];

function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

export const audio = {
  ready: false,

  init() {
    if (ctx) { ctx.resume && ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = state.muted ? 0 : 1;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 20; comp.ratio.value = 6;
      master.connect(comp);
      comp.connect(ctx.destination);

      musicBus = ctx.createGain();
      musicBus.gain.value = 0.9;
      const musicLP = ctx.createBiquadFilter();
      musicLP.type = 'lowpass'; musicLP.frequency.value = 4200;
      musicBus.connect(musicLP);
      musicLP.connect(master);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = 1;
      sfxBus.connect(master);

      delaySend = ctx.createDelay(1);
      delaySend.delayTime.value = 0.29;
      const fb = ctx.createGain(); fb.gain.value = 0.34;
      const fbFilter = ctx.createBiquadFilter();
      fbFilter.type = 'lowpass'; fbFilter.frequency.value = 2400;
      delaySend.connect(fb); fb.connect(fbFilter); fbFilter.connect(delaySend);
      const delayOut = ctx.createGain(); delayOut.gain.value = 0.5;
      delaySend.connect(delayOut);
      delayOut.connect(musicBus);
      delayOut.connect(sfxBus);

      this.ready = true;
    } catch (e) { this.ready = false; }
  },

  setMuted(m) {
    state.muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.15);
  },

  startMusic() {
    if (!this.ready || musicTimer) return;
    nextChordTime = ctx.currentTime + 0.1;
    chordIdx = 0; beatCount = 0;
    musicTimer = setInterval(() => this._schedule(), 220);
  },

  _schedule() {
    if (!ctx) return;
    while (nextChordTime < ctx.currentTime + 0.8) {
      this._playChord(CHORDS[chordIdx % CHORDS.length], nextChordTime);
      for (let b = 0; b < 8; b++) {
        if (Math.random() < 0.62) {
          const t = nextChordTime + b * 0.5 + Math.random() * 0.06;
          const note = ARP_SCALE[(beatCount * 3 + b * 2 + (Math.random() * 3 | 0)) % ARP_SCALE.length];
          this._pluck(note, t, 0.05 + Math.random() * 0.04);
        }
      }
      this._bass(CHORDS[chordIdx % CHORDS.length][0] - 12, nextChordTime);
      nextChordTime += 4;
      chordIdx++;
      beatCount++;
    }
  },

  _playChord(notes, t) {
    notes.forEach((n, i) => {
      ['triangle', 'sine'].forEach((type, k) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = mtof(n);
        o.detune.value = (i - 2) * 3 + (k ? 4 : -4);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(k ? 0.028 : 0.036, t + 1.4);
        g.gain.setValueAtTime(k ? 0.028 : 0.036, t + 2.9);
        g.gain.linearRampToValueAtTime(0, t + 4.2);
        o.connect(g); g.connect(musicBus);
        o.start(t); o.stop(t + 4.3);
      });
    });
  },

  _pluck(note, t, vol = 0.06) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = mtof(note);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g);
    g.connect(musicBus);
    g.connect(delaySend);
    o.start(t); o.stop(t + 1.5);
  },

  _bass(note, t) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = mtof(note);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.3);
    g.gain.setTargetAtTime(0, t + 2.6, 0.5);
    o.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + 4);
  },

  engineStart() {
    if (!this.ready || engineNodes) return;
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 210; bp.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.value = 0;
    src.connect(bp); bp.connect(ng); ng.connect(master);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.value = 52;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 260;
    const og = ctx.createGain(); og.gain.value = 0;
    osc.connect(lp); lp.connect(og); og.connect(master);

    src.start(); osc.start();
    engineNodes = { src, osc, ng, og, bp };
  },

  engine(throttle) {
    if (!engineNodes || !ctx) return;
    const t = ctx.currentTime;
    const v = Math.pow(Math.max(0, Math.min(1, throttle)), 1.4);
    engineNodes.ng.gain.setTargetAtTime(v * 0.16 + 0.008, t, 0.12);
    engineNodes.og.gain.setTargetAtTime(v * 0.05, t, 0.12);
    engineNodes.bp.frequency.setTargetAtTime(180 + v * 420, t, 0.15);
    engineNodes.osc.frequency.setTargetAtTime(48 + v * 40, t, 0.15);
    engineNodes.src.playbackRate.setTargetAtTime(0.75 + v * 0.7, t, 0.15);
  },

  _noiseBurst(dur = 0.7, f0 = 400, f1 = 2400, vol = 0.25) {
    if (!this.ready) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(sfxBus);
    g.connect(delaySend);
    src.start();
  },

  _tone(freq, dur = 0.4, vol = 0.12, type = 'sine', when = 0, glide = 0) {
    if (!this.ready) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(sfxBus);
    g.connect(delaySend);
    o.start(t); o.stop(t + dur + 0.05);
  },

  whoosh() { this._noiseBurst(0.8, 300, 2600, 0.22); },
  boost() { this._noiseBurst(0.55, 500, 3200, 0.18); },
  click() { this._tone(880, 0.09, 0.07, 'triangle'); this._tone(1320, 0.07, 0.04, 'sine', 0.02); },
  land() { this._tone(120, 0.5, 0.14, 'sine', 0, 60); this._noiseBurst(0.35, 200, 90, 0.12); },
  discover() {
    [76, 79, 83, 88].forEach((n, i) => this._bell(mtof(n), i * 0.11));
  },
  success() {
    [72, 76, 79, 84, 88].forEach((n, i) => this._tone(mtof(n), 0.5, 0.09, 'sine', i * 0.09));
    this._noiseBurst(0.9, 800, 3600, 0.08);
  },
  secret() {
    [1800, 2400, 3100].forEach((f, i) => this._tone(f, 0.5, 0.05, 'sine', i * 0.08));
  },
  firework() {
    this._noiseBurst(0.5, 900, 150, 0.2);
    this._tone(300, 0.25, 0.1, 'sine', 0, 70);
  },
  _bell(freq, when = 0) {
    if (!this.ready) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const mod = ctx.createOscillator(); mod.type = 'sine'; mod.frequency.value = freq * 2.01;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(freq * 1.4, t);
    mg.gain.exponentialRampToValueAtTime(1, t + 0.9);
    mod.connect(mg);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 1.6);
    mg.connect(o.frequency);
    o.connect(g); g.connect(sfxBus); g.connect(delaySend);
    o.start(t); o.stop(t + 1.7);
    mod.start(t); mod.stop(t + 1.7);
  }
};
