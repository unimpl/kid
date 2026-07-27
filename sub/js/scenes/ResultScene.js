import * as PIXI from 'pixi.js';
import { createNeonText, createGlowButton, createPanel } from '../neon.js';
import { ParticleBurst } from '../particles.js';
import { audio } from '../audio.js';

const COLORS = {
  cyan: 0x8be9fd, pink: 0xff79c6, purple: 0xbd93f9, green: 0x50fa7b,
  orange: 0xffb86c, gold: 0xffd866, white: 0xffffff, dim: 0x3a2a55,
};

function drawStar(g, outer, color, alpha = 1, glow = false) {
  const inner = outer * 0.46;
  const points = 5;
  const step = Math.PI / points;
  g.clear();
  g.moveTo(0, -outer);
  for (let i = 0; i < points; i++) {
    g.lineTo(Math.cos(-Math.PI / 2 + step * (2 * i + 1)) * inner, Math.sin(-Math.PI / 2 + step * (2 * i + 1)) * inner);
    g.lineTo(Math.cos(-Math.PI / 2 + step * (2 * i + 2)) * outer, Math.sin(-Math.PI / 2 + step * (2 * i + 2)) * outer);
  }
  g.closePath();
  g.fill({ color, alpha });
  g.stroke({ width: 2, color, alpha: alpha * 0.6 });
}

export class ResultScene {
  constructor(game) {
    this.game = game;
    this.view = new PIXI.Container();
    this.view.sortableChildren = true;
    this.burst = new ParticleBurst();
    this.buttons = [];
    this.t = 0;
  }

  enter(data) {
    this.data = data || {};
    this.buttons = [];
    this.t = 0;
    this.confettiT = 0;
    this.view.addChild(this.burst.container);

    const d = this.data;
    const accuracy = d.total > 0 ? d.correct / d.total : 0;
    let stars;
    if (d.won) stars = accuracy >= 0.9 ? 3 : accuracy >= 0.75 ? 2 : 1;
    else stars = accuracy >= 0.6 ? 1 : 0;
    this.stars = stars;

    const w = window.innerWidth, h = window.innerHeight;
    const cx = w / 2, cy = h / 2;

    // 面板
    const panelW = Math.min(w * 0.86, 520);
    const panelH = Math.min(h * 0.74, 560);
    this.panel = createPanel(panelW, panelH, { radius: 28, borderColor: d.won ? COLORS.gold : COLORS.purple, glowColor: d.won ? COLORS.gold : COLORS.purple, glowAlpha: 0.3, borderAlpha: 0.5 });
    this.panel.position.set(cx, cy);
    this.panel.zIndex = 10;
    this.view.addChild(this.panel);

    // 标题
    this.title = createNeonText(d.won ? '闯关成功' : '任务结束', {
      fontSize: Math.min(w * 0.08, 64), fontFamily: 'Orbitron', fontWeight: 900,
      glowColor: d.won ? COLORS.gold : COLORS.pink, glowSize: 22, fill: 0xffffff, letterSpacing: 4,
    });
    this.title.zIndex = 12;
    this.view.addChild(this.title);

    // 星级
    this.starRow = new PIXI.Container();
    this.starRow.zIndex = 12;
    this.starsArr = [];
    for (let i = 0; i < 3; i++) {
      const c = new PIXI.Container();
      const empty = new PIXI.Graphics();
      drawStar(empty, 30, COLORS.dim, 0.6);
      const full = new PIXI.Graphics();
      drawStar(full, 32, COLORS.gold, 1);
      full.filters = [new PIXI.BlurFilter(10, 1)];
      full.alpha = 0.8;
      const core = new PIXI.Graphics();
      drawStar(core, 30, COLORS.gold, 1);
      c.addChild(empty, full, core);
      c._full = full; c._core = core;
      c.scale.set(0);
      this.starRow.addChild(c);
      this.starsArr.push(c);
    }
    this.view.addChild(this.starRow);

    // 分数
    this.scoreLabel = createNeonText('最终分数', { fontSize: 18, fontFamily: 'Baloo 2', fontWeight: 600, glowColor: COLORS.green, glowSize: 5, fill: 0x9dffc6 });
    this.scoreVal = createNeonText(String(d.score || 0), { fontSize: 64, fontFamily: 'Orbitron', fontWeight: 900, glowColor: COLORS.green, glowSize: 16, fill: 0xb6ffd0 });
    this.view.addChild(this.scoreLabel, this.scoreVal);

    // 统计行
  const accPct = Math.round(accuracy * 100);
  this.stats = createNeonText(
      `${d.diffName ? d.diffName + '  ·  ' : ''}最高连击  ${d.maxCombo || 0}     ·     正确率  ${accPct}%     ·     答对  ${d.correct || 0}/${d.total || 0}`,
      { fontSize: Math.min(w * 0.032, 22), fontFamily: 'Baloo 2', fontWeight: 600, glowColor: COLORS.cyan, glowSize: 5, fill: 0xcfe9ff },
    );
  this.view.addChild(this.stats);

    // 按钮
    this.againBtn = createGlowButton('再来一次', { width: Math.min(w * 0.42, 230), height: 70, fontSize: 28, radius: 35, glowColor: COLORS.pink, borderColor: COLORS.pink });
    this.againBtn.on('pointertap', () => { audio.click(); this.game.go('game'); });
    this.menuBtn = createGlowButton('主菜单', { width: Math.min(w * 0.42, 230), height: 70, fontSize: 28, radius: 35, glowColor: COLORS.cyan, borderColor: COLORS.cyan });
    this.menuBtn.on('pointertap', () => { audio.click(); this.game.go('menu'); });
    this.view.addChild(this.againBtn, this.menuBtn);
    this.buttons.push(this.againBtn, this.menuBtn);

    this.layout(w, h);

    // 庆祝
    if (d.won) {
      this.confettiActive = true;
      for (let i = 0; i < 4; i++) {
        this.addTimeout(() => this.confettiBurst(), i * 220);
      }
    }
    // 星星依次点亮
    this.starsArr.forEach((s, i) => {
      if (i < stars) {
        this.addTimeout(() => {
          s._popping = true; s._popT = 0;
          audio.click();
          this.burst.emit(s.getGlobalPosition().x, s.getGlobalPosition().y, { count: 18, colors: [COLORS.gold, COLORS.white, COLORS.orange], speed: 5, life: 700, size: 5, gravity: 0.1, spread: Math.PI * 2 });
        }, 500 + i * 280);
      }
    });
  }

