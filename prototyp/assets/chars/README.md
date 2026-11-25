# Kagewell character sprites — chars-v1

> **In use since 25.11.2026: `game-6x/`.** The game now loads the soft 3D toon set from `game-6x/` (generated with Higgsfield, GPT Image 2.6, style sample "B", then aligned so the barrel sits where the old barrel sat). Each file is drawn at twice the @3x canvas; the canvas sizes, pivots and rope points live in `CHAR_PIV` in `prototyp/game.js`, still in @3x units. Everything below describes the older chars-v1 set (`game-3x/`, `256/`, `512/`, `expressions/`), which the game no longer loads.

Illustrated PNG sprites for Kiro and Tara, direction B (game-sprite crisp), following `CHARAKTER-KIRO-TARA.md` and the 23.11.2026 doc audit.
Transparent backgrounds. Game canvases are @3x CSS sizes from the brief. Pivots are in `pivots.json` as `[x, y]` on that canvas (pixels from the top-left).

Rope in the barrel / hang sprites is a short stub; draw the long well rope in code and attach it at the barrel top (or at the chest-rope pivot when Kiro has no barrel).

## Poses

| Pose | game-3x file | size | pivot (x,y) | pivot kind | 512 file | 512 size | 256 file | 256 size |
|---|---|---|---|---|---|---|---|---|
| Kiro idle in barrel (gameplay ready) | `game-3x/kiro-barrel-idle.png` | 240×288 | (120, 206) | barrel_center | `512/kiro-barrel-idle.png` | 492×512 | `256/kiro-barrel-idle.png` | 246×256 |
| Kiro in barrel on the well rope (title, curious/cautious/brave) | `game-3x/kiro-barrel-title.png` | 240×288 | (120, 196) | barrel_center | `512/kiro-barrel-title.png` | 435×512 | `256/kiro-barrel-title.png` | 218×256 |
| Kiro swinging in the barrel, scarf back | `game-3x/kiro-barrel-swing.png` | 240×288 | (120, 205) | barrel_center | `512/kiro-barrel-swing.png` | 484×512 | `256/kiro-barrel-swing.png` | 242×256 |
| Kiro slashing from the barrel | `game-3x/kiro-barrel-slash.png` | 240×288 | (120, 211) | barrel_center | `512/kiro-barrel-slash.png` | 525×512 | `256/kiro-barrel-slash.png` | 263×256 |
| Kiro ducked into the barrel (wall contact) | `game-3x/kiro-barrel-duck.png` | 240×288 | (120, 220) | barrel_center | `512/kiro-barrel-duck.png` | 595×512 | `256/kiro-barrel-duck.png` | 298×256 |
| Kiro hanging on the rope, no barrel | `game-3x/kiro-hang-nobarrel.png` | 156×216 | (78, 91) | chest_rope | `512/kiro-hang-nobarrel.png` | 332×512 | `256/kiro-hang-nobarrel.png` | 166×256 |
| Kiro lying down after a faint (swirl eyes) | `game-3x/kiro-lying-faint.png` | 360×180 | (180, 98) | torso | `512/kiro-lying-faint.png` | 853×512 | `256/kiro-lying-faint.png` | 426×256 |
| Kiro sitting up after a faint | `game-3x/kiro-situp-proud.png` | 216×216 | (108, 149) | hips | `512/kiro-situp-proud.png` | 454×512 | `256/kiro-situp-proud.png` | 227×256 |
| Tara standing ready, winch-crank hand pose | `game-3x/tara-winch-ready.png` | 210×270 | (105, 264) | feet | `512/tara-winch-ready.png` | 229×512 | `256/tara-winch-ready.png` | 115×256 |
| Tara bending close over fainted Kiro | `game-3x/tara-bends-over-kiro.png` | 360×270 | (180, 148) | kiro_torso | `512/tara-bends-over-kiro.png` | 554×512 | `256/tara-bends-over-kiro.png` | 277×256 |

## Expressions

Face/bust variants of the same head. No game-canvas pivot (composite onto the matching pose).

| Expression | file | size |
|---|---|---|
| Kiro expression: focused | `expressions/kiro-focused.png` | 213×252 |
| Kiro expression: smirk | `expressions/kiro-smirk.png` | 214×252 |
| Kiro expression: fall-panic | `expressions/kiro-fall-panic.png` | 214×251 |
| Kiro expression: slash-shout | `expressions/kiro-slash-shout.png` | 215×251 |
| Kiro expression: dizzy / faint | `expressions/kiro-dizzy.png` | 214×249 |
| Kiro expression: proud | `expressions/kiro-proud.png` | 215×250 |
| Tara expression: encouraging | `expressions/tara-encouraging.png` | 210×384 |
| Tara expression: winch-effort | `expressions/tara-winch-effort.png` | 192×382 |
| Tara expression: concerned | `expressions/tara-concerned.png` | 215×380 |
| Tara expression: relieved | `expressions/tara-relieved.png` | 216×377 |
| Tara expression: laughing | `expressions/tara-laughing.png` | 225×374 |
| Tara expression: cheering | `expressions/tara-cheering.png` | 211×375 |

## Pivot kinds

- `barrel_center` — center of the barrel; the rope attaches at the barrel top.
- `chest_rope` — chest / rope-grip, for Kiro without a barrel.
- `hips` — sit-up pose.
- `torso` — lying faint.
- `feet` — between Tara’s feet, standing.
- `kiro_torso` — faint-scene pair, on Kiro’s torso.

## Notes

- 512-px set is palette-compressed (pngquant, high quality) to keep the pack under 4 MB; game-3x and 256 stay full-color PNG.
- Scarf-end layers are not in this pack (automatic splits were not clean enough for code animation).
- Outlines were shifted toward warm `#3A2418`; they may still sit a little darker than the swatch on some edges.
