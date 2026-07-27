// 程序化绘制的随机太空元素（漂浮装饰）：纯 Graphics 无滤镜，性能友好
import * as PIXI from 'pixi.js';

const C = {
  cyan: 0x8be9fd, pink: 0xff79c6, purple: 0xbd93f9, green: 0x50fa7b,
  orange: 0xffb86c, gold: 0xffd866, white: 0xffffff, red: 0xff5577,
  silver: 0xc8d0e0, blue: 0x6ab7ff, rust: 0xd9663a, earthBlue: 0x3a7bd5,
  earthGreen: 0x4caf50, moon: 0xcfd2da, pigPink: 0xff9ec4,
};

function gRocket() {
  const c = new PIXI.Container();
  const body = new PIXI.Graphics();
  body.roundRect(-14, -28, 28, 50, 14).fill({ color: C.silver, alpha: 0.95 });
  body.roundRect(-14, -28, 28, 50, 14).stroke({ width: 2, color: C.cyan, alpha: 0.6 });
  const nose = new PIXI.Graphics();
  nose.moveTo(0, -44).lineTo(-14, -28).lineTo(14, -28).closePath().fill({ color: C.red, alpha: 0.95 });
  const finL = new PIXI.Graphics();
  finL.moveTo(-14, -2).lineTo(-26, 18).lineTo(-14, 14).closePath().fill({ color: C.red, alpha: 0.9 });
  const finR = new PIXI.Graphics();
  finR.moveTo(14, -2).lineTo(26, 18).lineTo(14, 14).closePath().fill({ color: C.red, alpha: 0.9 });
  const win = new PIXI.Graphics();
  win.circle(0, -8, 8).fill({ color: C.blue, alpha: 0.95 });
  win.circle(0, -8, 8).stroke({ width: 2, color: C.white, alpha: 0.7 });
  const flame = new PIXI.Graphics();
  flame.moveTo(-9, 22).lineTo(0, 44).lineTo(9, 22).closePath().fill({ color: C.orange, alpha: 0.85 });
  flame.blendMode = 'add';
  c.addChild(flame, body, nose, finL, finR, win);
  c._flame = flame;
  return c;
}

function gAlien() {
  const c = new PIXI.Container();
  const b = new PIXI.Graphics();
  b.ellipse(0, 0, 22, 26).fill({ color: C.green, alpha: 0.95 });
  b.ellipse(0, 0, 22, 26).stroke({ width: 2, color: 0x2e8b57, alpha: 0.6 });
  const ant = new PIXI.Graphics();
  ant.moveTo(0, -26).lineTo(0, -38).stroke({ width: 2, color: C.green });
  ant.circle(0, -40, 4).fill({ color: C.pink });
  const eyeL = new PIXI.Graphics(); eyeL.circle(-8, -6, 7).fill({ color: C.white });
  const eyeR = new PIXI.Graphics(); eyeR.circle(8, -6, 7).fill({ color: C.white });
  const pL = new PIXI.Graphics(); pL.circle(-8, -4, 3).fill({ color: 0x111111 });
  const pR = new PIXI.Graphics(); pR.circle(8, -4, 3).fill({ color: 0x111111 });
  const mouth = new PIXI.Graphics();
  mouth.arc(0, 8, 8, 0, Math.PI).stroke({ width: 2, color: 0x1a1a1a });
  c.addChild(ant, b, eyeL, eyeR, pL, pR, mouth);
  return c;
}

function gMars() {
  const c = new PIXI.Container();
  const p = new PIXI.Graphics();
  p.circle(0, 0, 28).fill({ color: C.rust, alpha: 0.95 });
  p.circle(0, 0, 28).stroke({ width: 2, color: 0x8a3a1a, alpha: 0.6 });
  for (const [sx, sy, sr] of [[-10, -6, 5], [8, 4, 6], [-4, 12, 4], [12, -10, 3]]) {
    p.circle(sx, sy, sr).fill({ color: 0xa84a22, alpha: 0.7 });
  }
  c.addChild(p);
  return c;
}

