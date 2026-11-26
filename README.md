# Skyline Courier — Kestrel Run

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/czs200000/flight-game-20261126/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/czs200000/flight-game-20261126/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Original flight game for the make.fun bounty **“Make the best flight game”** ($500, entries close 2026-11-28 08:57 Beijing time).

Entered on [make.fun](https://make.fun/bounty/best-flight-game-20261126-0057) — see the bounty page at https://make.fun/bounty/best-flight-game-20261126-0057.

## How to play

Open `game/index.html` in a desktop browser (Chrome). No server, no network requests — all files are local.

You are the Kestrel, a little orange courier plane over a dawn valley. One sortie: fly through all 10 orange mail rings, watch your fuel, then land gentle on Meadowfield runway 04.

- Click or press **Space** to take off.
- **← → / A D** bank and turn. **↑ ↓ / W S** climb and descend. **Shift** full throttle. **Space** pause. **R** fly again.
- Drag with the mouse to steer toward the pointer.
- Fly through a ring: **+100 points, +4 fuel**. Miss one: **−10**. Fly through a storm cell: **−6 fuel**.
- After the last ring the runway is ahead: land centred, slow (under 165 kt) and low (under 420 ft) for a touchdown bonus of 150 plus 5 per fuel percent left.
- Too low over the terrain, out of fuel, or out of time ends the sortie.

The HUD shows altitude (FT), speed (KT) and heading on a compass strip, plus score, rings, fuel and the sortie timer. The bottom panel holds a lit attitude indicator and throttle gauge.

## Build

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # Node 22.18+
# writes the playable game, screenshots and dossier.json to out/
# open out/game/index.html to play
```

`main.ts` only copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored library. It makes no network requests and never writes into the repository itself.

## Screenshot scenes

Open these URLs in Chrome (1280×720) to reproduce the screenshots in `screenshots/`:

- `game/index.html?shot=start` — title screen over the valley, controls listed (1-start.jpg)
- `game/index.html?shot=mid` — mid-sortie, ring 3 ahead, HUD live, storm cell in view (2-mid.jpg)
- `game/index.html?shot=land` — final approach, runway 04 ahead, 900 m out (3-land.jpg)
- `game/index.html?shot=end` — landed at Meadowfield, score breakdown (4-end.jpg)

## Licence

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=mn0d9xfv&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
