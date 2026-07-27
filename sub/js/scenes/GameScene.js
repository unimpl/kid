import * as PIXI from 'pixi.js';
import { createNeonText, createAnswerOrb } from '../neon.js';
import { ParticleBurst, FloatingText } from '../particles.js';
import { audio } from '../audio.js';
import { DIFFICULTIES, buildStages, generateProblem } from '../levels.js';

const COLORS = {
  cyan: 0x8be9fd, pink: 0xff79c6, purple: 0xbd93f9, green: 0x50fa7b,
  orange: 0xffb86c, white: 0xffffff, red: 0xff5577, dim: 0x3a2a55,
};

export class GameScene {
  constructor(game) {
    this.game = game;
    this.view = new PIXI.Container();
    this.view.sortableChildren = true;
    this.burst = new ParticleBurst();
    this.floating = new FloatingText();
    this.timeouts = [];
  }

  enter() {
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.lives = 3;
    this.stageIndex = 0; this.qIndex = 0; this.totalCorrect = 0; this.totalAnswered = 0;
    this.phase = 'question';
    this.shakeT = 0; this.shakeAmp = 0;
    this.flash = null;
    this.timeouts = [];
    this.stages = buildStages(this.game.difficulty || DIFFICULTIES[0]);

    this.view.addChild(this.burst.container);
    this.view.addChild(this.floating.container);

    this.flashG = new PIXI.Graphics();
    this.flashG.zIndex = 70;
    this.view.addChild(this.flashG);

    this.buildHUD();
    this.startStage();
    this.layout(window.innerWidth, window.innerHeight);
  }

  buildHUD() {
    this.hud = new PIXI.Container();
    this.hud.zIndex = 40;
    // 计时条
    this.timerBg = new PIXI.Graphics();
    this.timerBar = new PIXI.Graphics();
    this.hud.addChild(this.timerBg, this.timerBar);
    // 分数
    this.scoreLabel = createNeonText('分数', { fontSize: 15, fontFamily: 'Baloo 2', fontWeight: 700, glowColor: COLORS.green, glowSize: 4, fill: 0x6affc0 });
    this.scoreText = createNeonText('0', { fontSize: 34, fontFamily: 'Orbitron', fontWeight: 800, glowColor: COLORS.green, glowSize: 9, fill: 0xb6ffd0 });
    this.comboText = createNeonText('', { fontSize: 22, fontFamily: 'Orbitron', fontWeight: 800, glowColor: COLORS.pink, glowSize: 7, fill: 0xff9ad6 });
    this.hud.addChild(this.scoreLabel, this.scoreText, this.comboText);
    // 关卡
    this.stageText = createNeonText('', { fontSize: 19, fontFamily: 'Baloo 2', fontWeight: 700, glowColor: COLORS.cyan, glowSize: 5, fill: 0xcfe9ff, align: 'center' });
    this.hud.addChild(this.stageText);
    // 能量(生命)
    this.energyLabel = createNeonText('能量', { fontSize: 15, fontFamily: 'Baloo 2', fontWeight: 700, glowColor: COLORS.red, glowSize: 4, fill: 0xff9a9a });
    this.energyOrbs = [];
    for (let i = 0; i < 3; i++) {
      const o = new PIXI.Graphics();
      this.energyOrbs.push(o);
      this.hud.addChild(o);
    }
    this.hud.addChild(this.energyLabel);
    this.view.addChild(this.hud);

    // 题目容器
    this.probLayer = new PIXI.Container();
    this.probLayer.zIndex = 30;
    const dd = (this.game.difficulty || DIFFICULTIES[0]).digits;
    const pfs = dd >= 4 ? 52 : dd >= 3 ? 66 : dd >= 2 ? 82 : 96;
    const pls = dd >= 3 ? 4 : 8;
    this.problemText = createNeonText('', {
      fontSize: pfs, fontFamily: 'Orbitron', fontWeight: 900, glowColor: COLORS.cyan,
      glowSize: 22, glowAlpha: 0.9, fill: 0xffffff, letterSpacing: pls,
    });
    this.probLayer.addChild(this.problemText);
    this.view.addChild(this.probLayer);

    // 答案容器
    this.optLayer = new PIXI.Container();
    this.optLayer.zIndex = 30;
    this.view.addChild(this.optLayer);
  }