function gEarth() {
  const c = new PIXI.Container();
  const p = new PIXI.Graphics();
  p.circle(0, 0, 28).fill({ color: C.earthBlue, alpha: 0.95 });
  p.circle(0, 0, 28).stroke({ width: 2, color: C.cyan, alpha: 0.6 });
  p.ellipse(-8, -4, 10, 7).fill({ color: C.earthGreen, alpha: 0.85 });
  p.ellipse(10, 6, 8, 6).fill({ color: C.earthGreen, alpha: 0.85 });
  p.ellipse(2, 12, 6, 4).fill({ color: C.earthGreen, alpha: 0.8 });
  c.addChild(p);
  return c;
}

function gSaucer() {
  const c = new PIXI.Container();
  const base = new PIXI.Graphics();
  base.ellipse(0, 4, 34, 12).fill({ color: C.silver, alpha: 0.95 });
  base.ellipse(0, 4, 34, 12).stroke({ width: 2, color: C.cyan, alpha: 0.6 });
  const dome = new PIXI.Graphics();
  dome.arc(0, 4, 16, Math.PI, 0).fill({ color: C.blue, alpha: 0.5 });
  dome.arc(0, 4, 16, Math.PI, 0).stroke({ width: 2, color: C.cyan, alpha: 0.7 });
  c.addChild(base, dome);
  for (const lx of [-22, -10, 2, 14, 22]) {
    const l = new PIXI.Graphics();
    l.circle(lx, 8, 2.2).fill({ color: C.gold, alpha: 0.95 });
    l.blendMode = 'add';
    c.addChild(l);
  }
  return c;
}

function gSatellite() {
  const c = new PIXI.Container();
  const body = new PIXI.Graphics();
  body.roundRect(-8, -8, 16, 16, 3).fill({ color: C.gold, alpha: 0.95 });
  body.roundRect(-8, -8, 16, 16, 3).stroke({ width: 1.5, color: C.orange, alpha: 0.7 });
  const panL = new PIXI.Graphics();
  panL.roundRect(-30, -6, 18, 12, 2).fill({ color: C.blue, alpha: 0.85 });
  panL.roundRect(-30, -6, 18, 12, 2).stroke({ width: 1, color: C.cyan, alpha: 0.7 });
  const panR = new PIXI.Graphics();
  panR.roundRect(12, -6, 18, 12, 2).fill({ color: C.blue, alpha: 0.85 });
  panR.roundRect(12, -6, 18, 12, 2).stroke({ width: 1, color: C.cyan, alpha: 0.7 });
  const ant = new PIXI.Graphics();
  ant.moveTo(0, -8).lineTo(0, -18).stroke({ width: 2, color: C.silver });
  ant.circle(0, -20, 2.5).fill({ color: C.red });
  c.addChild(panL, body, panR, ant);
  return c;
}

function gPig() {
  const c = new PIXI.Container();
  const tail = new PIXI.Graphics();
  tail.arc(20, 2, 6, -0.6, Math.PI * 1.2).stroke({ width: 2, color: C.pigPink });
  const body = new PIXI.Graphics();
  body.circle(0, 0, 22).fill({ color: C.pigPink, alpha: 0.95 });
  body.circle(0, 0, 22).stroke({ width: 2, color: 0xe070a0, alpha: 0.6 });
  const earL = new PIXI.Graphics();
  earL.moveTo(-14, -16).lineTo(-22, -26).lineTo(-8, -20).closePath().fill({ color: 0xff8ab8 });
  const earR = new PIXI.Graphics();
  earR.moveTo(14, -16).lineTo(22, -26).lineTo(8, -20).closePath().fill({ color: 0xff8ab8 });
  const snout = new PIXI.Graphics();
  snout.ellipse(0, 6, 10, 7).fill({ color: 0xff7da8 });
  const n1 = new PIXI.Graphics(); n1.circle(-4, 6, 1.8).fill({ color: 0x8a3a5a });
  const n2 = new PIXI.Graphics(); n2.circle(4, 6, 1.8).fill({ color: 0x8a3a5a });
  const eL = new PIXI.Graphics(); eL.circle(-8, -4, 3).fill({ color: 0x222222 });
  const eR = new PIXI.Graphics(); eR.circle(8, -4, 3).fill({ color: 0x222222 });
  c.addChild(tail, body, earL, earR, snout, n1, n2, eL, eR);
  return c;
}

