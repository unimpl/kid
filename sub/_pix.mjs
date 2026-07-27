import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const server = spawn('python3', ['-m', 'http.server', '8771', '--bind', '127.0.0.1'], { cwd: '/Users/xhb/github/kid/sub', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
let out='';
try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--window-size=1280,820'] });
  const page = await browser.newPage(); await page.setViewport({ width:1280, height:820 });
  await page.goto('http://127.0.0.1:8771/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 7000));
  const info = await page.evaluate(() => {
    const bg = document.querySelectorAll('canvas')[0];
    const tmp = document.createElement('canvas'); tmp.width=bg.width; tmp.height=bg.height;
    const tctx = tmp.getContext('2d'); tctx.drawImage(bg, 0, 0);
    const img = tctx.getImageData(0, 0, tmp.width, tmp.height).data;
    // 分区统计
    const zones = { leftBlack:0, midDisk:0, rightDisk:0, anyColor:0, total:0 };
    for (let y=0; y<tmp.height; y+=4) {
      for (let x=0; x<tmp.width; x+=4) {
        const i=(y*tmp.width+x)*4; const r=img[i],g=img[i+1],b=img[i+2];
        zones.total++;
        const isBlack = r<8&&g<8&&b<12;
        if (isBlack && x<200) zones.leftBlack++;
        const isDisk = r>140&&g>70&&b<120&&r>b;          // 橙色吸积盘
        if (isDisk && x>=200&&x<700) zones.midDisk++;
        if (isDisk && x>=700) zones.rightDisk++;
        if (!isBlack && (r+g+b)>30) zones.anyColor++;    // 星云/星点
      }
    }
    return zones;
  });
  out += JSON.stringify(info, null, 2);
  await browser.close();
} catch(e){ out+='EXC: '+e.message; }
finally { server.kill('SIGKILL'); }
console.log(out);
