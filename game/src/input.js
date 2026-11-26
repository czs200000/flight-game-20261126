// input.js — keyboard and mouse, nothing else. The game reads this plain
// object each frame; this file never touches the canvas or the plane.
export function createInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    throttle: false,
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
    pressed: {}, // edge-triggered keys, consumed by main.js
  };

  function key(e, down) {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
    if (k === 'arrowleft' || k === 'a') input.left = down;
    if (k === 'arrowright' || k === 'd') input.right = down;
    if (k === 'arrowup' || k === 'w') input.up = down;
    if (k === 'arrowdown' || k === 's') input.down = down;
    if (k === 'shift') input.throttle = down;
    if (down && !e.repeat) input.pressed[k] = true;
  }

  window.addEventListener('keydown', (e) => key(e, true));
  window.addEventListener('keyup', (e) => key(e, false));

  function pointer(e) {
    const r = canvas.getBoundingClientRect();
    input.pointerX = ((e.clientX - r.left) / r.width) * 1280;
    input.pointerY = ((e.clientY - r.top) / r.height) * 720;
  }
  canvas.addEventListener('pointerdown', (e) => { input.pointerDown = true; pointer(e); });
  window.addEventListener('pointermove', (e) => { if (input.pointerDown) pointer(e); });
  window.addEventListener('pointerup', () => { input.pointerDown = false; });

  return input;
}