function gComet() {
  const c = new PIXI.Container();
  const tail = new PIXI.Graphics();
  tail.moveTo(0, -8).lineTo(42, 0).lineTo(0, 8).closePath().fill({ color: C.cyan, alpha: 0.35 });
  tail.blendMode = 'add';
  const head = new PIXI.Graphics();
  head.circle(0, 0, 12).fill({ color: C.cyan, alpha: 0.25 });
  head.circle(0, 0, 8).fill({ color: C.white, alpha: 0.95 });
  head.blendMode = 'add';
  c.addChild(tail, head);
  c._tail = tail;
  return c;
}

function gMoon() {
  const c = new PIXI.Container();
  const m = new PIXI.Graphics();
  m.circle(0, 0, 24).fill({ color: C.moon, alpha: 0.9 });
  m.circle(0, 0, 24).stroke({ width: 2, color: 0x8a8f9a, alpha: 0.5 });
  for (const [sx, sy, sr] of [[-8, -4, 4], [6, 6, 5], [2, -10, 3], [10, -2, 2.5]]) {
    m.circle(sx, sy, sr).fill({ color: 0x9aa0ad, alpha: 0.6 });
  }
  c.addChild(m);
  return c;
}

const FACTORIES = [gRocket, gAlien, gMars, gEarth, gSaucer, gSatellite, gPig, gComet, gMoon];

export class SpaceProps {
  constructor() {
    this.container = new PIXI.Container();
    this.container.zIndex = -100;
    this.container.eventMode = 'none';
    this.items = [];
  }
  populate(w, h, count = 7) {
    for (let i = 0; i < count; i++) this.spawn(w, h, true);
  }
  spawn(w, h, anywhere = false) {
    const Factory = FACTORIES[Math.floor(Math.random() * FACTORIES.length)];
    const obj = Factory();
    const scale = 0.5 + Math.random() * 0.9;
    obj.scale.set(scale);
    const x = anywhere ? Math.random() * w : (Math.random() < 0.5 ? -60 : w + 60);
    const y = 50 + Math.random() * (h - 100);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const item = {
      obj, x, y,
      vx: dir * (0.015 + Math.random() * 0.04),
      vy: (Math.random() - 0.5) * 0.01,
      rot: (Math.random() - 0.5) * 0.0006,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: 2 + Math.random() * 5,
    };
    obj.position.set(x, y);
    obj.rotation = Math.random() * Math.PI * 2;
    obj.alpha = 0.55 + Math.random() * 0.35;
    this.container.addChild(obj);
    this.items.push(item);
  }
  update(dt, w, h) {
    for (const it of this.items) {
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.bobPhase += dt * 0.002;
      it.obj.position.set(it.x, it.y + Math.sin(it.bobPhase) * it.bobAmp);
      it.obj.rotation += it.rot * dt;
      if (it.obj._flame) {
        it.obj._flame.scale.set(0.8 + Math.random() * 0.5, 0.8 + Math.random() * 0.6);
        it.obj._flame.alpha = 0.7 + Math.random() * 0.3;
      }
      if (it.obj._tail) it.obj._tail.alpha = 0.25 + Math.random() * 0.2;
      const m = 80;
      if (it.x > w + m) it.x = -m;
      if (it.x < -m) it.x = w + m;
      if (it.y > h + m) it.y = -m;
      if (it.y < -m) it.y = h + m;
    }
  }
  resize(w, h) {
    for (const it of this.items) {
      if (it.x > w) it.x = w;
      if (it.y > h) it.y = h;
    }
  }
}
