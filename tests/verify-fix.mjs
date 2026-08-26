import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const errors = [];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  defaultViewport: { width: 1280, height: 800 }
});
const page = await browser.newPage();
page.on('pageerror', err => errors.push(err.message));
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));
await page.click('#launch-btn');
await new Promise(r => setTimeout(r, 4200));

await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  const f = PLANETS.find(p => p.id === 'forever');
  player.pos.set(f.pos.x, 0, f.pos.z - 26);
  player.yaw = Math.atan2(f.pos.x - player.pos.x, f.pos.z - player.pos.z);
  f.discovered = true;
});
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: 'shot-verify.png' });
await browser.close();
console.log('ERRORS:', errors.length ? errors : 'none');
