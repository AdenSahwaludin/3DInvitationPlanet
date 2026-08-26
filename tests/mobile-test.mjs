import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const errors = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  defaultViewport: { width: 390, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
});

const page = await browser.newPage();
page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: 'shot-mobile-intro.png' });

await page.tap('#launch-btn');
await new Promise(r => setTimeout(r, 5000));

const touchUI = await page.evaluate(() => ({
  boostVisible: !document.getElementById('btn-boost').closest('.touch-controls').classList.contains('hidden'),
  interactHidden: document.getElementById('btn-interact').classList.contains('hidden'),
  mode: window.__odyssey.state.mode
}));
console.log('MOBILE UI:', JSON.stringify(touchUI));

await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  const l = PLANETS[0];
  player.pos.set(l.pos.x, 0, l.pos.z - l.triggerRadius + 4);
});
await new Promise(r => setTimeout(r, 800));
const interactBtnShown = await page.evaluate(() => !document.getElementById('btn-interact').classList.contains('hidden'));
console.log('INTERACT BTN SHOWN:', interactBtnShown);
await page.screenshot({ path: 'shot-mobile-play.png' });

await page.tap('#btn-interact');
await new Promise(r => setTimeout(r, 2800));
const panelOpen = await page.evaluate(() => !document.getElementById('planet-panel').classList.contains('hidden'));
console.log('MOBILE PANEL OPEN:', panelOpen);
await page.screenshot({ path: 'shot-mobile-panel.png' });

await browser.close();
console.log('ERRORS:', errors.length ? errors : 'none');
process.exit(errors.length ? 1 : 0);