  confettiBurst() {
    const w = window.innerWidth;
    const colors = [COLORS.gold, COLORS.cyan, COLORS.pink, COLORS.purple, COLORS.green, COLORS.white];
    for (let i = 0; i < 30; i++) {
      this.addTimeout(() => {
        this.burst.emit(Math.random() * w, -20, { count: 6, colors, speed: 4, life: 1800, size: 6, gravity: 0.22, spread: Math.PI * 0.6, dir: Math.PI / 2 });
      }, i * 40);
    }
  }

  layout(w, h) {
    this._w = w; this._h = h;
    const cx = w / 2, cy = h / 2;
    this.title.position.set(cx, cy - h * 0.22);
    this.starRow.position.set(cx, cy - h * 0.08);
    const sp = 90;
    for (let i = 0; i < 3; i++) this.starsArr[i].position.set((i - 1) * sp, 0);
    this.scoreLabel.position.set(cx, cy + h * 0.02);
    this.scoreVal.position.set(cx, cy + h * 0.07);
    this.stats.position.set(cx, cy + h * 0.16);
    const by = cy + h * 0.25;
    this.againBtn.position.set(cx - (this.againBtn._width / 2) - 12, by);
    this.menuBtn.position.set(cx + (this.menuBtn._width / 2) + 12, by);
  }

  update(dt) {
    this.t += dt;
    this.burst.update(dt);
    // 持续彩屑
    if (this.confettiActive) {
      this.confettiT += dt;
      if (this.confettiT > 600) {
        this.confettiT = 0;
        this.confettiBurst();
      }
      if (this.t > 5000) this.confettiActive = false;
    }
    // 星星弹出
    for (const s of this.starsArr) {
      if (s._popping) {
        s._popT += dt;
        const k = Math.min(1, s._popT / 360);
        const e = k < 0.6 ? (k / 0.6) * 1.25 : 1.25 - 0.25 * ((k - 0.6) / 0.4);
        s.scale.set(e);
        s._full.alpha = 0.6 + Math.sin(this.t * 0.006) * 0.3;
        if (k >= 1) { s._popping = false; s.scale.set(1); }
      }
    }
    // 按钮
    for (const b of this.buttons) {
      b._pulse += dt * 0.003;
      const breath = Math.sin(b._pulse) * 0.012;
      const target = (b._hover ? 1.06 : 1) + breath;
      const cur = b.scale.x;
      b.scale.set(cur + (target - cur) * Math.min(1, dt * 0.012));
      b._glow.alpha = 0.45 + (b._hover ? 0.35 : 0) + Math.sin(b._pulse * 1.3) * 0.08;
    }
    // 标题浮动
    this.title.y = this._h / 2 - this._h * 0.22 + Math.sin(this.t * 0.002) * 5;
  }

  timeouts = [];
  addTimeout(fn, ms) { this.timeouts.push(setTimeout(fn, ms)); }

  exit() {
    this.timeouts.forEach((id) => clearTimeout(id));
    this.timeouts = [];
    this.burst.clear();
    this.confettiActive = false;
    this.view.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  resize(w, h) {
    this.view.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.burst = new ParticleBurst();
    this.enter(this.data);
  }
}
