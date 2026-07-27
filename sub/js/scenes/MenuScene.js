import * as PIXI from 'pixi.js';
import { createNeonText, createGlowButton, createPanel } from '../neon.js';
import { audio } from '../audio.js';
import { DIFFICULTIES } from '../levels.js';

const C = {
  cyan: 0x8be9fd, pink: 0xff79c6, purple: 0xbd93f9, green: 0x50fa7b,
  gold: 0xffd866, orange: 0xffb86c, white: 0xffffff,
};

export class MenuScene {
  constructor(game) {
    this.game = game;
    this.view = new PIXI.Container();
    this.view.sortableChildren = true;
    this.buttons = [];
    this.diffBtns = [];
    this.t = 0;
  }

  enter() {
    this.buttons = [];
    this.diffBtns = [];
    this.t = 0;
    const w = window.innerWidth, h = window.innerHeight;

    // 装饰性漂浮算式
    this.deco = new PIXI.Container();
    this.deco.zIndex = 1;
    this.decoItems = [];
    const decoTexts = ['7 − 2 = ?', '15 − 6 = ?', '9 − 4 = ?', '12 − 5 = ?', '8 − 3 = ?'];
    for (let i = 0; i < decoTexts.length; i++) {
      const d = createNeonText(decoTexts[i], { fontSize: 26, fontFamily: 'Orbitron', fontWeight: 500, glowColor: C.purple, glowSize: 8, glowAlpha: 0.4, fill: 0x9a8fd0 });
      d.alpha = 0.35;
      d._sx = Math.random() * w; d._sy = Math.random() * h;
      d._vx = (Math.random() - 0.5) * 0.25; d._vy = (Math.random() - 0.5) * 0.25;
      d._rot = (Math.random() - 0.5) * 0.3;
      d.position.set(d._sx, d._sy); d.rotation = d._rot;
      this.deco.addChild(d); this.decoItems.push(d);
    }
    this.view.addChild(this.deco);

    // 标题
    this.title = createNeonText('星际减法大冒险', {
      fontSize: Math.min(w * 0.085, 86), fontFamily: 'Orbitron', fontWeight: 900,
      glowColor: C.cyan, glowSize: 26, glowAlpha: 0.9, fill: 0xffffff, letterSpacing: 4,
    });
    this.title.zIndex = 10; this.view.addChild(this.title);

    // 副标题
    this.sub = createNeonText('小梧的宇宙数学之旅', {
      fontSize: Math.min(w * 0.038, 28), fontFamily: 'Baloo 2', fontWeight: 600,
      glowColor: C.pink, glowSize: 10, glowAlpha: 0.7, fill: 0xffd6f5,
    });
    this.sub.zIndex = 10; this.view.addChild(this.sub);

    // 难度选择
    this.diffLabel = createNeonText('选择难度', {
      fontSize: Math.min(w * 0.03, 22), fontFamily: 'Baloo 2', fontWeight: 700,
      glowColor: C.gold, glowSize: 6, glowAlpha: 0.6, fill: 0xffe9a8,
    });
    this.diffLabel.zIndex = 10; this.view.addChild(this.diffLabel);

    const diffNames = ['个位', '十位', '百位', '千位'];
    const btnW = Math.min(w * 0.18, 110), gap = 16;
    this.diffRowW = 4 * btnW + 3 * gap;
    for (let i = 0; i < 4; i++) {
      const b = createGlowButton(diffNames[i], {
        width: btnW, height: 56, fontSize: 22, radius: 28,
        glowColor: C.cyan, borderColor: C.cyan, fillColor: 0x150a36,
      });
      b.zIndex = 10;
      b._selected = false;
      b.on('pointertap', () => this.selectDifficulty(i));
      this.view.addChild(b);
      this.diffBtns.push(b);
      this.buttons.push(b);
    }

    // 开始按钮
    this.startBtn = createGlowButton('开始冒险', {
      width: Math.min(w * 0.6, 340), height: 86, fontSize: 36, radius: 43,
      glowColor: C.pink, borderColor: C.pink,
    });
    this.startBtn.zIndex = 10;
    this.startBtn.on('pointertap', () => { audio.click(); this.game.go('game'); });
    this.view.addChild(this.startBtn);
    this.buttons.push(this.startBtn);

    // 玩法提示面板
    const ph = Math.min(h * 0.14, 110);
    this.hintPanel = createPanel(Math.min(w * 0.82, 460), ph, { radius: 18, borderColor: C.green, glowColor: C.green, borderAlpha: 0.35, glowAlpha: 0.25 });
    this.hintPanel.zIndex = 10; this.view.addChild(this.hintPanel);
    this.hintText = createNeonText('点击能量球选择答案  ·  越快得分越高\n连击翻倍  ·  能量耗尽则任务结束', {
      fontSize: Math.min(w * 0.026, 19), fontFamily: 'Baloo 2', fontWeight: 600,
      glowColor: C.green, glowSize: 5, glowAlpha: 0.5, fill: 0x9dffc6, align: 'center',
    });
    this.hintText.zIndex = 11; this.view.addChild(this.hintText);

    // 静音按钮
    this.muteBtn = createGlowButton('♪', {
      width: 64, height: 64, fontSize: 28, radius: 32, glowColor: C.cyan, borderColor: C.cyan,
    });
    this.muteBtn.zIndex = 20;
    this.muteBtn.on('pointertap', () => {
      const muted = audio.toggleMute();
      this.muteBtn._txt.setText(muted ? '♪̸' : '♪');
    });
    this.view.addChild(this.muteBtn);
    this.buttons.push(this.muteBtn);
    // 音乐(BGM)开关
    this.musicBtn = createGlowButton('♫', {
      width: 64, height: 64, fontSize: 26, radius: 32, glowColor: C.purple, borderColor: C.purple,
    });
    this.musicBtn.zIndex = 20;
    this.musicBtn.on('pointertap', () => {
      const on = audio.toggleBGM();
      this.musicBtn._txt.setText(on ? '♫' : '♫̸');
    });
    this.view.addChild(this.musicBtn);
    this.buttons.push(this.musicBtn);
    this.muteBtn._txt.setText(audio.muted ? '♪̸' : '♪');
    this.musicBtn._txt.setText(audio.bgmOn ? '♫' : '♫̸');

    this.layout(w, h);
    // 默认选中当前难度
    let cur = DIFFICULTIES.findIndex((d) => d.id === (this.game.difficulty || DIFFICULTIES[0]).id);
    if (cur < 0) cur = 0;
    this.selectDifficulty(cur, true);
  }

