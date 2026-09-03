import http from 'http';
import { promises as fs, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 5173;
const dataDir = path.join(root, 'data');
const photosDir = path.join(root, 'assets', 'photos');
const dbFile = path.join(dataDir, 'odyssey.db');
const jsonFile = path.join(dataDir, 'odyssey.json');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

function parseUA(ua = '') {
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = /Mobi|iPhone|iPod|Windows Phone/i.test(ua);
  const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';
  const os = /Windows/i.test(ua) ? 'Windows'
    : /Android/i.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
    : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
    : /Linux/i.test(ua) ? 'Linux' : 'Unknown';
  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  return { device, os, browser };
}

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  return (xf ? String(xf).split(',')[0].trim() : '') || req.socket.remoteAddress || '';
}

function visitorFields(req) {
  const ua = String(req.headers['user-agent'] || '');
  const { device, os, browser } = parseUA(ua);
  return { ip: clientIp(req), ua: ua.slice(0, 300), device, os, browser };
}

async function createStore() {
  try {
    const { DatabaseSync } = await import('node:sqlite');
    if (!existsSync(dataDir)) await fs.mkdir(dataDir, { recursive: true });
    const db = new DatabaseSync(dbFile);
    db.exec(`
      CREATE TABLE IF NOT EXISTS wishes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS rsvp (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, guests INTEGER NOT NULL DEFAULT 1, attending INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL UNIQUE, caption TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT DEFAULT (datetime('now')), ip TEXT DEFAULT '', ua TEXT DEFAULT '', device TEXT DEFAULT '', os TEXT DEFAULT '', browser TEXT DEFAULT '', guest TEXT DEFAULT '', path TEXT DEFAULT '', ref TEXT DEFAULT '', screen TEXT DEFAULT '');
    `);
    for (const t of ['wishes', 'rsvp']) {
      const cols = db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
      for (const col of ['ip', 'device', 'browser', 'ua']) {
        if (!cols.includes(col)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`);
      }
    }
    return {
      engine: 'sqlite',
      file: dbFile,
      listWishes: () => db.prepare('SELECT * FROM wishes ORDER BY id').all(),
      addWish: (w, v) => db.prepare('INSERT INTO wishes (name, message, ip, device, browser, ua) VALUES (?, ?, ?, ?, ?, ?)').run(w.name, w.message, v.ip, v.device, v.browser, v.ua),
      deleteWish: id => db.prepare('DELETE FROM wishes WHERE id = ?').run(id),
      listRsvp: () => db.prepare('SELECT * FROM rsvp ORDER BY id DESC').all(),
      addRsvp: (r, v) => db.prepare('INSERT INTO rsvp (name, guests, attending, ip, device, browser, ua) VALUES (?, ?, ?, ?, ?, ?, ?)').run(r.name, r.guests, r.attending ? 1 : 0, v.ip, v.device, v.browser, v.ua),
      deleteRsvp: id => db.prepare('DELETE FROM rsvp WHERE id = ?').run(id),
      listPhotos: () => db.prepare('SELECT * FROM photos ORDER BY sort_order, id').all(),
      addPhoto: p => db.prepare('INSERT INTO photos (filename, caption, sort_order) VALUES (?, ?, ?)').run(p.filename, p.caption || '', p.sort_order || 0),
      updatePhoto: (id, p) => {
        const row = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
        if (!row) return false;
        db.prepare('UPDATE photos SET caption = ?, sort_order = ? WHERE id = ?').run(p.caption ?? row.caption, p.sort_order ?? row.sort_order, id);
        return true;
      },
      deletePhoto: id => db.prepare('DELETE FROM photos WHERE id = ?').run(id),
      addVisit: v => db.prepare('INSERT INTO visits (ip, ua, device, os, browser, guest, path, ref, screen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(v.ip, v.ua, v.device, v.os, v.browser, v.guest, v.path, v.ref, v.screen),
      listVisits: () => db.prepare('SELECT * FROM visits ORDER BY id DESC LIMIT 1000').all(),
      deleteVisit: id => db.prepare('DELETE FROM visits WHERE id = ?').run(id),
      clearVisits: () => db.exec('DELETE FROM visits')
    };
  } catch (e) {
    if (!existsSync(dataDir)) await fs.mkdir(dataDir, { recursive: true });
    const state = existsSync(jsonFile)
      ? JSON.parse(await fs.readFile(jsonFile, 'utf8'))
      : { wishes: [], rsvp: [], photos: [], visits: [], seq: 1 };
    if (!state.visits) state.visits = [];
    const save = () => fs.writeFile(jsonFile, JSON.stringify(state, null, 2));
    const nextId = () => state.seq++;
    return {
      engine: 'json',
      file: jsonFile,
      listWishes: () => state.wishes,
      addWish: (w, v) => { state.wishes.push({ id: nextId(), name: w.name, message: w.message, ip: v.ip, device: v.device, browser: v.browser, ua: v.ua, created_at: new Date().toISOString() }); return save(); },
      deleteWish: id => { state.wishes = state.wishes.filter(x => x.id != id); return save(); },
      listRsvp: () => state.rsvp,
      addRsvp: (r, v) => { state.rsvp.push({ id: nextId(), name: r.name, guests: r.guests, attending: r.attending ? 1 : 0, ip: v.ip, device: v.device, browser: v.browser, ua: v.ua, created_at: new Date().toISOString() }); return save(); },
      deleteRsvp: id => { state.rsvp = state.rsvp.filter(x => x.id != id); return save(); },
      listPhotos: () => state.photos,
      addPhoto: p => { state.photos.push({ id: nextId(), filename: p.filename, caption: p.caption || '', sort_order: p.sort_order || 0, created_at: new Date().toISOString() }); return save(); },
      updatePhoto: (id, p) => {
        const row = state.photos.find(x => x.id == id);
        if (!row) return false;
        if (p.caption !== undefined) row.caption = p.caption;
        if (p.sort_order !== undefined) row.sort_order = p.sort_order;
        return save();
      },
      deletePhoto: id => { state.photos = state.photos.filter(x => x.id != id); return save(); },
      addVisit: v => { state.visits.push({ id: nextId(), created_at: new Date().toISOString(), ...v }); if (state.visits.length > 5000) state.visits = state.visits.slice(-4000); return save(); },
      listVisits: () => state.visits.slice(-1000).reverse(),
      deleteVisit: id => { state.visits = state.visits.filter(x => x.id != id); return save(); },
      clearVisits: () => { state.visits = []; return save(); }
    };
  }
}

const store = await createStore();

async function syncPhotoFiles() {
  if (!existsSync(photosDir)) return;
  const existing = new Set(store.listPhotos().map(p => p.filename));
  let order = store.listPhotos().length;
  for (const f of readdirSync(photosDir)) {
    const ext = path.extname(f).toLowerCase();
    if (!IMAGE_EXT.has(ext) || existing.has(f)) continue;
    const base = path.basename(f, ext);
    const numbered = base.match(/^photo[-_ ]?(\d+)$/i);
    const caption = numbered ? `Memory ${numbered[1]}` : base.replace(/[-_]+/g, ' ').slice(0, 60);
    store.addPhoto({ filename: f, caption, sort_order: order++ });
  }
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 1e6) throw new Error('too large');
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const table = parts[1];
  const id = parts[2];

  if (req.method === 'GET' && table === 'wishes') return json(res, 200, store.listWishes());
  if (req.method === 'POST' && table === 'wishes') {
    const b = await readBody(req);
    const name = String(b.name || '').trim().slice(0, 60);
    const message = String(b.message || '').trim().slice(0, 300);
    if (!name || !message) return json(res, 400, { error: 'name and message required' });
    await store.addWish({ name, message }, visitorFields(req));
    return json(res, 201, { ok: true });
  }
  if (req.method === 'DELETE' && table === 'wishes' && id) {
    await store.deleteWish(id);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && table === 'rsvp') return json(res, 200, store.listRsvp());
  if (req.method === 'POST' && table === 'rsvp') {
    const b = await readBody(req);
    const name = String(b.name || '').trim().slice(0, 80);
    const guests = Math.max(1, Math.min(20, parseInt(b.guests, 10) || 1));
    if (!name) return json(res, 400, { error: 'name required' });
    await store.addRsvp({ name, guests, attending: !!b.attending }, visitorFields(req));
    return json(res, 201, { ok: true });
  }
  if (req.method === 'DELETE' && table === 'rsvp' && id) {
    await store.deleteRsvp(id);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && table === 'photos') return json(res, 200, store.listPhotos());
  if (req.method === 'POST' && table === 'photos') {
    const b = await readBody(req);
    const filename = String(b.filename || '').trim();
    if (!filename || filename.includes('..') || filename.includes('/')) return json(res, 400, { error: 'invalid filename' });
    try { await store.addPhoto({ filename, caption: String(b.caption || '').slice(0, 80), sort_order: b.sort_order || 0 }); }
    catch { return json(res, 409, { error: 'already exists' }); }
    return json(res, 201, { ok: true });
  }
  if (req.method === 'PUT' && table === 'photos' && id) {
    const b = await readBody(req);
    const ok = await store.updatePhoto(id, { caption: b.caption, sort_order: b.sort_order });
    return json(res, ok ? 200 : 404, { ok });
  }
  if (req.method === 'DELETE' && table === 'photos' && id) {
    await store.deletePhoto(id);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && table === 'track') {
    const b = await readBody(req).catch(() => ({}));
    const v = visitorFields(req);
    await store.addVisit({
      ip: v.ip, ua: v.ua, device: v.device, os: v.os, browser: v.browser,
      guest: String(b.guest || '').slice(0, 40),
      path: String(b.path || '/').slice(0, 120),
      ref: String(b.ref || '').slice(0, 200),
      screen: String(b.screen || '').slice(0, 20)
    });
    return json(res, 201, { ok: true });
  }
  if (req.method === 'GET' && table === 'visits') return json(res, 200, store.listVisits());
  if (req.method === 'DELETE' && table === 'visits' && id) {
    await store.deleteVisit(id);
    return json(res, 200, { ok: true });
  }
  if (req.method === 'DELETE' && table === 'visits') {
    await store.clearVisits();
    return json(res, 200, { ok: true });
  }

  json(res, 404, { error: 'unknown endpoint' });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.db': 'application/octet-stream'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (url.pathname === '/db' || url.pathname === '/db/') {
      const data = await fs.readFile(path.join(root, 'admin.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(data);
    }

    // —— Undangan klasik (versi scroll) ——
    // Domain berawalan "undangan." (mis. undangan.adensahwaludin.app) membuka
    // folder undangan/ ; /src, /libs, /assets tetap diambil dari root repo.
    // Di domain lain, folder ini juga bisa dibuka lewat path /undangan.
    const host = String(req.headers.host || '').split(':')[0].toLowerCase();
    const undanganHost = host.startsWith('undangan.');
    let rawPath = decodeURIComponent(url.pathname);
    let serveDir = root;
    if (!undanganHost && (rawPath === '/undangan' || rawPath.startsWith('/undangan/'))) {
      rawPath = rawPath === '/undangan' ? '/' : rawPath.slice('/undangan'.length) || '/';
      serveDir = path.join(root, 'undangan');
    }
    if (undanganHost) serveDir = path.join(root, 'undangan');

    const isDoc = rawPath === '/' || rawPath === '';
    const rel = isDoc ? 'index.html' : rawPath.slice(1);
    const docFile = serveDir === root ? 'index.html' : path.join('undangan', 'index.html');
    let file = path.normalize(path.join(serveDir, rel));
    if (!file.startsWith(serveDir) && !file.startsWith(root)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    let data;
    let typePath = rel;
    try {
      data = await fs.readFile(file);
    } catch {
      if (!path.extname(rel)) {
        data = await fs.readFile(path.join(root, docFile));
        typePath = docFile;
      } else if (serveDir !== root) {
        // aset bersama (src/, libs/, assets/) tetap dari root repo
        file = path.normalize(path.join(root, rel));
        data = await fs.readFile(file);
      } else {
        throw new Error('not found');
      }
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(typePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch (err) {
    if (err.message === 'too large') return json(res, 413, { error: 'payload too large' });
    if (err instanceof SyntaxError) return json(res, 400, { error: 'bad json' });
    res.writeHead(404);
    res.end('Not found');
  }
});

await syncPhotoFiles();

server.listen(port, () => {
  console.log(`\n  🚀 Wedding Space Odyssey running at:\n\n     http://localhost:${port}\n`);
  console.log(`  🗄️  Database : ${store.engine.toUpperCase()} → ${path.relative(root, store.file)}`);
  console.log(`  🖼️  Photos   : ${path.relative(root, photosDir)}\n`);
});
