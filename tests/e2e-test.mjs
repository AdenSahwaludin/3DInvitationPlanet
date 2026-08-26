import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const errors = [];
const results = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  defaultViewport: { width: 1280, height: 800 }
});

const page = await browser.newPage();
page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));
page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('fonts.g')) errors.push(`[console] ${msg.text()}`); });

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));
await page.click('#launch-btn');
await new Promise(r => setTimeout(r, 4500));

const ok = (name, cond) => results.push(`${cond ? 'PASS' : 'FAIL'} — ${name}`);

ok('mode=play', await page.evaluate(() => window.__odyssey.state.mode === 'play'));

const probe = await page.evaluate(() => {
  const el = document.elementFromPoint(1000, 400);
  return el ? `${el.tagName}.${el.className}` : 'none';
});
results.push(`PROBE element at (1000,400): ${probe}`);

await page.keyboard.down('KeyW');
await new Promise(r => setTimeout(r, 1600));
await page.keyboard.up('KeyW');
const moved = await page.evaluate(() => {
  const p = window.__odyssey.player;
  return { z: p.pos.z.toFixed(1), speed: p.speed.toFixed(1) };
});
ok(`movement forward (z=${moved.z}, speed=${moved.speed})`, moved.z > 38);

const love = await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  player.pos.set(PLANETS[0].pos.x, 0, PLANETS[0].pos.z - PLANETS[0].discoverRadius + 2);
  return true;
});
await new Promise(r => setTimeout(r, 900));
ok('Love Planet discovered', await page.evaluate(() => window.__odyssey.PLANETS[0].discovered === true));
ok('progress 1/8', await page.evaluate(() => document.getElementById('pc-count').textContent.trim().startsWith('1')));
await page.screenshot({ path: 'shot-discovered.png' });

await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  player.pos.set(PLANETS[0].pos.x, 0, PLANETS[0].pos.z - PLANETS[0].triggerRadius + 4);
});
await new Promise(r => setTimeout(r, 500));
const promptShown = await page.evaluate(() => !document.getElementById('interact-prompt').classList.contains('hidden'));
ok('interact prompt visible', promptShown);

await page.keyboard.press('KeyE');
await new Promise(r => setTimeout(r, 2600));
ok('panel opened', await page.evaluate(() => !document.getElementById('planet-panel').classList.contains('hidden')));
ok('mode=panel', await page.evaluate(() => window.__odyssey.state.mode === 'panel'));
const countdown = await page.evaluate(() => !!document.getElementById('countdown'));
ok('love countdown rendered', countdown);
await page.screenshot({ path: 'shot-panel-love.png' });

await page.click('#pp-close');
await new Promise(r => setTimeout(r, 800));
ok('panel closed → play', await page.evaluate(() => window.__odyssey.state.mode === 'play'));

await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  const r = PLANETS.find(p => p.id === 'rsvp');
  player.pos.set(r.pos.x, 0, r.pos.z - r.discoverRadius + 2);
});
await new Promise(r => setTimeout(r, 800));
ok('RSVP discovered', await page.evaluate(() => window.__odyssey.PLANETS.find(p => p.id === 'rsvp').discovered));

await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  const r = PLANETS.find(p => p.id === 'rsvp');
  player.pos.set(r.pos.x, 0, r.pos.z - r.triggerRadius + 4);
});
await new Promise(r => setTimeout(r, 400));
await page.keyboard.press('KeyE');
await new Promise(r => setTimeout(r, 2600));
ok('rsvp form present', await page.evaluate(() => !!document.getElementById('rsvp-form')));
await page.type('#rsvp-name', 'Test Traveller');
await page.click('.pill input[value="no"] + span').catch(() => {});
await page.evaluate(() => { document.querySelector('input[name="att"][value="yes"]').click(); });
await page.click('#rsvp-form .cta-btn');
await new Promise(r => setTimeout(r, 700));
ok('mission confirmed overlay', await page.evaluate(() => !!document.querySelector('.mission-confirm')));
await page.screenshot({ path: 'shot-rsvp.png' });
await new Promise(r => setTimeout(r, 2600));
ok('rsvp persisted', await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('wsy_rsvp')); return d && d.name === 'Test Traveller'; }));

