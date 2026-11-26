// render.js — everything the pilot sees: sky, valley, runway, rings, the
// Kestrel itself, the lit instruments and the start / end screens. It reads
// world + plane and never changes them.
import { VIEW_W, VIEW_H, HORIZON_Y, GAME_NAME, PLANE_NAME, AIRFIELD, RING_COUNT, CONTROLS } from './config.js';
import { nextRing, runwayDistance } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8, 18, 28, 0.72)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function label(ctx, text, x, y, size, color, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px 'Courier New', monospace`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawSky(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
  g.addColorStop(0, '#2a4d7f');
  g.addColorStop(0.45, '#7fb2e5');
  g.addColorStop(0.8, '#ffd9a0');
  g.addColorStop(1, '#ffe9c4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, HORIZON_Y + 40);
  // Low sun, dawn over the valley.
  const sx = 1010, sy = 150;
  const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 150);
  glow.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 190, 90, 0.45)');
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 160, sy - 160, 320, 320);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.arc(sx, sy, 34, 0, Math.PI * 2); ctx.fill();
  // Birds, far off, for scale.
  ctx.strokeStyle = 'rgba(40, 50, 70, 0.8)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const bx = 240 + i * 46 + Math.sin(t * 0.4 + i) * 8;
    const by = 120 + i * 18;
    ctx.beginPath();
    ctx.moveTo(bx - 9, by); ctx.quadraticCurveTo(bx - 3, by - 6, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 6, bx + 9, by);
    ctx.stroke();
  }
}

function drawClouds(ctx, world, plane) {
  for (const c of world.clouds) {
    const x = c.x * VIEW_W - plane.x * 60 * c.s;
    const y = c.y * VIEW_H;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const [dx, dy, r] of [[0, 0, 34], [-30, 8, 24], [32, 8, 26], [-12, -12, 22], [16, -10, 20]]) {
      ctx.beginPath(); ctx.arc(x + dx * c.s, y + dy * c.s, r * c.s, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const s of world.storms) {
    const x = s.x * VIEW_W - plane.x * 90;
    const y = s.y * VIEW_H;
    ctx.fillStyle = 'rgba(52, 58, 74, 0.92)';
    for (const [dx, dy, r] of [[0, 0, 40], [-36, 10, 28], [38, 10, 30], [-14, -16, 26], [18, -14, 24]]) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffd34d';
    ctx.font = "700 13px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('⚡ STORM', x, y + 58);
  }
}

function drawTerrain(ctx, world, plane) {
  const shift = -plane.x * 90;
  // Far ridge, hazy blue.
  ctx.fillStyle = '#7d9cc4';
  ctx.beginPath(); ctx.moveTo(0, HORIZON_Y);
  for (let x = 0; x <= VIEW_W; x += 80) {
    ctx.lineTo(x, HORIZON_Y - 46 - 34 * Math.sin((x + shift * 0.4) * 0.006 + 1.2));
  }
  ctx.lineTo(VIEW_W, HORIZON_Y); ctx.closePath(); ctx.fill();
  // Near hills, two greens.
  const greens = ['#5d8a4a', '#4c7a3e', '#6b9a52'];
  for (const hill of world.hills) {
    const cx = hill.x * VIEW_W + shift * (0.5 + hill.h / 200);
    const base = HORIZON_Y + 26;
    ctx.fillStyle = greens[hill.green];
    ctx.beginPath();
    ctx.ellipse(cx, base + hill.h * 0.4, hill.w, hill.h, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  // Valley floor.
  const g = ctx.createLinearGradient(0, HORIZON_Y, 0, VIEW_H);
  g.addColorStop(0, '#8fae5f'); g.addColorStop(0.5, '#6f9a4e'); g.addColorStop(1, '#557f3c');
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON_Y + 10, VIEW_W, VIEW_H - HORIZON_Y - 10);
  // Winding river, catching the sun.
  ctx.strokeStyle = '#9fd0e8';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(640 + shift, HORIZON_Y + 8);
  ctx.bezierCurveTo(560 + shift, 430, 760 + shift, 520, 620 + shift, 640);
  ctx.bezierCurveTo(540 + shift, 700, 700 + shift, 700, 660 + shift, VIEW_H);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(640 + shift, HORIZON_Y + 8);
  ctx.bezierCurveTo(560 + shift, 430, 760 + shift, 520, 620 + shift, 640);
  ctx.stroke();
  // Field patches.
  ctx.fillStyle = 'rgba(214, 178, 94, 0.55)';
  for (const [fx, fy, fw, fh] of [[120, 420, 150, 60], [900, 460, 180, 70], [330, 560, 200, 80], [980, 600, 170, 60]]) {
    ctx.fillRect(fx + shift * 0.6, fy, fw, fh);
  }
  // Town: Meadowfield village.
  for (const h of world.houses) {
    const x = h.x * VIEW_W + shift * 0.8;
    const y = HORIZON_Y + h.y * (VIEW_H - HORIZON_Y - 60);
    ctx.fillStyle = '#f2e6c8'; ctx.fillRect(x, y, h.w, h.w * 0.6);
    ctx.fillStyle = '#b0492f';
    ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + h.w / 2, y - h.w * 0.4); ctx.lineTo(x + h.w + 3, y); ctx.closePath(); ctx.fill();
  }
  // Trees on the near ground.
  for (const tr of world.trees) {
    const x = tr.x * VIEW_W + shift;
    const y = HORIZON_Y + 30 + tr.y * (VIEW_H - HORIZON_Y - 40);
    ctx.fillStyle = '#3d6b2f';
    ctx.beginPath(); ctx.arc(x, y - 12 * tr.s, 11 * tr.s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b4632'; ctx.fillRect(x - 2, y - 4, 4, 10 * tr.s);
  }
}

function drawRunway(ctx, world, plane) {
  const dist = runwayDistance(world);
  if (dist === null) return;
  const cx = 640 - plane.x * 260;
  const near = Math.max(0, Math.min(1, 1 - world.runwayZ / 2600));
  const topW = 26 + near * 30;
  const botW = 90 + near * 320;
  const topY = HORIZON_Y + 6;
  const botY = VIEW_H - 96;
  // Strip.
  ctx.fillStyle = '#3a3f46';
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, topY); ctx.lineTo(cx + topW / 2, topY);
  ctx.lineTo(cx + botW / 2, botY); ctx.lineTo(cx - botW / 2, botY);
  ctx.closePath(); ctx.fill();
  // Centreline dashes.
  ctx.strokeStyle = '#f5f5f5';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const t0 = i / 5, t1 = (i + 0.45) / 5;
    const y0 = topY + (botY - topY) * t0, y1 = topY + (botY - topY) * t1;
    const x = cx;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
  }
  // Threshold bars + runway number.
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(cx - topW / 2 + 3, topY + 4, topW - 6, 4);
  label(ctx, '04', cx, botY - 14, 26, '#ffffff', 'center');
  label(ctx, `RUNWAY ${dist} m`, cx, topY - 12, 18, '#ffe9a8', 'center');
}

function drawRings(ctx, world, plane) {
  const ring = nextRing(world);
  if (!ring) return;
  for (const r of world.rings) {
    if (r.passed || r.missed || r.z > 1100) continue;
    const depth = Math.max(0, 1 - r.z / 1100);
    const scale = 0.25 + depth * 1.5;
    const sx = 640 + (r.x - plane.x) * 360 * (0.4 + depth);
    const sy = HORIZON_Y - (r.alt - plane.alt) * 0.085 * (0.4 + depth) + depth * 60;
    const rad = 30 * scale + 14;
    const isNext = r === ring;
    ctx.save();
    ctx.strokeStyle = isNext ? '#ff9d2e' : 'rgba(255, 157, 46, 0.45)';
    ctx.lineWidth = isNext ? 10 : 6;
    ctx.shadowColor = '#ff9d2e';
    ctx.shadowBlur = isNext ? 22 : 6;
    ctx.beginPath(); ctx.ellipse(sx, sy, rad, rad * 0.82, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    if (isNext) {
      label(ctx, `RING ${plane.ringsHit + 1}/${RING_COUNT}`, sx, sy - rad - 14, 17, '#ffd34d', 'center');
      label(ctx, `${Math.max(0, Math.round(r.z / 1.85))} m`, sx, sy + rad + 22, 15, '#ffffff', 'center');
    }
  }
}

function drawAircraft(ctx, plane, t) {
  const cx = 640 + plane.bank * 46;
  const cy = 520 - plane.pitch * 26 + Math.sin(t * 2.2) * 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(plane.bank * 0.45);
  // Wings.
  ctx.fillStyle = '#e8542f';
  roundRect(ctx, -168, -6, 336, 26, 12); ctx.fill();
  ctx.fillStyle = '#f6f1e6';
  roundRect(ctx, -168, -6, 336, 8, 6); ctx.fill();
  // Nav lights.
  ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(-166, 6, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2fd44f'; ctx.beginPath(); ctx.arc(166, 6, 6, 0, Math.PI * 2); ctx.fill();
  // Fuselage, seen from behind and slightly above.
  const body = ctx.createLinearGradient(0, -70, 0, 60);
  body.addColorStop(0, '#ff8a4d'); body.addColorStop(0.55, '#e8542f'); body.addColorStop(1, '#a83a1c');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, -6, 46, 78, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail fin + stabilisers.
  ctx.fillStyle = '#e8542f';
  ctx.beginPath(); ctx.moveTo(-14, -70); ctx.lineTo(0, -118); ctx.lineTo(14, -70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath(); ctx.moveTo(-6, -118); ctx.lineTo(0, -128); ctx.lineTo(6, -118); ctx.closePath(); ctx.fill();
  roundRect(ctx, -64, -52, 128, 14, 7); ctx.fill();
  // Canopy glint and Kestrel mark.
  ctx.fillStyle = 'rgba(180, 225, 255, 0.9)';
  ctx.beginPath(); ctx.ellipse(0, -34, 20, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = "700 15px 'Courier New', monospace";
  ctx.textAlign = 'center';
  ctx.fillText('KESTREL', 0, 34);
  // Prop blur, spinning.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 5;
  const a = t * 18;
  ctx.beginPath(); ctx.ellipse(0, -6, 54, 10, a % Math.PI, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawCompass(ctx, plane) {
  const cx = 640, y = 46;
  panel(ctx, cx - 190, y - 22, 380, 44);
  ctx.save();
  ctx.beginPath(); ctx.rect(cx - 190, y - 22, 380, 44); ctx.clip();
  const points = [['N', 0], ['E', 90], ['S', 180], ['W', 270], ['N', 360]];
  for (const [name, deg] of points) {
    const dx = ((deg - plane.heading + 540) % 360 - 180) * 2.1;
    if (Math.abs(dx) > 185) continue;
    label(ctx, name, cx + dx, y + 8, 18, '#7fe3ff', 'center');
  }
  for (let d = 0; d < 360; d += 15) {
    const dx = ((d - plane.heading + 540) % 360 - 180) * 2.1;
    if (Math.abs(dx) > 185) continue;
    ctx.strokeStyle = 'rgba(127,227,255,0.6)';
    ctx.beginPath(); ctx.moveTo(cx + dx, y - 18); ctx.lineTo(cx + dx, y - 8); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath(); ctx.moveTo(cx - 7, y - 24); ctx.lineTo(cx + 7, y - 24); ctx.lineTo(cx, y - 12); ctx.closePath(); ctx.fill();
}

function drawHud(ctx, plane, timeLeft, world, state) {
  // Top-left instruments.
  panel(ctx, 18, 18, 240, 108);
  label(ctx, 'ALT', 34, 48, 13, '#7fe3ff');
  label(ctx, `${Math.round(plane.alt)} FT`, 34, 76, 26, '#ffffff');
  label(ctx, 'SPD', 34, 100, 13, '#7fe3ff');
  label(ctx, `${Math.round(plane.speed)} KT`, 34, 122, 26, '#ffffff');
  // Heading under the compass.
  label(ctx, `HDG ${String(Math.round(plane.heading)).padStart(3, '0')}°`, 640, 82, 16, '#ffd34d', 'center');
  drawCompass(ctx, plane);
  // Top-right: score, rings, fuel, time.
  panel(ctx, VIEW_W - 258, 18, 240, 108);
  label(ctx, 'SCORE', VIEW_W - 242, 48, 13, '#7fe3ff');
  label(ctx, `${plane.score}`, VIEW_W - 242, 76, 26, '#ffffff');
  label(ctx, `RINGS ${plane.ringsHit}/${RING_COUNT}   ⏱ ${Math.max(0, Math.ceil(timeLeft))}s`, VIEW_W - 242, 100, 14, '#ffd34d');
  const fuelW = 208;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, VIEW_W - 242, 112, fuelW, 8, 4); ctx.fill();
  ctx.fillStyle = plane.fuel > 25 ? '#2fd44f' : '#ff3b30';
  roundRect(ctx, VIEW_W - 242, 112, fuelW * Math.max(0, plane.fuel / 100), 8, 4); ctx.fill();
  // Bottom instrument panel: attitude + throttle.
  ctx.fillStyle = 'rgba(10, 16, 24, 0.88)';
  ctx.fillRect(0, VIEW_H - 96, VIEW_W, 96);
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.4)';
  ctx.beginPath(); ctx.moveTo(0, VIEW_H - 96); ctx.lineTo(VIEW_W, VIEW_H - 96); ctx.stroke();
  // Attitude indicator.
  const ax = 90, ay = VIEW_H - 48, ar = 34;
  ctx.save();
  ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.clip();
  ctx.translate(ax, ay);
  ctx.rotate(-plane.bank * 0.45);
  ctx.translate(0, plane.pitch * 18);
  ctx.fillStyle = '#3d7ec2'; ctx.fillRect(-ar, -ar, ar * 2, ar);
  ctx.fillStyle = '#8a5a2e'; ctx.fillRect(-ar, 0, ar * 2, ar);
  ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-ar, 0); ctx.lineTo(ar, 0); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath(); ctx.moveTo(ax - 14, ay); ctx.lineTo(ax + 14, ay); ctx.lineTo(ax, ay + 8); ctx.closePath(); ctx.fill();
  label(ctx, 'ATTITUDE', ax, ay + 46, 11, '#7fe3ff', 'center');
  // Throttle gauge.
  const tx = 210;
  label(ctx, 'THROTTLE', tx, VIEW_H - 74, 12, '#7fe3ff');
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, tx, VIEW_H - 64, 170, 12, 6); ctx.fill();
  ctx.fillStyle = '#ff9d2e';
  roundRect(ctx, tx, VIEW_H - 64, 170 * plane.throttle, 12, 6); ctx.fill();
  label(ctx, `${Math.round(plane.throttle * 100)}%`, tx + 182, VIEW_H - 52, 14, '#ffffff');
  label(ctx, 'SHIFT = FULL POWER', tx, VIEW_H - 28, 11, '#8fa8bd');
  // Centre: mission line + flash (hidden once the sortie is over — the
  // end screen carries the result instead).
  if (state === 'fly' || state === 'start') {
    const dist = runwayDistance(world);
    const mission = dist !== null
      ? `FINAL APPROACH — RUNWAY ${dist} m — LAND GENTLE, SLOW & CENTRED`
      : `MISSION — RING ${Math.min(plane.ringsHit + 1, RING_COUNT)}/${RING_COUNT} — FLY THROUGH THE ORANGE RING`;
    label(ctx, mission, 640, VIEW_H - 66, 16, '#ffe9a8', 'center');
    label(ctx, '← → steer · ↑ ↓ climb · Shift throttle · Space pause', 730, VIEW_H - 40, 13, '#8fa8bd', 'center');
  }
  if (plane.flashT > 0 && (state === 'fly' || state === 'start')) {
    ctx.fillStyle = 'rgba(8, 18, 28, 0.78)';
    const w = ctx.measureText(plane.flash).width + 44;
    roundRect(ctx, 640 - w / 2 - 120, 150, w + 240, 46, 10); ctx.fill();
    label(ctx, plane.flash, 640, 182, 24, '#ffd34d', 'center');
  }
}

function drawStart(ctx, world) {
  ctx.fillStyle = 'rgba(6, 14, 24, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 290, 92, 700, 480);
  label(ctx, GAME_NAME, 640, 168, 54, '#ffffff', 'center');
  label(ctx, `— ${PLANE_NAME} RUN OVER THE VALLEY TO ${AIRFIELD} —`, 640, 200, 17, '#ffd34d', 'center');
  label(ctx, 'One sortie. Ten mail rings. One runway.', 640, 240, 18, '#cfe8ff', 'center');
  label(ctx, 'Fly through every orange ring, watch your fuel,', 640, 268, 15, '#cfe8ff', 'center');
  label(ctx, 'then land gentle on Meadowfield runway 04.', 640, 290, 15, '#cfe8ff', 'center');
  let y = 336;
  for (const [keys, what] of CONTROLS) {
    label(ctx, keys, 360, y, 15, '#7fe3ff');
    label(ctx, what, 560, y, 15, '#ffffff');
    y += 30;
  }
  label(ctx, '▶  CLICK OR PRESS SPACE TO TAKE OFF', 640, 540, 20, '#2fd44f', 'center');
  label(ctx, 'A complete original flight game — no network, no downloads.', 640, 566, 12, '#8fa8bd', 'center');
}

function drawEnd(ctx, plane, state, timeLeft, world) {
  ctx.fillStyle = 'rgba(6, 14, 24, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 340, 150, 600, 380);
  const landed = state === 'landed';
  const title = landed ? '✈  LANDED AT MEADOWFIELD' : '✕  SORTIE OVER';
  label(ctx, title, 640, 216, 34, landed ? '#2fd44f' : '#ff6b5e', 'center');
  label(ctx, plane.flash || '', 640, 252, 17, '#ffd34d', 'center');
  const rows = [
    ['Rings flown', `${plane.ringsHit} / ${RING_COUNT}`],
    ['Rings missed', `${plane.ringsMissed}`],
    ['Fuel left', `${Math.max(0, Math.round(plane.fuel))}%`],
    ['Distance flown', `${(world.distance / 1000).toFixed(1)} km`],
    ['FINAL SCORE', `${plane.score}`],
  ];
  let y = 300;
  for (const [k, v] of rows) {
    label(ctx, k, 420, y, 17, '#7fe3ff');
    label(ctx, v, 860, y, 17, '#ffffff', 'right');
    y += 34;
  }
  label(ctx, 'Press R to fly the sortie again', 640, 500, 16, '#cfe8ff', 'center');
}

export function render(ctx, world, plane, state, timeLeft, t) {
  drawSky(ctx, t);
  drawTerrain(ctx, world, plane);
  drawRunway(ctx, world, plane);
  drawClouds(ctx, world, plane);
  drawRings(ctx, world, plane);
  if (state !== 'start') drawAircraft(ctx, plane, t);
  drawHud(ctx, plane, timeLeft, world, state);
  if (state === 'start') drawStart(ctx, world);
  if (state === 'landed' || state === 'crash' || state === 'timeout') drawEnd(ctx, plane, state, timeLeft, world);
}
