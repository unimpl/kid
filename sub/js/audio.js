// Web Audio 合成引擎：音效 + 循环环境音乐(BGM)，无外部音频文件
// BGM：宇宙风和弦 pad + 低音 + 随机琶音铃音 + 延迟回声，约 30s 循环

const BGM_CHORDS = [
  { bass: 110.00, pad: [220.00, 261.63, 329.63, 392.00], scale: [220.00, 261.63, 329.63, 392.00, 440.00] }, // Am7
  { bass: 87.31,  pad: [174.61, 220.00, 261.63, 329.63], scale: [174.61, 220.00, 261.63, 329.63, 392.00] }, // Fmaj7
  { bass: 130.81, pad: [261.63, 329.63, 392.00, 493.88], scale: [261.63, 329.63, 392.00, 493.88, 587.33] }, // Cmaj7
  { bass: 98.00,  pad: [196.00, 246.94, 293.66, 392.00], scale: [196.00, 246.94, 293.66, 392.00, 440.00] }, // G
];
const BGM_CHORD_DUR = 7.5;

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.muted = false;
    this._noiseBuf = null;
    // BGM 状态
    this.bgmOn = true;
    this.bgmPlaying = false;
    this.bgmGain = null;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmNextTime = 0;
    this.bgmDelay = null;
  }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.45;
    this.master.connect(this.ctx.destination);
  }
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.bgmOn && !this.bgmPlaying && !this.muted) this.startBGM();
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.45;
    // 静音时暂停 BGM 调度省 CPU，恢复时续播
    if (this.muted) this.stopBGM();
    else if (this.bgmOn) this.startBGM();
    return this.muted;
  }
  toggleBGM() {
    this.bgmOn = !this.bgmOn;
    if (this.bgmOn && !this.muted) this.startBGM();
    else this.stopBGM();
    return this.bgmOn;
  }

  // ---------- BGM ----------
  startBGM() {
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.12;
    this.bgmGain.connect(this.master);
    // 延迟回声（简易混响）
    this.bgmDelay = this.ctx.createDelay(1.0);
    this.bgmDelay.delayTime.value = 0.34;
    const fb = this.ctx.createGain(); fb.gain.value = 0.38;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    this.bgmDelay.connect(fb).connect(lp).connect(this.bgmDelay);
    const wet = this.ctx.createGain(); wet.gain.value = 0.5;
    this.bgmDelay.connect(wet).connect(this.bgmGain);
    this._bgmWet = wet;

    this.bgmStep = 0;
    this.bgmNextTime = this.ctx.currentTime + 0.2;
    this.bgmTimer = setInterval(() => this.bgmSchedule(), 60);
  }
  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
    if (this.bgmGain) { try { this.bgmGain.disconnect(); } catch (e) {} this.bgmGain = null; }
    if (this.bgmDelay) { try { this.bgmDelay.disconnect(); } catch (e) {} this.bgmDelay = null; }
  }
  bgmSchedule() {
    if (!this.ctx) return;
    const ahead = 0.5;
    while (this.bgmNextTime < this.ctx.currentTime + ahead) {
      this.scheduleChord(this.bgmStep % BGM_CHORDS.length, this.bgmNextTime);
      this.bgmNextTime += BGM_CHORD_DUR;
      this.bgmStep++;
    }
  }
  scheduleChord(idx, t) {
    const chord = BGM_CHORDS[idx];
    const dur = BGM_CHORD_DUR;
    // 低音（长持续）
    this.bgmVoice(chord.bass, t, dur + 1.8, 'sine', 0.16, 0.6);
    this.bgmVoice(chord.bass * 2, t, dur + 1.8, 'triangle', 0.05, 0.6);
    // pad 和弦（慢起音 + 微失谐暖意）
    for (const f of chord.pad) {
      this.bgmVoice(f, t, dur + 1.0, 'sine', 0.07, 3.0);
      this.bgmVoice(f * 1.003, t, dur + 1.0, 'triangle', 0.04, 3.0);
    }
    // 琶音铃音（随机选音，送入延迟回声）
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const nt = t + i * (dur / steps) + 0.35;
      const note = chord.scale[Math.floor(Math.random() * chord.scale.length)] * 2;
      this.bgmVoice(note, nt, 3.2, 'triangle', 0.06, 0.005, true);
    }
  }
  bgmVoice(freq, start, dur, type, vol, attack, toReverb = false) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type; osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + attack);
    g.gain.setValueAtTime(vol, start + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(this.bgmGain);
    if (toReverb && this.bgmDelay) g.connect(this.bgmDelay);
    osc.start(start); osc.stop(start + dur + 0.05);
  }

  // ---------- 基础合成 ----------
  tone(freq, dur, type = 'sine', vol = 0.3, when = 0) {
    if (!this.ctx || !this.enabled || this.muted) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.03);
  }
  sweep(f1, f2, dur, type = 'sine', vol = 0.25) {
    if (!this.ctx || !this.enabled || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.03);
  }
  noiseSrc(dur, startAt) {
    if (startAt === undefined) startAt = this.ctx.currentTime;
    if (!this._noiseBuf) {
      const len = Math.floor(this.ctx.sampleRate * 2);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this._noiseBuf = buf;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf; src.loop = true;
    src.start(startAt); src.stop(startAt + dur + 0.05);
    return src;
  }
  applause(dur = 1.2, vol = 0.2) {
    if (!this.ctx || !this.enabled || this.muted) return;
    const t = this.ctx.currentTime;
    const src = this.noiseSrc(dur + 0.1, t);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.7;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + 0.12);
    env.gain.setValueAtTime(vol, t + dur - 0.25);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const trem = this.ctx.createGain(); trem.gain.value = 0.55;
    const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 22;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.45;
    lfo.connect(lfoGain).connect(trem.gain);
    src.connect(bp).connect(env).connect(trem).connect(this.master);
    lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  cheer(dur = 0.9, vol = 0.16) {
    if (!this.ctx || !this.enabled || this.muted) return;
    const t = this.ctx.currentTime;
    const src = this.noiseSrc(dur + 0.1, t);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.55);
    bp.frequency.exponentialRampToValueAtTime(1300, t + dur);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + dur * 0.5);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(env).connect(this.master);
  }
  bang(when, dur, vol) {
    const src = this.noiseSrc(dur + 0.05, this.ctx.currentTime + when);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'lowpass'; bp.frequency.value = 2200;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime + when;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.master);
  }
  firework() {
    if (!this.ctx || !this.enabled || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1500, t + 0.45);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.1, t + 0.4);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(og).connect(this.master);
    osc.start(t); osc.stop(t + 0.6);
    this.bang(0.5, 0.22, 0.2);
    for (let i = 0; i < 6; i++) this.bang(0.55 + Math.random() * 0.5, 0.06, 0.07);
  }
  sparkle() {
    [0, 1, 2, 3, 4].forEach((i) => this.tone(1200 + i * 220 + Math.random() * 60, 0.1, 'triangle', 0.09, i * 0.05));
  }
  celebrate(combo) {
    if (combo >= 5) { this.firework(); this.applause(1.3, 0.2); this.cheer(1.0, 0.16); }
    else if (combo >= 4) { this.applause(1.1, 0.18); this.cheer(0.8, 0.14); this.sparkle(); }
    else if (combo >= 3) { this.applause(0.9, 0.16); this.sparkle(); }
    else if (combo >= 2) { this.correct(); this.sparkle(); }
    else this.correct();
  }
  correct() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.22, i * 0.055));
    this.tone(1567.98, 0.28, 'sine', 0.12, 0.18);
  }
  wrong() {
    this.tone(196, 0.2, 'sawtooth', 0.18, 0);
    this.tone(146.83, 0.34, 'sawtooth', 0.16, 0.09);
  }
  click() { this.tone(880, 0.05, 'square', 0.1, 0); this.tone(1320, 0.04, 'square', 0.07, 0.02); }
  hover() { this.tone(660, 0.03, 'sine', 0.04, 0); }
  levelUp() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.24, 'triangle', 0.22, i * 0.08));
    this.sweep(400, 1600, 0.5, 'sine', 0.08);
  }
  gameOver() { [659.25, 523.25, 392, 261.63].forEach((f, i) => this.tone(f, 0.42, 'sine', 0.2, i * 0.2)); }
  victory() { [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.2, i * 0.12)); }
  tick() { this.tone(1200, 0.025, 'square', 0.04, 0); }
}
export const audio = new AudioEngine();
if (typeof window !== 'undefined') window.__audio = audio;
