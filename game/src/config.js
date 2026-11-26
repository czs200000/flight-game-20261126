// config.js — the one place for Skyline Courier's numbers and mission text.
// Nothing here draws or updates; it only names the world the other files use.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HORIZON_Y = 330;

export const GAME_NAME = 'Skyline Courier';
export const PLANE_NAME = 'Kestrel';
export const AIRFIELD = 'Meadowfield';

// Sortie limits. Fuel is the real clock: it decides, not the timer.
export const SORTIE_SECONDS = 180;
export const START_FUEL = 100;
export const START_ALT_FT = 900;
export const START_SPEED_KT = 120;
export const MIN_SPEED_KT = 70;
export const MAX_SPEED_KT = 220;
export const MIN_ALT_FT = 150;
export const MAX_ALT_FT = 2500;
export const RING_COUNT = 10;
export const RING_SCORE = 100;
export const RING_FUEL_BONUS = 3;
export const MISS_PENALTY = 10;
export const STORM_FUEL_COST = 6;

export const MISSIONS = [
  { id: 1, title: 'Ring Run', brief: 'Thread all 10 mail rings over the valley.' },
  { id: 2, title: 'River Drop', brief: 'Skim the river, keep the parcels dry.' },
  { id: 3, title: 'Final Approach', brief: 'Line up on Meadowfield runway and land gentle.' },
];

export const CONTROLS = [
  ['← →  /  A D', 'Bank and turn'],
  ['↑ ↓  /  W S', 'Climb and descend'],
  ['Shift', 'Full throttle'],
  ['Space', 'Take off / pause'],
  ['Mouse', 'Drag to steer toward the pointer'],
  ['R', 'Fly the sortie again'],
];