await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  const g = PLANETS.find(p => p.id === 'gift');
  player.pos.set(g.pos.x, 0, g.pos.z - g.triggerRadius + 4);
});
await new Promise(r => setTimeout(r, 400));
await page.keyboard.press('KeyE');
await new Promise(r => setTimeout(r, 2600));
const giftDiag = await page.evaluate(() => ({
  mode: window.__odyssey.state.mode,
  target: window.__odyssey.state.interactTarget?.id || null,
  panelHidden: document.getElementById('planet-panel').classList.contains('hidden'),
  head: document.querySelector('.pp-head h2')?.textContent || 'none',
  copyBtns: document.querySelectorAll('.copy-btn').length
}));
console.log('GIFT DIAG:', JSON.stringify(giftDiag));
ok('gift panel with copy buttons', giftDiag.copyBtns >= 2);
if (giftDiag.copyBtns >= 2) await page.click('.copy-btn');
await new Promise(r => setTimeout(r, 500));
ok('copy feedback toast', await page.evaluate(() => document.querySelectorAll('.toast').length > 0));
await page.screenshot({ path: 'shot-gift.png' });
await page.click('#pp-close');
await new Promise(r => setTimeout(r, 600));

await page.keyboard.press('KeyM');
await new Promise(r => setTimeout(r, 400));
ok('bigmap opens', await page.evaluate(() => !document.getElementById('bigmap').classList.contains('hidden')));
await page.screenshot({ path: 'shot-bigmap.png' });
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 400));
ok('bigmap closes on Esc', await page.evaluate(() => document.getElementById('bigmap').classList.contains('hidden')));

await page.evaluate(() => {
  const { PLANETS } = window.__odyssey;
  PLANETS.forEach(p => { if (p.id !== 'forever') { p.discovered = true; window.__odyssey.state.discovered.add(p.id); } });
  window.__odyssey.state.discovered.delete('love');
  PLANETS.find(p => p.id === 'love').discovered = false;
});
await page.evaluate(() => {
  const { PLANETS, player } = window.__odyssey;
  const f = PLANETS.find(p => p.id === 'forever');
  const locked = f.locked();
  PLANETS.forEach(p => { if (p.id !== 'forever') { p.discovered = true; window.__odyssey.state.discovered.add(p.id); } });
  player.pos.set(f.pos.x, 0, f.pos.z - f.triggerRadius + 4);
  window.__lockedProbe = locked;
});
await new Promise(r => setTimeout(r, 600));
ok('forever was locked before 8/8', await page.evaluate(() => window.__lockedProbe === true));
await page.keyboard.press('KeyE');
await new Promise(r => setTimeout(r, 3000));
ok('finale overlay visible', await page.evaluate(() => !document.getElementById('finale-overlay').classList.contains('hidden')));
await page.screenshot({ path: 'shot-finale.png' });
await new Promise(r => setTimeout(r, 9000));
await page.screenshot({ path: 'shot-finale2.png' });
const retVisible = await page.evaluate(() => !document.getElementById('finale-return').classList.contains('hidden'));
ok('finale return button', retVisible);
if (retVisible) await page.click('#finale-return');
await new Promise(r => setTimeout(r, 600));
ok('back to play after finale', await page.evaluate(() => window.__odyssey.state.mode === 'play'));

await browser.close();

console.log(results.join('\n'));
if (errors.length) {
  console.log(`\n!!! ${errors.length} RUNTIME ERRORS:`);
  errors.slice(0, 12).forEach(e => console.log(e));
  process.exit(1);
}
console.log('\nE2E DONE — no runtime errors ✔');
