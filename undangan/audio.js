// Musik latar prosedural (tanpa file audio) untuk undangan klasik.
// Pad lembut + petikan ala kotak musik, dimulai saat "Buka Undangan" diklik.
const CHORDS = [
  [261.63, 329.63, 392.00, 493.88], // Cmaj7
  [220.00, 261.63, 329.63, 392.00], // Am7
  [174.61, 220.00, 261.63, 349.23], // Fmaj7
  [196.00, 246.94, 293.66, 392.00]  // G6
];
const CHORD_LEN = 4.8;
const PLUCKS = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.5]; // pentatonik C

export class MusicBox {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.playing = false;
    this.timers = [];
  }

  start() {
    if (this.playing) return;
    try {
      if (!this.ctx) this.build();
      this.ctx.resume();
      this.playing = true;
      this.tick(true);
    } catch (e) {
      this.playing = false;
    }
  }

  stop() {
    this.playing = false;
    if (this.ctx) this.ctx.suspend();
  }

  build() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 3);

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2200;
    delay.connect(fb); fb.connect(damp); damp.connect(delay);

    this.fx = ctx.createGain();
    this.fx.gain.value = 0.5;
    this.fx.connect(delay);
    delay.connect(this.master);
    this.master.connect(ctx.destination);
    this.chordIdx = 0;
  }

  tick(first) {
    if (!this.playing) return;
    this.playChord(this.chordIdx % CHORDS.length, first ? 0.1 : 0.05);
    this.schedulePlucks();
    this.chordIdx++;
    this.timers.push(setTimeout(() => this.tick(false), CHORD_LEN * 1000));
  }

  playChord(notes, offset) {
    const ctx = this.ctx;
    const t = ctx.currentTime + offset;
    for (let i = 0; i < notes.length; i++) {
      const f = notes[i];
      for (const [type, det, g] of [['triangle', 0, 0.05], ['sine', 3, 0.035]]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = f * (1 + det / 1000);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(g, t + CHORD_LEN * 0.35);
        gain.gain.linearRampToValueAtTime(0.0001, t + CHORD_LEN * 1.05);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + CHORD_LEN * 1.1);
      }
    }
  }

  schedulePlucks() {
    let time = 0.3 + Math.random() * 0.6;
    while (time < CHORD_LEN - 0.4) {
      const f = PLUCKS[Math.floor(Math.random() * PLUCKS.length)];
      this.pluck(f, time);
      time += 0.45 + Math.random() * 0.9;
    }
  }

  pluck(freq, offset) {
    const ctx = this.ctx;
    const t = ctx.currentTime + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(gain);
    gain.connect(this.master);
    gain.connect(this.fx);
    osc.start(t);
    osc.stop(t + 1.7);
  }
}
