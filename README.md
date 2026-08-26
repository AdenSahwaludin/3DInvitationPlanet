# 🚀 Wedding Space Odyssey

An **interactive 3D wedding invitation** that plays like a cozy mini game.
Fly a cute rocket through a dreamy universe and discover **8 planets** — each one
holding a piece of the couple's story — ending at the **Forever Planet** finale.

> *"Two souls, one universe."* — **Arka & Celeste**

---

## ✨ Features

- 🎮 **Playable rocket** — WASD / Arrow keys + mouse look on desktop, virtual joystick + touch look on mobile
- 🪐 **9 hand-crafted 3D planets** (couple, story timeline, events, location, RSVP, gift, gallery, wishes, finale) with rings, moons, atmospheres, orbiting particles and holographic icons
- 🎬 **Cinematic opening** — dark screen, approaching rocket, title reveal, `LAUNCH OUR STORY` with warp-speed transition
- 🗺️ **Mini-map + full universe map** with discovered / undiscovered states
- 🏆 **Exploration progress** — `x / 8 planets discovered`, `UNIVERSE COMPLETE ✨` unlock, finale cinematic with fireworks
- 💫 **Easter eggs** — a tiny alien, drifting wedding rings, a mini spaceship, a heart constellation and hidden initials
- 🎵 **Procedural music & SFX** — dreamy space pads, engine hum, chimes, whooshes — all synthesized live (no audio files needed)
- 💌 **Working RSVP + Guest wishes** — persisted in `localStorage`
- 📋 **Copy account number** for wedding gifts, Google Maps button for the venue
- ⚡ **Performance tiers** — automatic quality detection (desktop / tablet / phone) + auto downgrade if FPS drops

## 🕹️ Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | `W A S D` / Arrow keys / left joystick | left-side virtual joystick |
| Boost | hold `Shift` | BOOST button |
| Enter orbit / interact | `E` or `Space` | ✦ ORBIT button |
| Look around | drag mouse | drag right side of screen |
| Zoom / overview | mouse wheel | pinch-free (map button) |
| Universe map | `M` | tap mini-map |
| Close panel | `Esc` / ✕ | ✕ |

**Goal:** fly close to a planet → press **ENTER ORBIT** → read the invitation section → close and explore on. Discover all 8 planets to unlock the golden **Forever Planet** finale.

## 🖥️ Run it

Any static file server works (ES modules need http, not `file://`):

```bash
npm start          # → http://localhost:5173
```

or

```bash
python -m http.server 5173
npx serve .
```

Then open the URL — on your phone too (same Wi-Fi). Deploy by uploading
`index.html`, `libs/`, `src/` (and `assets/` if you add photos) to any static
host: GitHub Pages, Netlify, Vercel, or a shared hosting panel.

> `node_modules` is **not** required for hosting — Three.js is vendored locally in `libs/three.module.js`.

## 💍 Customize everything

**All invitation content lives in one file: [`src/config.js`](src/config.js).**

```js
export const CONFIG = {
  bride: 'Celeste',
  groom: 'Arka',
  couple: 'Arka & Celeste',
  tagline: 'A Journey Written Among The Stars',
  hashtag: '#ArkaCelesteAmongTheStars',
  weddingDate: '2026-12-12T08:00:00+07:00',   // drives the countdown
  quote: 'Two souls, one universe.',
  couplePhoto: '',                             // e.g. './assets/couple.jpg'
  story: [ { year, title, icon, text }, ... ], // Story Planet timeline
  events: [ { name, date, time, place } ],     // Wedding Planet cards
  venue: { name, address, mapsQuery },         // Destination Planet + Maps button
  gifts: [ { bank, number, holder } ],         // Gift Planet copy buttons
  giftNote / giftAddress,
  photos: [ './assets/photos/1.jpg', ... ],    // Memory Galaxy (optional)
  seedWishes: [ { name, message } ],           // Wish Planet starter cards
  tutorialLines: [...]
};
```

- **Photos:** drop files into an `assets/` folder and list their paths in
  `CONFIG.photos` (gallery) and `CONFIG.couplePhoto` (Love Planet). Without
  photos the app generates romantic placeholder art automatically.
- **Names / date / venue / accounts:** just edit `config.js` — the 3D world,
  panels, countdown and maps link all update automatically.
- **Planet colors & layout:** see `DEFS` in [`src/objects/planets.js`](src/objects/planets.js).
- **Palette & UI:** CSS variables at the top of [`src/styles.css`](src/styles.css).

## 🗂️ Project structure

```
index.html            entry + import map
server.mjs            tiny zero-dependency static server (npm start)
libs/three.module.js  vendored Three.js r170
src/
  config.js           ✏️ EDIT ME — all invitation data
  styles.css          full UI theme (glassmorphism / holographic)
  core/               state bus, input (keys+joystick), audio synth, tweens, quality tiers
  graphics/           procedural canvas textures (planets, nebulae, frames…)
  world/              starfield, nebulae, asteroids, comets, meteors, warp lines
  objects/            rocket model, 9 planets, easter eggs
  game/               rocket physics + interactions, camera rig, finale
  ui/                 HUD, panels, minimap, opening cinematic
tests/                puppeteer smoke / E2E / mobile checks (dev only)
```

## 🧪 Dev tests (optional)

With Chrome installed:

```bash
npm start &                      # serve
node tests/e2e-test.mjs          # full gameplay loop (21 checks)
node tests/mobile-test.mjs       # touch layout + joystick flow
```

## 🛠️ Tech

Three.js (WebGL) · custom arcade space physics · WebAudio-synthesized
soundtrack · procedural Canvas textures · zero build step · zero external
requests at runtime (fonts degrade gracefully offline).
