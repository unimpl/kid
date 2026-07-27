import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8766;
const URL = `http://127.0.0.1:${PORT}/`;

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: '/Users/xhb/github/kid/sub',
  stdio: 'ignore',
});
// wait for server
await new Promise((r) => setTimeout(r, 1200));

let result = '';
try {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--window-size=1280,820'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 1 });
  const errors = [];
  const logs = [];
  page.on('console', (m) => { logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => { errors.push(`PAGEERROR: ${e.message}`); });
  page.on('response',(r)=>{ if(r.status()>=400) errors.push('HTTP '+r.status()+': '+r.url()); });
  page.on('requestfailed', (r) => { errors.push(`REQFAIL: ${r.url()} ${r.failure()?.errorText}`); });
 await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
 await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
 await new Promise((r) => setTimeout(r, 7000));
  const info = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const loading = document.getElementById('loading');
    const gl = document.getElementById('game-layer');
    return {
      canvasCount: canvases.length,
      loadingPresent: !!loading,
      gameLayerChild: gl ? gl.children.length : 0,
      titleVisible: !!document.querySelector('#game-layer canvas'),
    };
  });
  await page.screenshot({ path: '/tmp/sub_menu.png' });
  result += '=== INFO ===\n' + JSON.stringify(info, null, 2) + '\n';
  result += '=== ERRORS ===\n' + (errors.length ? errors.join('\n') : '(none)') + '\n';
  result += '=== LOGS ===\n' + (logs.slice(-25).join('\n') || '(none)') + '\n';
  await browser.close();
} catch (e) {
  result += 'EXCEPTION: ' + e.message + '\n';
} finally {
  server.kill('SIGKILL');
}
console.log(result);
