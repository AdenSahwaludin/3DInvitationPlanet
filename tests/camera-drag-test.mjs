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

async function check(label, file) {
  const r = await new Promise(resolve => {
    let frames = 0;
    const vals = [];
    function poll() {
      frames++;
      vals.push(window.__odyssey.rocketNDC());
      if (frames < 30) requestAnimationFrame(poll);
      else resolve(vals);
    }
    requestAnimationFrame(poll);
  });
  void r;
}

async function sampleNDC() {
  return page.evaluate(() => new Promise(res => {
    let n = 0; let worst = { x: 0, y: 0 };
    function poll() {
      const d = window.__odyssey.rocketNDC();
      if (Math.abs(d.x) > Math.abs(worst.x)) worst.x = d.x;
      if (Math.abs(d.y) > Math.abs(worst.y)) worst.y = d.y;
      if (++n < 30) requestAnimationFrame(poll); else res(worst);
    }
    requestAnimationFrame(poll);
  }));
}

console.log('baseline:', JSON.stringify(await sampleNDC()));

await page.mouse.move(640, 400);
await page.mouse.down();
await page.mouse.move(60, 400, { steps: 25 });
await page.mouse.up();
await new Promise(r => setTimeout(r, 900));
const left = await sampleNDC();
console.log('after drag LEFT 180deg:', JSON.stringify(left));
await page.screenshot({ path: 'shot-drag-left.png' });

await page.mouse.move(640, 400);
await page.mouse.down();
await page.mouse.move(1220, 400, { steps: 25 });
await page.mouse.up();
await new Promise(r => setTimeout(r, 900));
console.log('after drag RIGHT back:', JSON.stringify(await sampleNDC()));

await page.mouse.move(640, 400);
await page.mouse.down();
await page.mouse.move(640, 120, { steps: 25 });
await page.mouse.up();
await new Promise(r => setTimeout(r, 900));
const up = await sampleNDC();
console.log('after drag UP (pitch):', JSON.stringify(up));
await page.screenshot({ path: 'shot-drag-up.png' });

await page.mouse.move(640, 300);
await page.mouse.down();
await page.mouse.move(640, 700, { steps: 25 });
await page.mouse.up();
await new Promise(r => setTimeout(r, 900));
console.log('after drag DOWN:', JSON.stringify(await sampleNDC()));

await browser.close();
console.log('ERRORS:', errors.length ? errors : 'none');
