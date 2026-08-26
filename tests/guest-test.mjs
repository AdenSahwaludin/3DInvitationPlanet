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

await page.goto('http://localhost:5173/Aden', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3500));

const guestInIntro = await page.evaluate(() => document.querySelector('.intro-guest')?.textContent || '');
console.log('INTRO GUEST LINE:', JSON.stringify(guestInIntro));
await page.screenshot({ path: 'shot-guest-intro.png' });

await page.click('#launch-btn');
await new Promise(r => setTimeout(r, 4500));

const holo = await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  const l = PLANETS[0];
  player.pos.set(l.pos.x, 0, l.pos.z - 30);
  player.yaw = 0;
  return true;
});
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: 'shot-guest-holo.png' });

const rsvpPrefill = await page.evaluate(async () => {
  const { PLANETS, player } = window.__odyssey;
  const p = PLANETS.find(x => x.id === 'rsvp');
  player.pos.set(p.pos.x, 0, p.pos.z - p.triggerRadius + 4);
  return true;
});
await new Promise(r => setTimeout(r, 500));
await page.keyboard.press('KeyE');
await new Promise(r => setTimeout(r, 2600));
const prefill = await page.evaluate(() => document.getElementById('rsvp-name')?.value || '');
console.log('RSVP PREFILL:', JSON.stringify(prefill));

await browser.close();
console.log('ERRORS:', errors.length ? errors : 'none');
