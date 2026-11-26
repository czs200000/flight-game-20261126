// world.js — the valley, the rings, the storms and the runway: what the
// sortie is flown through, and the physics that moves the Kestrel through it.
// Rendering lives in render.js; this file only builds and steps the world.
import {
  START_ALT_FT, START_SPEED_KT, START_FUEL, MIN_SPEED_KT, MAX_SPEED_KT,
  MIN_ALT_FT, MAX_ALT_FT, RING_COUNT, RING_SCORE, RING_FUEL_BONUS,
  MISS_PENALTY, STORM_FUEL_COST,
} from './config.js';
import { mulberry32, range } from './random.js';

export function buildWorld(seed) {
  const rng = mulberry32(seed);
  // Hills: a ridge line across the valley, drawn as overlapping peaks.
  const hills = [];
  for (let i = 0; i < 26; i++) {
    hills.push({
      x: rng() * 2 - 0.5, // 0..1 across the view, extra at the edges
      h: range(rng, 60, 190),
      w: range(rng, 180, 420),
      green: Math.floor(range(rng, 0, 3)),
    });
  }
  // Trees and houses dotted on the near ground, placed by the same seed.
  const trees = [];
  for (let i = 0; i < 70; i++) trees.push({ x: rng(), y: range(rng, 0.55, 1), s: range(rng, 0.6, 1.6) });
  const houses = [];
  for (let i = 0; i < 9; i++) houses.push({ x: range(rng, 0.08, 0.92), y: range(rng, 0.62, 0.9), w: range(rng, 22, 40) });
  // Clouds: soft drifters, plus a few dark storm cells to avoid.
  const clouds = [];
  for (let i = 0; i < 12; i++) {
    clouds.push({ x: rng(), y: range(rng, 0.05, 0.42), s: range(rng, 0.7, 1.8), v: range(rng, 4, 12) });
  }
  const storms = [];
  for (let i = 0; i < 5; i++) {
    storms.push({ x: range(rng, 0.15, 0.85), y: range(rng, 0.12, 0.38), r: range(rng, 46, 78), v: range(rng, 6, 14), hit: false });
  }
  // The mail rings: a gentle slalom over the river, each with a height to hit.
  const rings = [];
  let z = 900;
  for (let i = 0; i < RING_COUNT; i++) {
    rings.push({
      x: range(rng, -0.55, 0.55),
      alt: range(rng, 500, 1900),
      z,
      z0: z, // start distance, so a restart can put the rings back
      passed: false,
      missed: false,
    });
    z += range(rng, 750, 950);
  }
  const runwayZ = z + 1400;
  return {
    seed, hills, trees, houses, clouds, storms, rings, runwayZ, runwayZ0: runwayZ,
    distance: 0, // metres flown, grows with speed
  };
}

export function createPlane() {
  return {
    x: 0,            // lateral offset, -1 left .. 1 right
    alt: START_ALT_FT,
    speed: START_SPEED_KT,
    heading: 42,     // degrees, Meadowfield is 042
    fuel: START_FUEL,
    bank: 0,         // visual + turn roll, -1..1
    pitch: 0,
    throttle: 0.55,
    score: 0,
    ringsHit: 0,
    ringsMissed: 0,
    flash: '',       // centre-screen message, set by events
    flashT: 0,
  };
}

