const BASE = 'http://localhost:5173';
const j = async (path, opts) => {
  const res = await fetch(BASE + path, opts);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
};
const post = (path, data) => j(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

console.log('GET  /api/photos      :', JSON.stringify((await j('/api/photos')).body));
console.log('POST /api/wishes      :', (await post('/api/wishes', { name: 'Budi', message: 'Selamat menempuh hidup baru! 🎉' })).status);
console.log('GET  /api/wishes      :', JSON.stringify((await j('/api/wishes')).body));
console.log('POST /api/rsvp        :', (await post('/api/rsvp', { name: 'Sari +1', guests: 2, attending: true })).status);
console.log('POST /api/rsvp (no)   :', (await post('/api/rsvp', { name: 'Tono', guests: 1, attending: false })).status);
console.log('GET  /api/rsvp        :', JSON.stringify((await j('/api/rsvp')).body));
const wishes = (await j('/api/wishes')).body;
const last = wishes[wishes.length - 1];
console.log('DELETE wish', last.id, '     :', (await j(`/api/wishes/${last.id}`, { method: 'DELETE' })).status);
console.log('GET  /api/wishes after:', JSON.stringify((await j('/api/wishes')).body.map(w => w.name)));
console.log('POST /api/photos      :', (await post('/api/photos', { filename: 'photo-1.jpg', caption: 'First Meeting' })).status);
console.log('GET  /api/photos      :', JSON.stringify((await j('/api/photos')).body));
const static_ = await fetch(BASE + '/');
console.log('GET  /                :', static_.status);
