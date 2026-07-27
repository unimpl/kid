import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const server = spawn('python3', ['-m', 'http.server', '8772', '--bind', '127.0.0.1'], { cwd: '/Users/xhb/github/kid/sub', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
let out='';
try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required','--window-size=1280,820'] });
  const page = await browser.newPage(); await page.setViewport({ width:1280, height:820 });
  const errs=[]; page.on('pageerror',(e)=>errs.push(e.message));
  page.on('console',(m)=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,200)); });
  await page.goto('http://127.0.0.1:8772/', { waitUntil:'domcontentloaded', timeout:60000 });
  await new Promise((r)=>setTimeout(r,6000));
  await page.mouse.click(640,400); // 解锁音频
  await new Promise((r)=>setTimeout(r,800));
  // 副标题
  const sub = await page.evaluate(()=>{ const g=window.__game.current; return g.sub && g.sub.children[1].text; });
  // 选千位 + 开始
  const diffPos = await page.evaluate(()=>{ const b=window.__game.current.diffBtns[3]; const gp=b.getGlobalPosition(); return {x:gp.x,y:gp.y}; });
  await page.mouse.click(diffPos.x, diffPos.y); await new Promise(r=>setTimeout(r,300));
  const diffName = await page.evaluate(()=>window.__game.difficulty.name);
  await page.mouse.click(640,450); await new Promise(r=>setTimeout(r,2500)); // 开始冒险
  const game = await page.evaluate(()=>{ const s=window.__game.current; return {scene:s.constructor.name, phase:s.phase, aDigits:String(s.current.a).length}; });
  // 答对
  const cp = await page.evaluate(()=>{ const s=window.__game.current; const ci=s.current.options.indexOf(s.current.answer); const gp=s.orbs[ci].getGlobalPosition(); return {x:gp.x,y:gp.y}; });
  await page.mouse.click(cp.x,cp.y); await new Promise(r=>setTimeout(r,700));
  const ans = await page.evaluate(()=>{ const s=window.__game.current; return {phase:s.phase, combo:s.combo, score:s.score}; });
  out += 'ERRORS: '+(errs.length?errs.join(' | '):'(none)')+'\n';
  out += 'subtitle: '+sub+'\n';
  out += 'diff: '+diffName+' | game: '+JSON.stringify(game)+' | afterAnswer: '+JSON.stringify(ans)+'\n';
  await browser.close();
} catch(e){ out+='EXC: '+e.message+'\n'+e.stack; }
finally { server.kill('SIGKILL'); }
console.log(out);