  drawEnergyOrbs() {
    const r = 11;
    for (let i = 0; i < this.energyOrbs.length; i++) {
      const o = this.energyOrbs[i];
      o.clear();
      const alive = i < this.lives;
      const col = alive ? COLORS.red : COLORS.dim;
      if (alive) {
        o.circle(0, 0, r * 1.8).fill({ color: COLORS.red, alpha: 0.18 });
      }
      o.circle(0, 0, r).fill({ color: col, alpha: alive ? 0.95 : 0.5 });
      if (alive) o.circle(0, 0, r).stroke({ width: 2, color: 0xff8a8a, alpha: 0.9 });
    }
  }

  startStage() {
    const stage = this.stages[this.stageIndex];
    this.qIndex = 0;
    this.stageText.setText(`${stage.name}　·　第 ${this.stageIndex + 1}/${this.stages.length} 关`);
    if (this.stageIndex > 0) {
      audio.firework();
      this.burst.emit(this._cx || window.innerWidth / 2, window.innerHeight / 2, { count: 60, colors: [COLORS.cyan, COLORS.pink, COLORS.purple, COLORS.white], speed: 9, life: 1200, size: 8, gravity: 0.1, spread: Math.PI * 2 });
      this.floating.spawn('进入 ' + stage.name, this._cx || window.innerWidth / 2, window.innerHeight * 0.4, { color: COLORS.cyan, fontSize: 46, glowColor: COLORS.cyan, dy: -40, life: 1400 });
    }
    this.nextQuestion();
  }

  nextQuestion() {
    const stage = this.stages[this.stageIndex];
    if (this.qIndex >= stage.questions) {
      this.stageIndex++;
      if (this.stageIndex >= this.stages.length) { this.finish(true); return; }
      audio.levelUp();
      this.startStage();
      return;
    }
    this.current = generateProblem(stage);
    this.problemText.setText(`${this.current.a}   −   ${this.current.b}   =   ?`);
    this.renderOptions();
    this.timeLeft = stage.time;
    this.timeMax = stage.time;
    this.phase = 'question';
    this.layoutProblem();
  }

  renderOptions() {
    this.optLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.orbs = [];
    const w = window.innerWidth;
    const size = Math.max(50, Math.min(96, Math.floor(w * 0.12)));
    this._orbSize = size;
    this.current.options.forEach((opt, i) => {
      const orb = createAnswerOrb(opt, {
        size, glowColor: COLORS.cyan, borderColor: COLORS.cyan, fillColor: 0x140a33, textColor: 0xffffff,
        fontSize: Math.floor(size * 0.5), glowSize: 16,
      });
      orb.on('pointertap', () => this.onAnswer(i, orb));
      orb._entrance = { delay: i * 90, t: 0 };
      orb.scale.set(0);
      orb.alpha = 0;
      this.optLayer.addChild(orb);
      this.orbs.push(orb);
    });
  }

  onAnswer(i, orb) {
    if (this.phase !== 'question') return;
    this.phase = 'feedback';
    this.totalAnswered++;
    const correct = this.current.options[i] === this.current.answer;
    if (correct) {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.totalCorrect++;
      const gain = Math.round((100 + Math.max(0, this.timeLeft) * 8) * (1 + (this.combo - 1) * 0.25));
      this.score += gain;
      audio.celebrate(this.combo);
      const wx = orb.x + this.optLayer.x;
      const wy = orb.y + this.optLayer.y;
      this.burst.emit(wx, wy, { count: 54, colors: [COLORS.green, COLORS.cyan, COLORS.white, COLORS.pink], speed: 9, life: 950, size: 7, gravity: 0.18, spread: Math.PI * 2 });
      this.floating.spawn(`+${gain}`, wx, wy - this._orbSize, { color: COLORS.green, fontSize: 42, glowColor: COLORS.green, dy: -110, life: 950 });
      if (this.combo >= 2) this.floating.spawn(`连击 x${this.combo}`, this._cx, this._cy + this._h * 0.05, { color: COLORS.pink, fontSize: 30, glowColor: COLORS.pink, dy: -60, life: 900 });
      this.flashColor(COLORS.green, 0.16, 600);
      this.markOrb(orb, 'correct');
      this.updateHUD();
      this.qIndex++;
      this.addTimeout(() => this.nextQuestion(), 950);
    } else {
      this.combo = 0;
      this.lives--;
      audio.wrong();
      this.shake(14, 420);
      this.flashColor(COLORS.red, 0.3, 500);
      this.markOrb(orb, 'wrong');
      const ci = this.current.options.indexOf(this.current.answer);
      if (ci >= 0 && this.orbs[ci]) this.markOrb(this.orbs[ci], 'reveal');
      this.updateHUD();
      if (this.lives <= 0) {
        this.addTimeout(() => this.finish(false), 1400);
      } else {
        this.addTimeout(() => this.nextQuestion(), 1500);
      }
    }
  }

