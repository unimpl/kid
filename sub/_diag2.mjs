import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8768;
const URL = `http://127.0.0.1:${PORT}/`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: '/Users/xhb/github/kid/sub', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
let out = '';
try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required','--window-size=1280,820'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 820 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 5000));
  await page.mouse.click(640, 400);
  await new Promise((r) => setTimeout(r, 1500));

  const before = await page.evaluate(() => ({ playing: window.__audio.bgmPlaying, on: window.__audio.bgmOn, muted: window.__audio.muted }));

  // 点 ♫ 音乐按钮 (w-128, 52) = (1152, 52)
  await page.mouse.click(1152, 52);
  await new Promise((r) => setTimeout(r, 300));
  const afterMusicOff = await page.evaluate(() => ({ playing: window.__audio.bgmPlaying, on: window.__audio.bgmOn }));

  // 再点 ♫ 开回来
  await page.mouse.click(1152, 52);
  await new Promise((r) => setTimeout(r, 500));
  const afterMusicOn = await page.evaluate(() => ({ playing: window.__audio.bgmPlaying, on: window.__audio.bgmOn }));

  // 点 ♪ 静音 (w-52, 52) = (1228, 52)
  await page.mouse.click(1228, 52);
  await new Promise((r) => setTimeout(r, 300));
  const afterMute = await page.evaluate(() => ({ playing: window.__audio.bgmPlaying, muted: window.__audio.muted, master: window.__audio.master.gain.value }));

  out += 'ERRORS: ' + (errs.length ? errs.join('; ') : '(none)') + '\n';
  out += JSON.stringify({ before, afterMusicOff, afterMusicOn, afterMute }, null, 2) + '\n';
  await browser.close();
} catch (e) { out += 'EXCEPTION: ' + e.message + '\n'; }
finally { server.kill('SIGKILL'); }
console.log(out);
