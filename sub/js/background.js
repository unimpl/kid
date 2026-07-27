// p5.js 宇宙艺术背景：静态层预渲染 + 视差星空 + 流场粒子 + 左侧黑洞
let sketchInstance = null;

export function startBackground() {
  if (sketchInstance) return;
  const s = (p) => {
    let stars = [], dust = [];
    let w, h, mx = 0, my = 0;
    let bgCache = null;
    let bh = null; // 黑洞几何 {x,y,r,rIn,rOut}
    const STAR = [200, 220, 255];
    const DUST = [
      [139, 233, 253], [255, 121, 198], [189, 147, 249], [80, 250, 123], [255, 184, 108],
    ];

    p.setup = () => {
      const c = p.createCanvas(window.innerWidth, window.innerHeight);
      c.parent('bg-layer');
      w = p.width; h = p.height;
      p.colorMode(p.RGB, 255);
      initField();
      buildBgCache();
      p.frameRate(30);
    };

    p.windowResized = () => {
      p.resizeCanvas(window.innerWidth, window.innerHeight);
      w = p.width; h = p.height;
      initField();
      buildBgCache();
    };

    function initField() {
      stars = [];
      const n = Math.min(180, Math.floor((w * h) / 9000));
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.5 + 0.3,
          tw: Math.random() * 0.04 + 0.008,
          ph: Math.random() * Math.PI * 2,
          z: Math.random() * 0.8 + 0.2,
        });
      }
      dust = [];
      const dn = Math.min(50, Math.floor((w * h) / 32000));
      for (let i = 0; i < dn; i++) {
        dust.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: 0, vy: 0, r: Math.random() * 2.4 + 1.2,
          col: DUST[i % DUST.length], a: Math.random() * 70 + 40,
        });
      }
    }

    function buildBgCache() {
      bgCache = p.createGraphics(w, h);
      const ctx = bgCache.drawingContext;
      // 深空渐变
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0a0524'); g.addColorStop(0.45, '#0c0626'); g.addColorStop(1, '#05030f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // 星云
      ctx.globalCompositeOperation = 'lighter';
      drawBlob(ctx, w * 0.3, h * 0.32, Math.max(w, h) * 0.38, 'rgba(120,80,220,0.11)');
      drawBlob(ctx, w * 0.72, h * 0.62, Math.max(w, h) * 0.32, 'rgba(255,80,170,0.08)');
      drawBlob(ctx, w * 0.5, h * 0.5, Math.max(w, h) * 0.45, 'rgba(60,150,220,0.05)');
      ctx.globalCompositeOperation = 'source-over';
      // 左侧黑洞（中心在左屏外，漏出不到一半）
      buildBlackHole(ctx);
    }

    function buildBlackHole(ctx) {
      const r = Math.min(w, h) * 0.26;       // 事件视界半径
      const bhx = -r * 0.4;                  // 中心在左屏外 → 屏上漏出约 30%（不到一半）
      const bhy = h * 0.5;
      const rIn = r * 1.05, rOut = r * 1.75;
      bh = { x: bhx, y: bhy, r, rIn, rOut };
      // 外层紫色光晕
      const gl = ctx.createRadialGradient(bhx, bhy, r * 0.8, bhx, bhy, r * 3.2);
      gl.addColorStop(0, 'rgba(150,100,230,0.18)');
      gl.addColorStop(0.5, 'rgba(120,80,220,0.06)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
      // 吸积盘（压扁的亮环：橙→白→橙）
      ctx.save();
      ctx.translate(bhx, bhy);
      ctx.scale(1, 0.3);
      const dg = ctx.createRadialGradient(0, 0, rIn, 0, 0, rOut);
      dg.addColorStop(0, 'rgba(255,150,60,0)');
      dg.addColorStop(0.16, 'rgba(255,170,80,0.5)');
      dg.addColorStop(0.38, 'rgba(255,225,160,0.92)');
      dg.addColorStop(0.55, 'rgba(255,255,255,0.98)');
      dg.addColorStop(0.72, 'rgba(255,205,130,0.78)');
      dg.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(0, 0, rOut, 0, Math.PI * 2); ctx.fill();
      // 多普勒增亮（右侧接近侧更亮）
      const sg = ctx.createRadialGradient(rIn * 0.7, 0, 0, rIn * 0.7, 0, rOut * 0.7);
      sg.addColorStop(0, 'rgba(255,255,255,0.55)');
      sg.addColorStop(0.5, 'rgba(255,230,170,0.25)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(0, 0, rOut, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawBlob(ctx, x, y, r, col) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    p.draw = () => {
      if (bgCache) p.image(bgCache, 0, 0);
      p.noStroke();
      // 视差星空
      p.push();
      p.translate(mx, my);
      for (const st of stars) {
        st.ph += st.tw;
        const tw = Math.sin(st.ph) * 0.5 + 0.5;
        const alpha = (70 + tw * 175) * st.z;
        p.fill(STAR[0], STAR[1], STAR[2], alpha);
        p.circle(st.x, st.y, st.r * (0.5 + tw * 0.9));
      }
      p.pop();
      // 流场粒子（无连线）
      p.push();
      p.blendMode(p.ADD);
      for (const d of dust) {
        const n = p.noise(d.x * 0.0022, d.y * 0.0022, p.frameCount * 0.0014);
        const ang = n * p.TWO_PI * 2;
        d.vx = p.lerp(d.vx, Math.cos(ang) * 0.7, 0.05);
        d.vy = p.lerp(d.vy, Math.sin(ang) * 0.7, 0.05);
        d.x += d.vx; d.y += d.vy;
        if (d.x < -30) d.x = w + 30; if (d.x > w + 30) d.x = -30;
        if (d.y < -30) d.y = h + 30; if (d.y > h + 30) d.y = -30;
        p.fill(d.col[0], d.col[1], d.col[2], d.a);
        p.circle(d.x, d.y, d.r * 2);
      }
      p.blendMode(p.BLEND);
      p.pop();
      // 黑洞前景：事件视界(纯黑球体) + 光子环 + 透镜亮环 + 旋转吸积流
      if (bh) {
        const ctx = p.drawingContext;
        ctx.save();
        // 纯黑事件视界（球体剪影，保持圆形不被压扁）
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(bh.x, bh.y, bh.r, 0, Math.PI * 2); ctx.fill();
        // 光子环（视界边缘细亮环）
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,240,210,0.92)';
        ctx.beginPath(); ctx.arc(bh.x, bh.y, bh.r * 1.03, 0, Math.PI * 2); ctx.stroke();
        // 透镜化的吸积盘亮环 + 旋转吸积流（压扁，绕盘面缓慢旋转）
        ctx.translate(bh.x, bh.y);
        ctx.scale(1, 0.3);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(255,240,200,0.9)';
        ctx.beginPath(); ctx.arc(0, 0, bh.rIn * 1.12, 0, Math.PI * 2); ctx.stroke();
        const rot = p.frameCount * 0.006;
        for (let k = 0; k < 3; k++) {
          const a0 = rot + k * Math.PI * 0.7;
          ctx.lineWidth = 2;
          ctx.strokeStyle = `rgba(255,${200 + k * 20},${140 + k * 30},0.45)`;
          ctx.beginPath();
          ctx.arc(0, 0, bh.rIn * 1.12 + bh.r * 0.25 * (k + 1), a0, a0 + Math.PI * 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }
      // 鼠标视差
      mx = p.lerp(mx, (p.mouseX - w / 2) * -0.012, 0.05);
      my = p.lerp(my, (p.mouseY - h / 2) * -0.012, 0.05);
    };
  };
  sketchInstance = new p5(s);
}
