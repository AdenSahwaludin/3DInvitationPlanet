import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const errors = [];
const logs = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--window-size=1280,800'],
  defaultViewport: { width: 1280, height: 800 }
});

const page = await browser.newPage();
page.on('console', msg => {
  const t = `[${msg.type()}] ${msg.text()}`;
  logs.push(t);
  if (msg.type() === 'error') errors.push(t);
});
page.on('pageerror', err => {
  errors.push(`[pageerror] ${err.message}`);
  logs.push(`[pageerror] ${err.message}`);
});
page.on('requestfailed', req => {
  const url = req.url();
  if (!url.includes('fonts.g')) errors.push(`[requestfailed] ${url} — ${req.failure()?.errorText}`);
});

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 3500));

const introVisible = await page.evaluate(() => {
  const i = document.getElementById('intro');
  return i && !i.classList.contains('hidden') && !!document.getElementById('launch-btn');
});
console.log('INTRO_VISIBLE:', introVisible);
await page.screenshot({ path: 'shot-intro.png' });

console.log('CLICKING LAUNCH...');
await page.click('#launch-btn');
await new Promise(r => setTimeout(r, 4500));

const state1 = await page.evaluate(() => window.__odyssey.state.mode);
console.log('MODE_AFTER_LAUNCH:', state1);
await page.screenshot({ path: 'shot-play.png' });

const webgl = await page.evaluate(() => {
  const c = document.querySelector('#scene');
  return c && c.width > 0;
});
console.log('CANVAS_RENDERING:', webgl);

const labelCount = await page.evaluate(() => document.querySelectorAll('.planet-label').length);
console.log('LABELS:', labelCount);

await browser.close();

console.log('\n--- LOGS (last 25) ---');
logs.slice(-25).forEach(l => console.log(l));
if (errors.length) {
  console.log(`\n!!! ${errors.length} ERRORS:`);
  errors.forEach(e => console.log(e));
  process.exit(1);
} else {
  console.log('\nNO RUNTIME ERRORS ✔');
}
