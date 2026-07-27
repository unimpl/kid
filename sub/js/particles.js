import * as PIXI from 'pixi.js';

// 前景粒子爆发（答对庆祝 / 结算彩屑）
export class ParticleBurst {
  constructor() {
    this.particles = [];
    this.container = new PIXI.Container();
    this.container.zIndex = 80;
  }
  emit(x, y, opts = {}) {
    const {
      count = 40, colors = [0x8be9fd, 0xff79c6, 0xbd93f9, 0x50fa7b, 0xffffff],
      speed = 6, life = 900, size = 6, gravity = 0.12,
      spread = Math.PI * 2, dir = -Math.PI / 2,
    } = opts;
    for (let i = 0; i < count; i++) {
      const g = new PIXI.Graphics();
      const color = colors[i % colors.length];
      const r = size * (0.4 + Math.random() * 0.9);
      g.circle(0, 0, r).fill({ color, alpha: 0.95 });
      g.blendMode = 'add';
      const angle = dir + (Math.random() - 0.5) * spread;
      const sp = speed * (0.35 + Math.random());
      const p = {
        g, x, y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        life, maxLife: life, gravity,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
      };
      this.container.addChild(g);
      this.particles.push(p);
    }
  }
  update(dt) {
    const f = dt * 0.06;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.container.removeChild(p.g);
        p.g.destroy();
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * f;
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.vx *= 0.992;
      p.rot += p.vr * f;
      const t = p.life / p.maxLife;
      p.g.position.set(p.x, p.y);
      p.g.rotation = p.rot;
      p.g.alpha = Math.max(0, t);
      p.g.scale.set(0.3 + t * 0.7);
    }
  }
  clear() {
    for (const p of this.particles) { this.container.removeChild(p.g); p.g.destroy(); }
    this.particles = [];
  }
}

// 浮动文字（得分弹出等）
export class FloatingText {
  constructor() {
    this.items = [];
    this.container = new PIXI.Container();
    this.container.zIndex = 90;
  }
  spawn(text, x, y, opts = {}) {
    const { color = 0x50fa7b, fontSize = 40, glowColor, dy = -120, life = 1000 } = opts;
    const t = createNeonTextLocal(text, { fontSize, glowColor: glowColor || color, glowSize: 10, fill: color, fontWeight: 800 });
    t.position.set(x, y);
    this.container.addChild(t);
    this.items.push({ obj: t, x, y, y0: y, dy, life, maxLife: life, t: 0 });
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const k = Math.min(1, it.t / it.life);
      const e = 1 - Math.pow(1 - k, 3);
      it.obj.position.set(it.x, it.y0 + it.dy * e);
      it.obj.alpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      it.obj.scale.set(0.6 + e * 0.5 + (k < 0.2 ? Math.sin(k / 0.2 * Math.PI) * 0.15 : 0));
      if (k >= 1) {
        this.container.removeChild(it.obj);
        it.obj.destroy({ children: true });
        this.items.splice(i, 1);
      }
    }
  }
  clear() {
    for (const it of this.items) { this.container.removeChild(it.obj); it.obj.destroy({ children: true }); }
    this.items = [];
  }
}

import { createNeonText as createNeonTextLocal } from './neon.js';
