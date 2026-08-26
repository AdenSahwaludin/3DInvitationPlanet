function detect() {
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const w = innerWidth;
  const h = innerHeight;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  let tier = 'high';
  if (isTouch && Math.min(w, h) < 820) tier = 'low';
  else if (isTouch || cores <= 4 || mem <= 4) tier = 'medium';
  if (w * h * devicePixelRatio > 4200000) tier = tier === 'high' ? 'medium' : tier;
  return {
    tier,
    isTouch,
    dpr: Math.min(devicePixelRatio || 1, tier === 'low' ? 1.3 : tier === 'medium' ? 1.75 : 2),
    stars: tier === 'low' ? 2200 : tier === 'medium' ? 4200 : 7000,
    farStars: tier === 'low' ? 900 : tier === 'medium' ? 1600 : 2600,
    dust: tier === 'low' ? 260 : tier === 'medium' ? 500 : 900,
    orbitParticles: tier === 'low' ? 42 : tier === 'medium' ? 80 : 130,
    asteroids: tier === 'low' ? 26 : tier === 'medium' ? 46 : 70,
    nebulae: tier === 'low' ? 5 : tier === 'medium' ? 8 : 11,
    antialias: tier !== 'low',
    trailParticles: tier === 'low' ? 70 : 150
  };
}

export const QUALITY = detect();
