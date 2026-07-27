import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const server = spawn('python3', ['-m', 'http.server', '8769', '--bind', '127.0.0.1'], { cwd: '/Users/xhb/github/kid/sub', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
let out = '';
try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--window-size=1280,820'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8769/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 5000));
  const info = await page.evaluate(() => {
    const cs = [...document.querySelectorAll('canvas')];
    return cs.map(c => ({ parent: c.parentElement && c.parentElement.id, w: c.width, h: c.height, style: c.style.cssText.slice(0,60) }));
  });
  out += JSON.stringify(info, null, 2);
  await browser.close();
} catch (e) { out += 'EXC: ' + e.message; }
finally { server.kill('SIGKILL'); }
console.log(out);
