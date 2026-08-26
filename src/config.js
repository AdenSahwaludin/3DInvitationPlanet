import * as THREE from 'three';

const WEDDING_DATE = '2026-10-18T08:00:00+07:00';

export const CONFIG = {
  bride: 'Mega Dwi Wahyuni',
  groom: 'Aden Sahwaludin',
  couple: 'Aden & Mega',
  tagline: 'A Journey Written Among The Stars',
  hashtag: "#i'AM-AmongTheStars",
  weddingDate: WEDDING_DATE,
  quote: 'Two souls, one universe.',
  couplePhoto: '',
  story: [
    { year: '2019', title: 'First Meeting', icon: '☕', text: 'A rainy afternoon in a small bookstore. Aden reached for the last copy of a novel — and so did Mega. They shared the table, the coffee, and eventually, everything.' },
    { year: '2021', title: 'Our First Adventure', icon: '🏔️', text: 'A spontaneous road trip to the mountains. Wrong turns, terrible playlists, and a sunrise that made us promise to keep exploring — together.' },
    { year: '2024', title: 'The Proposal', icon: '💍', text: 'Under a sky full of stars on the observatory hill, Aden knelt down. Mega said yes before he could even finish the question.' },
    { year: '2026', title: 'Our Forever', icon: '✨', text: 'And now, surrounded by everyone we love, we begin the greatest adventure of all. Thank you for being part of our universe.' }
  ],
  events: [
    { name: 'Akad Nikah', date: 'Minggu, 18 Oktober 2026', time: '08:00 — 10:00 WIB', place: 'Gebangmampang, Margamulya, Bongas', icon: '💫' },
    { name: 'Resepsi', date: 'Minggu, 18 Oktober 2026', time: '11:00 — Selesai', place: 'Gebangmampang, Margamulya, Bongas', icon: '🥂' }
  ],
  venue: {
    name: 'Gebangmampang, Margamulya, Bongas',
    address: 'Gebangmampang, Margamulya, Bongas, Indramayu — lihat pin Google Maps',
    mapsQuery: '-6.3809945,108.033242'
  },
  gifts: [
    { bank: 'Seabank', number: '901127285814', holder: 'Aden Sahwwaludin' },
    { bank: 'Bank Jago', number: '108797651095', holder: 'Mega Dwi Wahyuni' }
  ],
  giftNote: 'Your presence is the greatest gift. However, if you wish to honour us with a token of love, you may send it to the accounts below.',
  giftAddress: 'Physical gifts can be sent to: Jl. Bintang Utara No. 88, Jakarta Selatan.',
  photos: [],
  seedWishes: [
    { name: 'Luna', message: 'May your love shine brighter than any star in this galaxy! ✨' },
    { name: 'Bima & Sari', message: 'Two of the kindest souls we know. Congratulations!' },
    { name: 'Om Hartono', message: 'Selamat! Semoga langgeng sampai bintang sejajar.' },
    { name: 'Kiran', message: 'Watching you two find each other was like watching gravity do its magic. 💫' }
  ],
  tutorialLines: ['Explore the universe.', 'Move your rocket.', 'Discover our planets.', 'Every planet holds a piece of our story.']
};

export const THEME = {
  deep: 0x060a24,
  navy: 0x0a103a,
  violet: 0x7c6cff,
  lavender: 0xcfc3ff,
  pink: 0xff9ad5,
  champagne: 0xf7e7ce,
  gold: 0xffd88a
};

export const DATE_DOT = (() => {
  const d = new Date(WEDDING_DATE);
  return `${String(d.getDate()).padStart(2, '0')} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${d.getFullYear()}`;
})();