  markOrb(orb, state) {
    orb._state = state;
    orb._hover = false;
    orb.eventMode = 'none';
    if (state === 'correct') {
      orb.recolor(COLORS.green, 0x0a2a18, COLORS.green, 1);
      orb._scaleT = 1.18;
      this.burst.emit(orb.x + this.optLayer.x, orb.y + this.optLayer.y, { count: 16, colors: [COLORS.green, COLORS.white], speed: 4, life: 600, size: 4, gravity: 0, spread: Math.PI * 2 });
    } else if (state === 'wrong') {
      orb.recolor(COLORS.red, 0x2a0a12, COLORS.red, 0.9);
      orb._scaleT = 0.8;
    } else if (state === 'reveal') {
      orb.recolor(COLORS.green, 0x0a2a18, COLORS.green, 0.8);
      orb._scaleT = 1.1;
    }
  }

  flashColor(color, alpha, dur) {
    this.flash = { color, alpha, t: 0, dur };
  }

  shake(amp, dur) {
    this.shakeAmp = amp;
    this.shakeT = dur;
    this.shakeDur = dur;
  }

  updateHUD() {
    this.scoreText.setText(String(this.score));
    this.comboText.setText(this.combo >= 2 ? `连击 x${this.combo}` : '');
    this.drawEnergyOrbs();
    this.layoutHUD();
  }

  finish(won) {
    this.phase = 'done';
    if (won) { audio.victory(); audio.firework(); } else audio.gameOver();
    this.clearTimeouts();
    this.game.go('result', {
      score: this.score, maxCombo: this.maxCombo,
      correct: this.totalCorrect, total: this.totalAnswered,
      won, stageReached: this.stageIndex + (won ? this.stages.length : 0),
      diffName: (this.game.difficulty || DIFFICULTIES[0]).name,
    });
  }

  addTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    this.timeouts.push(id);
  }
  clearTimeouts() {
    this.timeouts.forEach((id) => clearTimeout(id));
    this.timeouts = [];
  }

  layout(w, h) {
    this._w = w; this._h = h; this._cx = w / 2; this._cy = h / 2;
    this.layoutHUD();
    this.layoutProblem();
  }

  layoutHUD() {
    const w = this._w;
    // 计时条
    const barW = w * 0.5;
    const barX = (w - barW) / 2;
    const barY = 22;
    this.timerBg.clear();
    this.timerBg.roundRect(barX, barY, barW, 7, 3.5).fill({ color: 0xffffff, alpha: 0.08 });
    this.timerBg.roundRect(barX, barY, barW, 7, 3.5).stroke({ width: 1, color: COLORS.cyan, alpha: 0.3 });
    this._barX = barX; this._barW = barW; this._barY = barY;
    // 分数 左
    this.scoreLabel.position.set(44, 50);
    this.scoreText.position.set(44, 84);
    this.scoreText.anchor.set(0, 0.5);
    this.scoreLabel.anchor.set(0, 0.5);
    this.comboText.position.set(44, 116);
    this.comboText.anchor.set(0, 0.5);
    // 关卡 中
    this.stageText.position.set(w / 2, 52);
    // 能量 右
    this.energyLabel.position.set(w - 44, 50);
    this.energyLabel.anchor.set(1, 0.5);
    for (let i = 0; i < this.energyOrbs.length; i++) {
      this.energyOrbs[i].position.set(w - 50 - i * 30, 84);
    }
  }

  layoutProblem() {
    if (!this.problemText) return;
    this.problemText.position.set(this._cx, this._cy - this._h * 0.1);
    // 选项布局
    if (!this.orbs) return;
    const size = this._orbSize || 80;
    const gap = size * 0.7;
    const w = this._w;
    const rowW = 4 * size * 2 + 3 * gap;
    const useRow = rowW < w * 0.92;
    const cols = useRow ? 4 : 2;
    const rows = useRow ? 1 : 2;
    const totalW = cols * size * 2 + (cols - 1) * gap;
    const totalH = rows * size * 2 + (rows - 1) * gap;
    const startX = this._cx - totalW / 2 + size;
    const startY = this._cy + this._h * 0.12 - totalH / 2 + size;
    for (let i = 0; i < this.orbs.length; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const ox = startX + c * (size * 2 + gap);
      const oy = startY + r * (size * 2 + gap);
      this.orbs[i]._tx = ox;
      this.orbs[i]._ty = oy;
      this.orbs[i].position.set(ox, oy);
    }
  }

  update(dt) {
    this.burst.update(dt);
    this.floating.update(dt);
    // 计时
    if (this.phase === 'question') {
      this.timeLeft -= dt / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.timeout();
      } else if (this.timeLeft < 3.5 && Math.floor(this.timeLeft * 2) !== this._lastTick) {
        this._lastTick = Math.floor(this.timeLeft * 2);
        audio.tick();
      }
    }
    this.drawTimer();
    // 能量球动画
    if (this.orbs) {
      for (const orb of this.orbs) {
        // 入场
        if (orb._entrance) {
          orb._entrance.t += dt;
          if (orb._entrance.t > orb._entrance.delay) {
            const k = Math.min(1, (orb._entrance.t - orb._entrance.delay) / 320);
            const e = 1 - Math.pow(1 - k, 4);
            orb.alpha = e;
            const overshoot = k < 1 ? (1.15 - 0.15 * (1 - e)) : 1;
            orb.scale.set(e * 1.12);
            if (k >= 1) { orb._entrance = null; orb.scale.set(1); }
          }
        } else {
          orb._pulse += dt * 0.004;
          const breath = Math.sin(orb._pulse) * 0.02;
          const hover = orb._hover ? 1.08 : 1;
          const target = (orb._scaleT || hover) + breath;
          const cur = orb.scale.x;
          orb.scale.set(cur + (target - cur) * Math.min(1, dt * 0.014));
          orb._glow.alpha = 0.6 + (orb._hover ? 0.3 : 0) + Math.sin(orb._pulse * 1.2) * 0.1;
        }
      }
    }
    // 闪屏
    if (this.flash) {
      this.flash.t += dt;
      const k = Math.min(1, this.flash.t / this.flash.dur);
      const a = this.flash.alpha * (1 - k);
      this.flashG.clear();
      this.flashG.rect(0, 0, this._w, this._h).fill({ color: this.flash.color, alpha: a });
      if (k >= 1) { this.flash = null; this.flashG.clear(); }
    }
    // 震屏
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const k = Math.max(0, this.shakeT / this.shakeDur);
      const amp = this.shakeAmp * k * k;
      this.view.x = (Math.random() - 0.5) * amp;
      this.view.y = (Math.random() - 0.5) * amp;
      if (this.shakeT <= 0) { this.view.position.set(0, 0); }
    }
  }

  timeout() {
    if (this.phase !== 'question') return;
    this.phase = 'feedback';
    this.combo = 0;
    this.lives--;
    audio.wrong();
    this.shake(12, 380);
    this.flashColor(COLORS.red, 0.26, 500);
    this.floating.spawn('超时!', this._cx, this._cy - this._h * 0.1 + 80, { color: COLORS.orange, fontSize: 40, glowColor: COLORS.orange, dy: -70, life: 1000 });
    const ci = this.current.options.indexOf(this.current.answer);
    if (ci >= 0 && this.orbs[ci]) this.markOrb(this.orbs[ci], 'reveal');
    this.updateHUD();
    if (this.lives <= 0) this.addTimeout(() => this.finish(false), 1400);
    else this.addTimeout(() => this.nextQuestion(), 1500);
  }

  drawTimer() {
    if (!this.timeMax) return;
    const ratio = Math.max(0, this.timeLeft / this.timeMax);
    const fillW = this._barW * ratio;
    let col = COLORS.green;
    if (ratio < 0.5) col = COLORS.orange;
    if (ratio < 0.25) col = COLORS.red;
    this.timerBar.clear();
    if (fillW > 1) {
      this.timerBar.roundRect(this._barX, this._barY, fillW, 7, 3.5).fill({ color: col, alpha: 0.9 });
      this.timerBar.roundRect(this._barX, this._barY, fillW, 7, 3.5).fill({ color: col, alpha: 0.4 });
    }
  }

  resize(w, h) {
    this.layout(w, h);
  }

  exit() {
    this.clearTimeouts();
    this.burst.clear();
    this.floating.clear();
    this.view.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.view.position.set(0, 0);
  }
}
