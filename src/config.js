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
    { year: '2016', title: 'Awal Kenal', icon: '✨', text: 'Kisah kami berawal di tahun 2016, perkenalan sederhana yang membuka lembaran awal perjalanan penuh cerita.' },
    { year: '2022', title: 'Pertama Bertemu', icon: '☕', text: 'Semesta mempertemukan kami secara langsung. Momen tatap muka dan obrolan hangat yang meyakinkan langkah kami bersama.' },
    { year: '2024', title: 'Lamaran & Tunangan', icon: '💍', text: 'Mengikat komitmen dan janji suci di hadapan keluarga tercinta untuk melangkah ke jenjang yang lebih serius.' },
    { year: '2026', title: 'Hari Bahagia (Pernikahan)', icon: '💫', text: 'Mengawali babak baru kehidupan bersama, menyatukan dua insan dalam ikatan pernikahan yang abadi.' }
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
