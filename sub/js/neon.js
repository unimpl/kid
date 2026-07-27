import * as PIXI from 'pixi.js';

export function intToCss(n) {
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgb(${r},${g},${b})`;
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 霓虹文字：模糊光晕 + 锐利核心
export function createNeonText(text, opts = {}) {
  const {
    fontSize = 64, fontFamily = 'Orbitron', fontWeight = 700,
    fill = 0xffffff, glowColor = 0x8be9fd, glowSize = 12, glowAlpha = 0.85,
    letterSpacing = 0, align = 'center', stroke, strokeThickness = 0,
  } = opts;
  const c = new PIXI.Container();
  const baseStyle = { fontFamily, fontSize, fontWeight, fill, letterSpacing, align };
  if (stroke) { baseStyle.stroke = stroke; baseStyle.strokeThickness = strokeThickness; }
  const glow = new PIXI.Text({ text, style: { ...baseStyle, fill: glowColor } });
  glow.filters = [new PIXI.BlurFilter(glowSize, 1)];
  glow.alpha = glowAlpha;
  const sharp = new PIXI.Text({ text, style: baseStyle });
  glow.anchor.set(0.5);
  sharp.anchor.set(0.5);
  c.addChild(glow, sharp);
  c._glow = glow;
  c._sharp = sharp;
  c.setText = (t) => { glow.text = t; sharp.text = t; };
  c.setColor = (col) => { sharp.style.fill = col; };
  // Container 本身没有 anchor；代理到内部 glow/sharp，外部可像 Text 一样用 anchor.set(x,y)
  let _ax = 0.5, _ay = 0.5;
  const syncAnchor = () => { glow.anchor.set(_ax, _ay); sharp.anchor.set(_ax, _ay); };
  c.anchor = {
    set(x, y) { _ax = x; _ay = (y === undefined ? x : y); syncAnchor(); },
    get x() { return _ax; }, set x(v) { _ax = v; syncAnchor(); },
    get y() { return _ay; }, set y(v) { _ay = v; syncAnchor(); },
    copyFrom(p) { _ax = p.x; _ay = p.y; syncAnchor(); },
  };
  return c;
}

// 玻璃拟态面板
export function createPanel(w, h, opts = {}) {
  const {
    radius = 24, fillColor = 0x0e0830, fillAlpha = 0.5,
    borderColor = 0x8be9fd, borderAlpha = 0.45,
    glowColor = 0x8be9fd, glowSize = 22, glowAlpha = 0.4,
  } = opts;
  const c = new PIXI.Container();
  const glow = new PIXI.Graphics();
  glow.roundRect(-w / 2, -h / 2, w, h, radius).fill({ color: glowColor, alpha: glowAlpha });
  glow.filters = [new PIXI.BlurFilter(glowSize, 1)];
  const body = new PIXI.Graphics();
  body.roundRect(-w / 2, -h / 2, w, h, radius).fill({ color: fillColor, alpha: fillAlpha });
  body.roundRect(-w / 2, -h / 2, w, h, radius).stroke({ width: 1.5, color: borderColor, alpha: borderAlpha });
  const gloss = new PIXI.Graphics();
  gloss.roundRect(-w / 2 + 2, -h / 2 + 2, w - 4, h * 0.42, radius - 2).fill({ color: 0xffffff, alpha: 0.05 });
  c.addChild(glow, body, gloss);
  c._glow = glow;
  c._body = body;
  c.recolor = (border, fill) => {
    body.clear();
    body.roundRect(-w / 2, -h / 2, w, h, radius).fill({ color: fill, alpha: fillAlpha });
    body.roundRect(-w / 2, -h / 2, w, h, radius).stroke({ width: 1.5, color: border, alpha: borderAlpha });
  };
  return c;
}

// 霓虹按钮（场景负责每帧驱动 hover 缩放）
export function createGlowButton(label, opts = {}) {
  const {
    width = 300, height = 80, fontSize = 30, radius = 40,
    fillColor = 0x150a36, borderColor = 0x8be9fd, textColor = 0xffffff,
    glowColor = 0x8be9fd, glowSize = 18, fontFamily = 'Baloo 2', fontWeight = 800,
  } = opts;
  const c = new PIXI.Container();
  c.sortableChildren = true;
  const glow = new PIXI.Graphics();
  glow.roundRect(-width / 2, -height / 2, width, height, radius).fill({ color: glowColor, alpha: 0.5 });
  glow.filters = [new PIXI.BlurFilter(glowSize, 1)];
  glow.alpha = 0.55;
  const body = new PIXI.Graphics();
  body.roundRect(-width / 2, -height / 2, width, height, radius).fill({ color: fillColor, alpha: 0.9 });
  body.roundRect(-width / 2, -height / 2, width, height, radius).stroke({ width: 2.5, color: borderColor, alpha: 0.9 });
  const gloss = new PIXI.Graphics();
  gloss.roundRect(-width / 2 + 4, -height / 2 + 4, width - 8, height / 2 - 4, radius - 4).fill({ color: 0xffffff, alpha: 0.07 });
  const txt = createNeonText(label, { fontSize, fontFamily, fontWeight, fill: textColor, glowColor, glowSize: glowSize * 0.45, glowAlpha: 0.7 });
 c.addChild(glow, body, gloss, txt);
 c._glow = glow;
  c._txt = txt;
 c._width = width;
 c._height = height;
 c._hover = false;
  c._scaleT = 1;
  c._pulse = Math.random() * Math.PI * 2;
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.hitArea = new PIXI.Rectangle(-width / 2, -height / 2, width, height);
  c.on('pointerenter', () => { c._hover = true; });
  c.on('pointerleave', () => { c._hover = false; });
  c.on('pointerdown', () => { c._scaleT = 0.94; });
  c.on('pointerup', () => { c._scaleT = c._hover ? 1.06 : 1; });
  c.on('pointerupoutside', () => { c._scaleT = 1; });
  c.recolor = (borderCol, glowCol, fillCol) => {
    glow.clear();
    glow.roundRect(-width / 2, -height / 2, width, height, radius).fill({ color: glowCol, alpha: 0.5 });
    body.clear();
    body.roundRect(-width / 2, -height / 2, width, height, radius).fill({ color: fillCol, alpha: 0.9 });
    body.roundRect(-width / 2, -height / 2, width, height, radius).stroke({ width: 2.5, color: borderCol, alpha: 0.9 });
    if (txt._glow) txt._glow.style.fill = glowCol;
  };
  return c;
}

// 答案能量球
export function createAnswerOrb(value, opts = {}) {
  const {
    size = 92, borderColor = 0x8be9fd, fillColor = 0x140a33, textColor = 0xffffff,
    glowColor = 0x8be9fd, glowSize = 18, fontSize = 46,
  } = opts;
  const c = new PIXI.Container();
  c.sortableChildren = true;
  const glow = new PIXI.Graphics();
  glow.circle(0, 0, size * 0.62).fill({ color: glowColor, alpha: 0.5 });
  glow.filters = [new PIXI.BlurFilter(glowSize, 1)];
  glow.alpha = 0.75;
  const fill = new PIXI.Graphics();
  fill.circle(0, 0, size).fill({ color: fillColor, alpha: 0.92 });
  const gloss = new PIXI.Graphics();
  gloss.ellipse(0, -size * 0.32, size * 0.7, size * 0.34).fill({ color: 0xffffff, alpha: 0.1 });
  const ring = new PIXI.Graphics();
  ring.circle(0, 0, size).stroke({ width: 3, color: borderColor, alpha: 0.92 });
  const txt = createNeonText(String(value), { fontSize, fontFamily: 'Orbitron', fontWeight: 800, fill: textColor, glowColor, glowSize: glowSize * 0.55, glowAlpha: 0.7 });
  c.addChild(glow, fill, gloss, ring, txt);
  c._glow = glow; c._ring = ring; c._fill = fill; c._txt = txt;
  c._size = size;
  c._hover = false;
  c._scaleT = 1;
  c._pulse = Math.random() * Math.PI * 2;
  c._entrance = null;
  c._state = 'idle';
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.hitArea = new PIXI.Circle(0, 0, size + 10);
  c.on('pointerenter', () => { if (c._state === 'idle') c._hover = true; });
  c.on('pointerleave', () => { c._hover = false; });
  c.recolor = (border, fillCol, glowCol, glowAlpha = 0.9) => {
    const s = c._size;
    c._glow.clear(); c._glow.circle(0, 0, s * 0.62).fill({ color: glowCol, alpha: 0.55 });
    c._glow.alpha = glowAlpha;
    c._ring.clear(); c._ring.circle(0, 0, s).stroke({ width: 3, color: border, alpha: 0.95 });
    c._fill.clear(); c._fill.circle(0, 0, s).fill({ color: fillCol, alpha: 0.92 });
  };
  return c;
}
