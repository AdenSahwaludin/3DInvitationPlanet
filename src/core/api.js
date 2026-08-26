const BASE = '';

async function req(path, opts = {}) {
  try {
    const res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const api = {
  listWishes: () => req('/api/wishes'),
  addWish: (name, message) => req('/api/wishes', { method: 'POST', body: JSON.stringify({ name, message }) }),
  listRsvp: () => req('/api/rsvp'),
  addRsvp: (name, guests, attending) => req('/api/rsvp', { method: 'POST', body: JSON.stringify({ name, guests, attending }) }),
  listPhotos: () => req('/api/photos')
};
