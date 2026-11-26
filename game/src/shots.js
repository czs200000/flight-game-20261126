// shots.js — staged, repeatable states for the screenshots. These are real
// game states, built from the same world and plane the player flies: the
// camera never fakes a scene the game cannot reach.
//   ?shot=start  title screen over the valley
//   ?shot=mid    mid-sortie, ring 3 ahead, HUD live
//   ?shot=ring   the moment a ring is cleared, flash on screen
//   ?shot=land   final approach, runway ahead, gear down
//   ?shot=end    landed, score breakdown on screen
import { createPlane } from './world.js';

export function stagedState(shot, world) {
  const plane = createPlane();
  if (shot === 'start') {
    return { state: 'start', plane, timeLeft: 180 };
  }
  if (shot === 'mid') {
    plane.alt = 1250;
    plane.speed = 168;
    plane.score = 200;
    plane.ringsHit = 2;
    plane.fuel = 78;
    plane.x = -0.12;
    world.rings[0].passed = true;
    world.rings[1].passed = true;
    world.rings[2].z = 320;
    world.rings[2].x = 0.1;
    world.rings[2].alt = 1250;
    return { state: 'fly', plane, timeLeft: 132 };
  }
  if (shot === 'ring') {
    plane.alt = 1400;
    plane.speed = 182;
    plane.score = 300;
    plane.ringsHit = 3;
    plane.fuel = 82;
    plane.flash = 'RING 3/10  +100';
    plane.flashT = 99;
    world.rings[0].passed = true;
    world.rings[1].passed = true;
    world.rings[2].passed = true;
    world.rings[3].z = 700;
    world.rings[3].x = -0.2;
    world.rings[3].alt = 1500;
    return { state: 'fly', plane, timeLeft: 118 };
  }
  if (shot === 'land') {
    plane.alt = 320;
    plane.speed = 132;
    plane.score = 940;
    plane.ringsHit = 10;
    plane.fuel = 34;
    plane.x = 0.05;
    plane.throttle = 0.4;
    for (const r of world.rings) r.passed = true;
    world.runwayZ = 900;
    return { state: 'fly', plane, timeLeft: 41 };
  }
  if (shot === 'end') {
    plane.alt = 0;
    plane.speed = 0;
    plane.score = 1290;
    plane.ringsHit = 10;
    plane.fuel = 31;
    plane.flash = 'TOUCHDOWN — WELCOME TO MEADOWFIELD';
    plane.flashT = 99;
    for (const r of world.rings) r.passed = true;
    world.distance = 48200;
    world.runwayZ = 0; // on the strip: the runway is under the plane, not 10 km out
    return { state: 'landed', plane, timeLeft: 38 };
  }
  return null;
}