  selectDifficulty(i, silent = false) {
    this.game.difficulty = DIFFICULTIES[i];
    this.diffBtns.forEach((b, j) => {
      const sel = j === i;
      b._selected = sel;
      b.recolor(sel ? C.gold : C.cyan, sel ? C.gold : C.cyan, sel ? 0x3a2a08 : 0x150a36);
    });
    if (!silent) audio.click();
  }

  layout(w, h) {
    const cx = w / 2, cy = h / 2;
    this._cx = cx; this._cy = cy; this._w = w; this._h = h;
    this.title.position.set(cx, cy - h * 0.24);
    this.sub.position.set(cx, cy - h * 0.24 + this.title.height * 0.5 + 36);
    this.diffLabel.position.set(cx, cy - h * 0.06);
    const btnW = this.diffBtns[0] ? this.diffBtns[0]._width : 110;
    const gap = 16;
    const totalW = 4 * btnW + 3 * gap;
    const startX = cx - totalW / 2 + btnW / 2;
    for (let i = 0; i < this.diffBtns.length; i++) {
      this.diffBtns[i].position.set(startX + i * (btnW + gap), cy - h * 0.06 + 42);
    }
    this.startBtn.position.set(cx, cy + h * 0.08);
    this.hintPanel.position.set(cx, cy + h * 0.20);
    this.hintText.position.set(cx, cy + h * 0.20);
    this.muteBtn.position.set(w - 52, 52);
    this.musicBtn.position.set(w - 128, 52);
  }

  exit() { this.view.removeChildren().forEach((c) => c.destroy({ children: true })); }

  resize(w, h) {
    this.view.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.enter();
  }

  update(dt) {
    this.t += dt;
    this.title.y = this._cy - this._h * 0.24 + Math.sin(this.t * 0.0018) * 7;
    this.sub.alpha = 0.65 + Math.sin(this.t * 0.003) * 0.3;
    for (const d of this.decoItems) {
      d._sx += d._vx * dt * 0.06; d._sy += d._vy * dt * 0.06;
      if (d._sx < -60) d._sx = this._w + 60;
      if (d._sx > this._w + 60) d._sx = -60;
      if (d._sy < -40) d._sy = this._h + 40;
      if (d._sy > this._h + 40) d._sy = -40;
      d.position.set(d._sx, d._sy);
      d.alpha = 0.25 + Math.sin(this.t * 0.001 + d._sx) * 0.15;
    }
    for (const b of this.buttons) {
      b._pulse += dt * 0.003;
      const breath = Math.sin(b._pulse) * 0.012;
      const target = (b._hover ? 1.06 : 1) * (b._selected ? 1.05 : 1) + breath;
      const cur = b.scale.x;
      b.scale.set(cur + (target - cur) * Math.min(1, dt * 0.012));
      b._glow.alpha = 0.4 + (b._hover ? 0.3 : 0) + (b._selected ? 0.3 : 0) + Math.sin(b._pulse * 1.3) * 0.08;
    }
  }
}
