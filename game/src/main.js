// main.js — the game loop and the state machine. It wires input, world and
// render together and owns nothing else.
import { VIEW_W, VIEW_H, SORTIE_SECONDS } from './config.js';
import { createInput } from './input.js';
import { buildWorld, createPlane, stepWorld } from './world.js';
import { render } from './render.js';
import { stagedState } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const shot = params.get('shot') || '';

const world = buildWorld(seed);
const input = createInput(canvas);

let state = 'start';
let plane = createPlane();
let timeLeft = SORTIE_SECONDS;
let paused = false;
let last = performance.now();
let t = 0;

// A ?shot=… URL stages one frozen frame for a screenshot, then holds it.
const staged = shot ? stagedState(shot, world) : null;
if (staged) {
  state = staged.state;
  plane = staged.plane;
  timeLeft = staged.timeLeft;
}

function setStatus(text) {
  status.textContent = text;
}

function startSortie() {
  plane = createPlane();
  world.rings.forEach((r) => { r.passed = false; r.missed = false; r.z = r.z0; });
  world.storms.forEach((s) => { s.hit = false; });
  world.runwayZ = world.runwayZ0;
  world.distance = 0;
  timeLeft = SORTIE_SECONDS;
  state = 'fly';
  paused = false;
  setStatus('Flying. Fly through the orange rings, then land on runway 04.');
}

function togglePause() {
  if (state !== 'fly') return;
  paused = !paused;
  setStatus(paused ? 'Paused.' : 'Flying.');
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;

  if (!staged) {
    if (input.pressed[' ']) {
      if (state === 'start') startSortie();
      else togglePause();
    }
    if (input.pressed['r'] && state !== 'start') startSortie();
    if (input.pressed['p'] && state === 'fly') togglePause();
    if (input.pressed['enter'] && state === 'start') startSortie();
    input.pressed = {};

    if (state === 'fly' && !paused) {
      if (plane.flashT > 0) plane.flashT -= dt;
      timeLeft -= dt;
      const event = stepWorld(world, plane, input, dt, timeLeft);
      if (event === 'landed') { state = 'landed'; setStatus(`Landed. Final score ${plane.score}.`); }
      else if (event === 'crash' || event === 'timeout') {
        state = event === 'timeout' ? 'timeout' : 'crash';
        setStatus(`${plane.flash}. Final score ${plane.score}. Press R to fly again.`);
      }
    }
  } else if (plane.flashT > 0) {
    plane.flashT = 99; // keep the staged flash lit for the screenshot
  }

  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  render(ctx, world, plane, state, timeLeft, t);
  requestAnimationFrame(frame);
}

canvas.addEventListener('click', () => {
  if (staged) return;
  if (state === 'start') startSortie();
  else if (state === 'landed' || state === 'crash' || state === 'timeout') startSortie();
});

setStatus('Skyline Courier. Press Space or click to take off.');
requestAnimationFrame(frame);