// Step the sortie by dt seconds. Returns an event string: '' | 'ring' |
// 'miss' | 'storm' | 'landed' | 'crash' | 'timeout' — main.js turns it into
// the end screen and the score.
export function stepWorld(world, plane, input, dt, timeLeft) {
  // Throttle: Shift for full power, otherwise hold near cruise.
  const targetThrottle = input.throttle ? 1 : 0.55;
  plane.throttle += (targetThrottle - plane.throttle) * Math.min(1, dt * 1.5);
  const targetSpeed = 80 + plane.throttle * 140;
  plane.speed += (targetSpeed - plane.speed) * Math.min(1, dt * 0.5);
  plane.speed = Math.max(MIN_SPEED_KT, Math.min(MAX_SPEED_KT, plane.speed));

  // Steering: keys bank the plane; the pointer pulls it toward the drag.
  let steer = 0;
  if (input.left) steer -= 1;
  if (input.right) steer += 1;
  if (input.pointerDown) steer += Math.max(-1, Math.min(1, (input.pointerX - 640) / 420));
  plane.bank += (steer * 0.7 - plane.bank) * Math.min(1, dt * 3);
  plane.x += plane.bank * dt * 0.55;
  plane.x = Math.max(-1.15, Math.min(1.15, plane.x));
  plane.heading = (42 + plane.x * 38 + 360) % 360;

  // Pitch: climb costs speed and fuel, diving buys speed back.
  let pitch = 0;
  if (input.up) pitch += 1;
  if (input.down) pitch -= 1;
  if (input.pointerDown) pitch += Math.max(-1, Math.min(1, (360 - input.pointerY) / 260));
  plane.pitch += (pitch * 0.6 - plane.pitch) * Math.min(1, dt * 3);
  plane.alt += plane.pitch * dt * 260 - (plane.speed < 90 ? (90 - plane.speed) * dt * 6 : 0);
  plane.alt = Math.max(60, Math.min(MAX_ALT_FT, plane.alt));

  // Fuel burns with throttle; rings pay a little back. A brisk sortie
  // lands with roughly half a tank; dawdling or storms can still strand you.
  plane.fuel -= dt * (0.45 + plane.throttle * 0.45);
  world.distance += plane.speed * 0.514 * dt;

  // Clouds drift; storms drift faster and sting when flown through.
  for (const c of world.clouds) { c.x += (c.v * dt) / 1280; if (c.x > 1.15) c.x = -0.15; }
  for (const s of world.storms) {
    s.x += (s.v * dt) / 1280; if (s.x > 1.2) s.x = -0.2;
    const dx = Math.abs(s.x * 1280 - 640 - plane.x * 420);
    const dy = Math.abs(s.y * 720 - (330 - plane.alt / 8));
    if (!s.hit && dx < s.r && dy < s.r * 0.7) {
      s.hit = true;
      plane.fuel = Math.max(0, plane.fuel - STORM_FUEL_COST);
      plane.flash = 'STORM!  −6 FUEL';
      plane.flashT = 1.6;
      return 'storm';
    }
  }

  // Rings approach at speed: the whole course slides past the plane, so
  // every ring ahead closes in each frame, not just the nearest one.
  const speedMs = plane.speed * 0.514;
  for (const ring of world.rings) {
    if (ring.passed || ring.missed) continue;
    ring.z -= speedMs * dt;
  }
  for (const ring of world.rings) {
    if (ring.passed || ring.missed) continue;
    if (ring.z <= 0) {
      const dx = Math.abs(ring.x - plane.x);
      const dAlt = Math.abs(ring.alt - plane.alt);
      if (dx < 0.22 && dAlt < 260) {
        ring.passed = true;
        plane.ringsHit += 1;
        plane.score += RING_SCORE;
        plane.fuel = Math.min(100, plane.fuel + RING_FUEL_BONUS);
        plane.flash = `RING ${plane.ringsHit}/${RING_COUNT}  +${RING_SCORE}`;
        plane.flashT = 1.6;
        return 'ring';
      }
      ring.missed = true;
      plane.ringsMissed += 1;
      plane.score = Math.max(0, plane.score - MISS_PENALTY);
      plane.flash = `RING MISSED  −${MISS_PENALTY}`;
      plane.flashT = 1.6;
      return 'miss';
    }
    break; // only the nearest ring can be reached this frame
  }

  // The runway is part of the same world: it slides closer all sortie,
  // but it can only be landed on once the rings are done.
  world.runwayZ -= speedMs * dt;
  const ringsDone = plane.ringsHit + plane.ringsMissed >= RING_COUNT;
  if (ringsDone) {
    if (world.runwayZ <= 0) {
      const aligned = Math.abs(plane.x) < 0.3 && plane.alt < 420 && plane.speed < 165;
      if (aligned) {
        plane.score += Math.round(plane.fuel) * 5 + 150;
        plane.flash = 'TOUCHDOWN — WELCOME TO MEADOWFIELD';
        plane.flashT = 3;
        return 'landed';
      }
      plane.flash = plane.alt >= 420 ? 'TOO HIGH FOR THE RUNWAY' : 'OFF CENTRELINE — OVERSHOT';
      plane.flashT = 3;
      return 'crash';
    }
  }

  if (plane.fuel <= 0) { plane.flash = 'OUT OF FUEL'; plane.flashT = 3; return 'crash'; }
  if (plane.alt <= MIN_ALT_FT + 4 && !ringsDone) { plane.flash = 'TERRAIN — TOO LOW'; plane.flashT = 3; return 'crash'; }
  if (plane.alt <= MIN_ALT_FT + 4 && ringsDone && world.runwayZ > 400) { plane.flash = 'TERRAIN — TOO LOW'; plane.flashT = 3; return 'crash'; }
  if (timeLeft <= 0) { plane.flash = 'OUT OF TIME'; plane.flashT = 3; return 'timeout'; }
  return '';
}

export function nextRing(world) {
  return world.rings.find((r) => !r.passed && !r.missed) || null;
}

export function runwayDistance(world) {
  const ringsDone = world.rings.every((r) => r.passed || r.missed);
  return ringsDone ? Math.max(0, Math.round(world.runwayZ)) : null; // runwayZ is already in metres
}
