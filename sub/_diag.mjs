import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8770;
const URL = `http://127.0.0.1:${PORT}/`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: '/Users/xhb/github/kid/sub', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const measureFps = (page, ms) => page.evaluate(async (ms) => new Promise((resolve) => {
  let f=0; const s=performance.now();
  (function loop(t){ f++; if (t-s<ms) requestAnimationFrame(loop); else resolve({fps:+(f/((t-s)/1000)).toFixed(1)}); })(performance.now());
}), ms);
let out = '';
try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required','--window-size=1280,820'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 820 });
  const errs = []; const logs = [];
  page.on('pageerror', (e) => errs.push('PAGEERR: ' + e.message));
  page.on('console', (m) => { if (m.type()==='error'||m.type()==='warning') logs.push('['+m.type()+'] '+m.text().slice(0,300)); });
  page.on('response',(r)=>{ if(r.status()>=400) errs.push('HTTP '+r.status()+': '+r.url()); });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 7000));

  const info = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')];
    const bg = canvases[0];
    let leftBlack=0, leftDisk=0, allBlack=0;
    if (bg) {
      const ctx = bg.getContext('2d') || bg.getContext('webgl2');
      // 2D pixel read needs willReadFrequently; use webgl canvas? Three.js canvas is webgl. Read via drawImage to 2d.
      const tmp = document.createElement('canvas'); tmp.width=bg.width; tmp.height=bg.height;
      const tctx = tmp.getContext('2d');
      try { tctx.drawImage(bg, 0, 0); } catch(e){ return { err: 'drawImage failed: '+e.message, canvasCount: canvases.length, bgW: bg.width, bgH: bg.height }; }
      const img = tctx.getImageData(0, 0, tmp.width, tmp.height).data;
      // 左侧 0..120px 采样
      for (let y=0; y<tmp.height; y+=3) {
        for (let x=0; x<120; x+=3) {
          const i=(y*tmp.width+x)*4;
          const r=img[i],g=img[i+1],b=img[i+2];
          if (r<8&&g<8&&b<12) leftBlack++;
          if (r>150&&g>90&&b<120&&r>b) leftDisk++;
        }
      }
      return { canvasCount: canvases.length, bgW: bg.width, bgH: bg.height, leftBlack, leftDisk };
    }
    return { canvasCount: canvases.length };
  });
  const fps = await measureFps(page, 1500);
  out += '=== ERRORS ===\n' + (errs.length ? errs.join('\n') : '(none)') + '\n';
  out += '=== CONSOLE WARN/ERR ===\n' + (logs.length ? logs.join('\n') : '(none)') + '\n';
  out += '=== BG PIXELS ===\n' + JSON.stringify(info, null, 2) + '\n';
  out += '=== FPS ===\n' + JSON.stringify(fps, null, 2) + '\n';
  await browser.close();
} catch (e) { out += 'EXCEPTION: ' + e.message + '\n' + e.stack + '\n'; }
finally { server.kill('SIGKILL'); }
console.log(out);
