# Kagewell / Barrel Ninja — Final Rebuild Brief

**Date:** 23 November 2026 (Europe/Vienna)  
**Audience:** Cloud coding agent rebuilding `hasanbeg99/kagewell/prototyp/` from scratch  
**Authority:** Alu (project lead), binding decisions in `team-replies-2026-11-23.md`. Detail files in this same folder win on numbers and frames once this brief has resolved a conflict.  
**Do not invent features. Do not change `/index.html`, `/sw.js`, or `/manifest.json`. Do not open work in a new repository. Do not merge to `main` or deploy Pages unless a later, explicit instruction says so.**

### Five-line summary

1. Rebuild only `prototyp/` as a sharp ultra-4K retro **pixel-art** well descent (Kiro in a barrel on a rope), drawn at the phone’s full resolution, with Kreativ-Studio art and Playtest size floors.
2. Game Design numbers are binding; Hooky’s opening flow is in only where this brief marks it doc-compliant; Animation supplies timings, rope, VFX and the perf cap — not vector art.
3. Own `prototyp/sw.js`, existing fonts, and `../audio/`; copy the new stems from `docs/rebuild-2026-11-23/audio-new/` into `audio/` without overwriting any existing file, then wire them as in §12.
4. Never build the extras in §2 (combo banners, slow-mo, record line, shop, village, root-file edits, and the rest of that list).
5. Ship is not done until every Playtest point in §14 passes, including `window.__BN`, `?seed=`, `?noSpawn=1` and `?debug=1`.

---

## 0. Mission

The live prototype at `https://hasanbeg99.github.io/kagewell/prototyp/` (main tip `87f2800`) was rejected as too small, static and incomplete. Rebuild `prototyp/` from scratch so it matches the Google Doc “Projekt Barell Ninja” plus this brief.

The root game at `/` (`https://hasanbeg99.github.io/kagewell/`) stays the public fallback until a later, explicit go-ahead. **Kippwelt is a different game** — do not copy it and do not create another repo.

In-game copy is German: **SPIELEN**, **Nochmal**, **Titel**, **Pause**, depth in `m`. Logo: **KAGEWELL**, with **Barrel Ninja** as a short supporting line only if it stays a logo lockup, not a text block.

Work quality over speed. The current `prototyp/game.js` may be read as a reference for `CONFIG` key names and the existing 4-way rope / pointer input, then replaced.

---

## 1. Authority — how to resolve conflicts

If two source files disagree, use this order. Do not leave both values in the code.

| Rank | Source | Wins on |
|---|---|---|
| 1 | **This brief** and `team-replies-2026-11-23.md` | Every listed decision |
| 2 | Playtest `ABNAHME-rebuild-2026-11-23.md` | CSS-px minima, contrast, test hooks, the 40-point gate |
| 3 | Game Design `BALANCING-REBUILD-2026-11-23.md` | All `CONFIG` gameplay values, spawn curve, fairness |
| 4 | Kreativ-Studio `ART-DIRECTION-ULTRA-RETRO-2026-11-23.md` + `concepts/` | Pixel-art style, sprite AP sizes, palette, title/well look |
| 5 | Animation `SPEC-KAGEWELL-ULTRA4K.md` | Timings, rigs, rope, VFX, perf budget and adaptive cap |
| 6 | Hooky `HOOKY-ERSTE-30-SEKUNDEN-2026-11-23.md` | Only the **doc-compliant** flow in §10 of this brief |
| 7 | Sound `AUDIO-MAPPING-2026-11-23.md` + `audio-new/` | File names, volumes, music rules, and the new stems in §12 |
| 8 | Entwicklung notes in `team-replies` | `prototyp/sw.js`, script/font/audio loading (not the old PX formula) |
| 9 | `REBUILD-PLAN-2026-11-23.md` | Background and doc deviations |

**Already decided (do not re-open):**

1. Art style is Kreativ-Studio **pixel art** (1 art-pixel = 1 CSS px on the 390 grid, integer blit, no smoothing). Not Animation’s vector/arcade bitmaps. Animation timings, rope, VFX and perf still apply, redrawn as pixel art in the Kreativ palette.
2. Playtest CSS-px minima beat smaller design values (joystick, buttons, HUD, sprite screen-share).
3. Game Design values are binding, except the two Hooky doc-compliant timing overrides in §8.1 and the items in §2.
4. Title screen: Kiro and Tara stand ready. The faint/meadow scene is only at the end of a run.
5. Fonts: only what is already in the repo (Press Start 2P). No Silkscreen.
6. A slash at the wall during `swingCd` aims into the open shaft automatically.
7. If the phone lags: first cut particles; if it stays slow, drop the DPR cap one step (see §5).
8. No water drops in the barrel-break VFX.
9. `sagMode` default `'B'` (visual only). Variant A only in the pause/options menu or `?debug=1`, never as an on-field debug button.
10. Sword body hitbox stays **64×72**. Visual barrel may be 80×96. Sword pivot is above the head; downward hit tolerance `+0.28·BH` is allowed.
11. DPR cap starts at **4** on every viewport, with the adaptive fallback in §5. Not a desktop-only cap of 3.
12. Entwicklung’s `PX = max(2, floor(cssW*dpr/240))` formula is **rejected**. Use the Kreativ `dprInt` path plus a canvas backing store of CSS × DPR (Playtest E1).
13. Do not change the root service worker’s cross-repo cache clearing unless a later instruction from Saba says so.

---

## 2. DO NOT BUILD

Do not implement, stub as visible UI, or leave as a “temporary” on-screen extra:

- **KETTE x5** (or any on-screen chain/combo banner)
- **DOPPEL +50%** (or any on-screen multi-kill banner)
- Slow motion at **0.6×** (including the first-enemy beat)
- **25 m milestone banner**
- Record line on the wall, and the **record-marker lantern / notch** at personal best depth (even though the Game Design JSON sets `recordMarker: true` — treat it as `false`)
- **NEUER REKORD** / **Noch X m bis zum Rekord** stamps or lines
- Water drops in VFX (`K_DROP` off)
- Shop, village, outfits, equipment buy, missions, playable Tara
- Ducking SFX, electric-field / zap mechanic and SFX, dedicated spike-rock SFX (those sounds are not in this pass)
- Any change to repo-root `/index.html`, `/sw.js`, `/manifest.json`
- A second service worker that fights the root SW, or a prototype manifest that claims a different app name at scope `./` under the root PWA
- Left-hand mode, store builds, new repositories, comments in the Google Doc

Silent score math from Game Design may stay (swing follow-up kills ×1.5, 2 s kill combo +0.25 up to ×2, `noBarrelScoreMult` 1.5). It must not surface as the banners above. `new_highscore` may play **once** at faint if the run set a new best depth — still with no stamp text.

Hooky’s scripted “two bats, forced Doppel swing” tutorial is also out. Spawns follow Game Design, not a fixed power-moment script.

---

## 3. What to build

A complete, silent-when-muted, offline-capable prototype in `prototyp/`:

- Live title (mountain meadow, stone well, spinning pixel portal, fireflies, Kiro + Tara ready, coin pile, one **SPIELEN** button, total coins + best depth)
- Skippable portal fly-through into the well
- 4-way rope movement, auto-sink, Sonic-style floating joystick (right) + action button (left)
- Sword slash, 90° arc starting just above the head, left **or** right only
- Barrel Swing at the wall, dedicated spare-barrel button, persistent spare-barrel HUD
- Enemies: crawler, blade-bat, rope-cutter; hazards: spike rocks and thorn vines (two looks of the same non-killable wall trap). No bite-plant enemy, no electric field
- Coins (collect and persist; nothing to buy)
- Biomes every 100 m, three parallax layers, moonlight, stepped pixel lanterns
- Faint as the Tara meadow scene, then **Nochmal** / **Titel**
- Audio from `../audio/` (existing pack plus the new stems in §12), modern loops as the default
- Pause / options (mute, sag A/B), no debug chrome on the field
- Own `prototyp/sw.js`

---

## 4. Repo and loading architecture

**Touch only `prototyp/`** and, for the new stems only, **add files under `audio/`**. Read `../audio/`, `../fonts/`, `../vfx/`, `../balance.json`. Do not add a prototype `manifest.json` that would collide with the root PWA. If a SW is registered, its scope must be `./` under `prototyp/` only.

**New audio stems:** copy every file from this pack’s `audio-new/` folder (`*.ogg`, `*.m4a`, plus keep `README.md` / `sounds.json` / `LICENSES.md` next to them or merge their entries into the existing `audio/sounds.json` and license notes) into the repo’s `audio/` directory. **Do not overwrite any file that already exists in `audio/`.** The new stems use unique names (`barrel_swing_1`, `barrel_swing_2`, `barrel_swing_3`, `wall_landing_1`, `wall_landing_2`, `tara_wake`, `meadow_ambience_loop`, `portal_enter`), so they sit beside the current pack. After the copy, wire them as in §12. Load from `prototyp/` as `../audio/<name>.{ogg,m4a,mp3}`. mp3 is optional (not in this pack); ogg + m4a are required.

Suggested layout (names may vary, keep scripts deferred and ordered):

```
prototyp/index.html
prototyp/game.js
prototyp/sw.js
prototyp/audio.js          # or inlined; must expose the mapping table in §12
# optional split: input.js, sprites.js, …
```

Load existing or rebuilt pixel-art modules with `defer`, for example: `../vfx/vfx.js`, `../vfx/ninja-anim.js`, `../vfx/enemy-anim.js`, `../vfx/rope.js`, `../vfx/portal-coins.js`, then `game.js`. If those modules still draw vector/arcade art or tiny maps, replace or wrap them so output is Kreativ pixel art at the sizes in §6. Do not ship the old 18×10 bird / 26×34 ninja maps as the final look.

### 4.1 `prototyp/sw.js`

- `scope: './'`
- Cache name `kagewell-proto-vN` (bump N when the cache set changes)
- Delete only caches with that prefix — never other GitHub Pages games (Nitebop, Kippwelt, the root Kagewell cache)
- Intercept fetches only under `/kagewell/` (this project)
- Network-first with a 3 s timeout, then cache
- Precache `prototyp/` shell, `../vfx/*.js`, `../fonts/press-start-2p.woff` (or the actual file in `fonts/`), `../balance.json` if present, `../audio/manifest.json`
- **Do not precache the full audio pack.** Audio may be cached on first successful fetch, filtered to `/^\.\.\/audio\//` (or the resolved `/kagewell/audio/` URL). After the new stems are copied, they are part of that same `audio/` folder.
- Second visit must run fully offline (QA gate G), including already-fetched audio and fonts

### 4.2 Fonts and boot

- Press Start 2P from `../fonts/` (already in the repo)
- CSS `font-display: block` (or equivalent) and `await document.fonts.load('16px PS2P')` (or the real family name used in the `@font-face`) before the first gameplay/title paint that shows UI text
- Digit HUD may use a prerendered bitmap atlas so you do not layout text every frame

### 4.3 Audio boot

- `AudioContext` is created / resumed on the **first user tap** (SPIELEN or any first pointer). No sound before that (iOS)
- Format pick via `canPlayType`: **ogg, then m4a, then mp3**
- SFX as decoded `AudioBuffer`s; music and ambience loops via Web Audio with explicit `loopEnd` (not `<audio loop>` — AAC padding gaps)
- Start with `music_calm_loop` only; lazy-load mid/fast
- **Modern file loops are the default.** Do not turn the root Chip / 8-bit mode on by default. An optional pause-menu toggle is allowed
- Paths from `prototyp/`: `../audio/<name>.{ogg,m4a,mp3}`

---

## 5. Render architecture

Reference logical size: **390 × 844**. `1` art-pixel (AP) = `1` CSS px at that width.

```js
const rawDPR = window.devicePixelRatio || 1;
// dprCap starts at 4, then 3, then 2 (see adaptive cap)
const effDPR = Math.min(rawDPR, dprCap);
const dprInt = Math.max(1, Math.min(dprCap, Math.round(effDPR)));
canvas.style.width  = cssW + 'px';
canvas.style.height = cssH + 'px';
canvas.width  = Math.round(cssW * effDPR);  // Playtest E1, including DPR 2.625
canvas.height = Math.round(cssH * effDPR);
```

CSS: `image-rendering: pixelated; image-rendering: crisp-edges;`.  
Before every world blit: `ctx.imageSmoothingEnabled = false`. Never turn it on for sprites.

**Integer scale (E2) + fractional DPR:** prerender every sprite in an Offscreen canvas / `ImageBitmap` at `dprInt` (nearest-neighbor, edge ≤ 512 px). Draw with integer device-pixel destinations (`artSize * dprInt`) and `Math.round` positions. Do not scale a sprite by a non-integer so that one art-pixel is 2 device pixels wide and the next is 3.

When `effDPR` is not an integer (Playtest matrix: **2.625**):

- Keep the backing store at `css × effDPR` (E1).
- Keep a single integer art scale `dprInt` (at 2.625, `dprInt === 3`).
- Prefer snapping sprite dest rectangles to the integer grid rather than stretching art pixels.
- If a 3× world (390 × 3 device px) does not fit the 2.625 backing, **do not** bilinear-scale the framebuffer. Fit by letterboxing leftover device pixels or by clipping only parallax wall margins. Kiro, HUD and controls must stay fully visible and still meet §6 / §7 size floors.
- Recheck E3 after that fit: Kiro with barrel ≥ 18 % of **viewport CSS width** on 360×640; enemies / hazards ≥ 12 %.

**Layout scale:** map the 390 AP well to the full portrait CSS width (desktop: cap the well at 480 CSS px and letterbox). Never scale by height in a way that drops Kiro below 18 % of viewport width. On 360×640 this means width-based scale (`360/390`), even if that crops logical height.

**Landscape:** a clear “Bitte drehen” (or an equally clean, fully usable landscape layout). Menus must remain fully usable on 360×640 (D6).

**Glows and backgrounds:** `FX_DPR = min(effDPR, 2)`, prerendered stepped pixel halos. **No `shadowBlur`**, no per-frame gradients, no CSS `filter`, no full-screen `'lighter'`. `'lighter'` on at most 35 % of the area. Max **280** particles (pool). Wall tiles from ~128 AP blocks, not stone-by-stone.

**Adaptive cap (binding merge of Animation hysteresis + Alu’s “particles first, then one DPR drop”):**

| Stage | Trigger | Action |
|---|---|---|
| 1 | `p90 > 18.5 ms` over 60 frames, or any stretch of frames `> 22 ms` (ignore resize stutters) | Particle budget → 60 % (168). Optional: cut ambient dust; moonlight cone may drop |
| 2 | After stage 1, `p90 > 20.5 ms` over another 60 frames, cooldown ≥ 4000 ms | Drop `dprCap` by 1 (`4→3`, then `3→2`), rebuild bitmaps in the background, keep the old bitmaps until ready |
| Up | `p90 < 14.5 ms` over 180 frames and cooldown ≥ 8000 ms | Raise `dprCap` by 1, max 4 |

**Perf budget** (Animation): logic ≤ 1.8 ms, draw ≤ 3.2 ms, ≤ 95 draw calls, ≤ 280 particles (≤ 60 `'lighter'`), overdraw ≤ 1.8×, atlas ≤ 24 MB (expect ~17.8 MB at 4×). Target 16.67 ms/frame. Playtest E5 is the gate: **p95 ≤ 17.5 ms, 0 frames > 33 ms** in a 3-minute bot run. Headless Chromium under 4× CPU throttle fillrate-limits DPR 3–4 (software Skia). The adaptive cap must bring a 4×-throttle headless run inside the gate (typically settling at DPR 2). Re-measure on a real mobile GPU.

Resize, rotate and tab-away must rebuild layout and caches cleanly (E6). Cache budget < 64 MB.

---

## 6. Pixel art, sizes, palette

Follow `ART-DIRECTION-ULTRA-RETRO-2026-11-23.md` and the images in `concepts/`. The 80×96 sample `concepts/kiro-barrel-sample-1x.png` is the scale reference for Kiro + barrel. Outline `#120A1E`, 1–2 AP; 4–5 tones per material; dither only in the background.

### 6.1 Sprite sizes (art pixels) and Playtest floors

Hitbox stays **64×72** (Game Design W7), centered on the visual. Visuals may be larger.

| Asset | Art pixels (W×H) | Notes |
|---|---|---|
| Kiro + barrel | **80×96** | ~20.5 % of 390; must stay ≥ **18 % of viewport width** on 360×640 |
| Kiro without barrel | 52×72 | |
| Sword slash graphic | 76×78, radius 72 AP from barrel centre | Visible katana (hilt, tsuba, blade), not a bare wedge |
| Crawler | 76×52 | 5 segments; telegraph ≥ 450 ms, body only |
| Blade bat | 68×56 | |
| Rope-cutter | 56×68 | |
| Coin | 32×32 | Kreativ 4 spin phases **or** Animation 6 spin bitmaps — 6 is allowed if they are pixel tiles in the palette. Glint + 360 ms flight to the HUD |
| Spike rock | 52–64×44 | Enlarge if the on-screen width would be < 12 % of the viewport |
| Thorn vine | **≥ 48×40** (was 36×40) | Playtest E3: hazards count as “enemies” for the **≥ 12 %** width floor. 36 AP would fail on 360×640 |
| Electric emitter | — | **Do not build** |

Animation’s “0.72–0.95·BH” size band is a readability goal. If it fights the table above, **the table + Playtest floors win**. A reference visual barrel height of 96 AP (or Animation’s 84 if you need a rig constant) is fine as long as the drawn Kiro+barrel stays 80×96 AP and ≥ 18 % width.

### 6.2 Well, light, biomes

- Three parallax layers: back 0.5×, mid 0.75× (chains, roots, drops as **pixels**, not a blur), side walls 1.0× in four segment variants
- Moonlight cone at the top; lanterns as **stepped pixel rings**, no blur
- Biome every 100 m: moonlight well → moss floor → ember shaft → crystal cleft
- Mean playfield luminance ≥ 60/255; Kiro contrast vs surroundings ≥ 3:1 (E4)

### 6.3 Palette (Kreativ, binding)

Use the ramps in the art-direction file. Short list:

- Outline `#120A1E`
- Abyss `#05070F` / `#0B1426` / `#122640`
- Stone `#0E1724` / `#273A50` / `#6485A6`
- Moss `#142E25` / `#367554` / `#8FD188`
- Wood `#3A1E10` / `#8A5A2E` / `#E0A868`
- Steel / blade `#2A2E38` / `#7B8494` / `#EEF4FF`
- Rope `#6E522B` / `#C9A66B` / `#EAD19B`
- Coins `#8C4B00` / `#FFD84A` / `#FFF8C4`
- Kiro `#10152B` / `#2A3B73` / `#7392D9`, scarf `#7E1122` / `#E2283C` / `#FF6673`
- Tara `#231233` / `#59307A` / `#7E4AA6`, sash `#1D6B5E` / `#359E84` / `#F0B43A`
- Crawler `#6E2416` / `#EB752D` / `#FF5A2A`
- Bat `#2A1E47` / `#B9C3D6` / `#FFC23A`
- Rope-cutter `#4E7A3A` / `#C7CED6`
- Slash trail `#4FF0FF`
- Lantern `#FFB347` / `#FFE2A8`
- Portal `#4A1FB8` / `#8B42F5` / `#4FF0FF` / `#FFD84A`
- Joystick red `#E2283C` / `#FF7A85`

Do not reuse the old prototype colours (`#0c0a1c`, `#4a5cc4`, `#ff7a2c`, …).

---

## 7. Controls and HUD (CSS pixels — Playtest wins)

All of the following are **CSS pixels** on **360×640** and must still hold after `viewScale`. Do not author them only in 390-logical pixels and then shrink under the floor.

### 7.1 Joystick (right half, arcade cabinet look)

- Rest anchor **always visible** from the first gameplay frame: ring + knob, contrast ≥ 3:1 vs the background
- Rest position: centre in the lower-right quarter; ≥ **24 CSS px + `safe-area-inset`** from the edge
- Ring diameter ≥ **120 CSS px**, knob ≥ **48 CSS px** (Kreativ’s 96 / 44 are too small — do not use them)
- Floating: a touch anywhere in the **right half** below the HUD re-anchors the stick; on release it returns to rest in ≤ **150 ms**
- Dead zone **10–15 % of the ring radius** (target 10–12 %). Game Design’s old `deadzone: 12` px on `joyMax: 55` was 21.8 % and is a **fail** — recompute from the new radius
- 4-way, 90° sectors, hysteresis **15°** (Game Design; Playtest minimum is 10°)
- Knob follows the finger 1:1 up to the radius, then clamps; leaving the ring must not drop the input
- Touch → visible move: p50 ≤ 17 ms, p95 ≤ 34 ms

### 7.2 Action button (lower left)

- Diameter ≥ **64 CSS px**, target **72**; hit area **88 CSS px** is fine
- Icon always matches the action a tap will perform **right now** (sword, barrel swing when at wall and ready, or locked). 0 mismatches over 200 taps, including taps during `swingCd`
- During `swingCd` at the wall: icon = **sword**, plus a visible swing cooldown ring; when the cooldown ends, the icon flips to swing within 1 frame
- Sword slashes at the wall during `swingCd` are **not** blocked (remove the `tryAction` early return)
- Sword hit region = full 90° arc starting just above the head; the hitbox matches the visible blade
- Visible press state ≤ 1 frame after `touchstart`
- Input buffer **120 ms** (inside Playtest’s 100–150 ms). Buffer during hit-stop too

### 7.3 Spare barrel

- **Button** (Kreativ ≥ 58 CSS px, must be ≥ **56**): visible only when the barrel is broken **AND** spare count ≥ 1. Tappable from the **first visible frame** (no ~109 ms dead time)
- **HUD** (icon + number): **always** visible, including at 0 (greyed). Text ≥ 12 CSS px, contrast ≥ 4.5:1
- Pickup: counter +1 in the same frame + short pop/sound. Equip: −1 in the same frame
- Touch targets do not overlap; gap ≥ 8 CSS px

### 7.4 HUD and input hygiene

- HUD: depth (m), coins, spare barrels, mute, pause — above, clear of notch and home indicator
- All HUD text ≥ 12 CSS px, contrast ≥ 4.5:1 against the darkest well
- HUD must not cover enemy spawn lanes or Kiro (no overlap with the player rect over a 60 s bot run)
- Left and right are split by `pointerId`: joystick + action together, 100/100
- No browser scroll, zoom, long-press menu, or text selection. `touch-action: none`, `preventDefault` on game pointers, viewport `user-scalable=no` as needed
- **No debug buttons (B, HB, A/B) on the field or HUD.** Sag A/B and hitbox overlay live in pause/options or behind `?debug=1`

---

## 8. Gameplay values (Game Design, binding)

Copy keys from `BALANCING-REBUILD-2026-11-23.md` §10. The JSON there is the start set, with the overrides in §8.1 and `recordMarker: false`.

### 8.1 Overrides versus the balancing JSON

| Key / rule | Balancing file | Use this instead | Why |
|---|---|---|---|
| Portal length | `portalMs: 1200` | First run **2500 ms**, later runs **600 ms**, always skippable | Hooky, marked doc-compliant |
| First crawler wind-up | formula 600 ms at 0 m | **700 ms** on the first crawler of a run; then the formula | Hooky, marked doc-compliant |
| First crawler damage | normal jab at 2.6–3.0 s | The first crawler of a run **cannot deal damage**. If missed, it pulls back and returns as a normal crawler | Hooky, marked doc-compliant |
| Rope-cutter start | 70 m | **70 m** (unchanged) | Satisfies Hooky’s “not before 60 m”; Game Design wins |
| `recordMarker` | `true` | **`false`** | §2 |
| Title “3–4 control lines” | in §7 of the balancing file | **No instruction text block** — one **SPIELEN** button | Hooky, marked doc-compliant |

`portalScroll` 40 px/s and the 400 ms ramp up to `scroll0` still apply after the portal.

### 8.2 Sink, rope, meters

- `logicalW` 390, `logicalH` 844, `wall` 30, shaft 330, `pxPerMeter` **16**
- Player hitbox `barrelW` 64 × `barrelH` 72; travel of the box top `150…700`
- Wall contact for duck / swing: distance to inner wall ≤ 12 px
- `scroll0` 60 px/s, `scrollAcc` 1.5 px/s², `scrollMax` 150 px/s (cap at 60 s). Depth always grows with `scrollV`, even if the player hugs the top
- Rope: `speedDown` 520, `speedUp` 340, `speedSide` 360 px/s
- `inputStart` 0.6, `inputFullMs` 100, `inputReleaseMs` 80 (stop, no slide)
- `actionBufferMs` 120
- `sagMode: 'B'`: rope + a small barrel settle (`sagPx` 4, `sagMs` 60) are visual; the hitbox goes up at once
- Visual rope sag is **much more than 4 px** — see §9. The 4 px is the gameplay settle, not the drawn slack
- Sway (visual, hitbox sway ≤ 4 px): top 6° / 12 px, 900 ms; side 4°, 1100 ms; idle 1.5°, 1600 ms

### 8.3 Enemies and fairness

Only crawler, bat, spike/vine, rope-cutter. Telegraph is **body motion only**, visible ≥ 450 ms. No `!`, blink lanes, target circles, or progress rings.

```
windupMs(m)    = max(450, 600 - 0.5 * m)
attackGapMs(m) = max(700, 1400 - 2.0 * m)
```

`maxConcurrentAttacks`: 1; 2 from 40 m; 3 from 150 m; 4 from 300 m. The rope-cutter **counts** toward gap and concurrency. Idle sitters and already-extended hazards do not, until they wind up or extend again.

- `impactGapMs` 350
- Always one safe direction reachable in `safeMs` 300. If an attack would break that, it stays idle and retries in 300 ms
- Crawler from **0 m**; first wind-up at **2.0 s** into gameplay (700 ms, cannot punish). Then idle 400–1200 ms and the formula. Jab 240 / hold 180 / back 280 ms. 70 % inward jab, 30 % leap to the far wall from **90 m**. Points 10
- Bat from **20 m**. 75 % cross, 25 % swoop from **120 m** (swoop only if a safe direction remains). Points 20
- Spikes / vines from **30 m**, extend ≥ 450 ms, then scroll with the world, not killable. From 180 m, 30 % chance of length 2 (never both walls, never the last 300 ms escape). Group gap ≥ 220 px
- Rope-cutter from **70 m**, max 1, `cutterCooldownMs` 10 000. Sits 24–32 px off the rope axis at the barrel eye so a sideways 90° slash can hit. A cut is a faint **even with a barrel**. Vulnerable once in `swordR` and during the full scissor wind-up. After a kill, no new threat on the eye for 1 s. Points 50

Spawn weights and `maxVisible` tables: balancing file §3.3 and §10. Wave rhythm: typically 10 s pressure / 2.5 s rest (range 8–14 / 2–3). Every 5th wave is a rush (14 s, concurrent +1, cap 4, no new types). Wave 1: crawlers only, one attack at a time, wind-up 600 (except the first-crawler 700 ms override).

### 8.4 Sword

- 90° only, left **or** right, starting just above the head to horizontal. Stick chooses the side; if the stick is neutral/vertical, last side, else the side of the nearest enemy. At the wall, aim into the **open shaft**
- Combat radius `swordR` **72** from the barrel centre, plus the approved downward forgiveness of `+0.28·BH` from the head pivot so chest-height targets still connect. Visible blade and hitbox must agree (B5). If the drawn blade is clearly longer than 72, grow the hitbox to the blade, not the other way around
- Visual pivot: `py - 0.18·BH` (above the head). Visual sweep radius may be `1.05·BH`
- `swordWindup` / `swordActive` / `swordRecover` = 40 / 100 / 40 ms. Visible sweep 90 ms (easeOutCubic, −90° → 0° or the left mirror), with a 4-frame `#4FF0FF` trail
- Wind-up may show a brief −105° pull (Animation) inside the 40 ms
- `swordCd` **260 ms from attack start** (80 ms after recover). Barrel recoil ±3°. On hit: 50 ms hit-stop, 4 px shake, sparks
- No automatic fire

### 8.5 Barrel swing

- Trigger: barrel intact, wall distance ≤ 12 px, `swingCd === 0`. Duck 120 ms starts on wall contact, not on the tap
- `swingWindup` 70 ms, flight `swingMs` **520 ms**, gameplay apex `swingArc` **60** px (visual follows this path; do not use a conflicting −0.75·BH gameplay apex)
- Full spin, 3 afterimages, rope wave. `swingPad` 10 (hitbox = barrel + 10)
- Invulnerable during wind-up + flight (~590 ms)
- Impact 120 ms (squash, dust, 4 px shake). Hit-stop 40 ms only if an enemy was hit
- `swingCd` **1500 ms from landing**, fill ring on the button
- While `swingCd > 0` at the wall, the button **is the sword**
- Audio: pick a random `barrel_swing_1` / `_2` / `_3` at swing start (0.65); pick a random `wall_landing_1` / `_2` on wall impact (0.80). Never `swipe`, `sword_slash`, or `barrel_break` for these events

### 8.6 Coins and barrels

- Coins about every 4 m, chains of 3–5, first chain at **1.5 s** after gameplay starts, only on safe lanes. `coinPoints` 10. 45 % chance of a 1-coin drop on kill. Persist total coins (`localStorage` key may stay `kagewell.prototyp.coins`). Nothing to buy
- Start: intact barrel + `spareStart` 1, `spareMax` 3
- Break: `breakInvuln` 1200 ms, `breakSpeed` 1.15 on **player motion only** (not `scrollV`)
- Equip: `equipMs` 400, `equipInvuln` 1000
- Pickups: `pickupGapM` 60 after the last find (`lastPickupM = 0` at start, so first chance at 60 m), then 25 % every 10 m

### 8.7 Score, music tiers, restart

- `pointsPerMeter` 10; typed kill points 10 / 20 / 50
- `noBarrelScoreMult` 1.5 on kill and depth points while unbarreled
- Combo: 2000 ms window, +0.25 per kill, max ×2, kills only, reset on hit — **silent**, no banner
- Music: calm 0–119 m, mid from 120 m, fast from 300 m (see §12)
- **Nochmal** tappable after **300 ms** (no 1.1 s lock). Tap → controllable run ≤ **600 ms** (a short portal flash is allowed). Place the button at the **action-button position**. A tap skips the rest of the faint cinematic. Also offer **Titel**
- Reset all run state between runs (combos, waves, `chainGot`, …)
- No faint before ~20 s unless the player clearly caused it (walking into a telegraph they could have answered). The first crawler still cannot punish

---

## 9. Animation, rope, VFX

Implement the timings and rigs in `SPEC-KAGEWELL-ULTRA4K.md`, redrawn as pixel art. Frame counts in the art-direction file (sword 2 / 3 / 2, swing 8 + 3 ghosts, and so on) should match these durations at 60 fps.

**Rope (`vfx/rope.js` or equivalent):** visual only. 12 segments, 120 Hz fixed step, 3 iterations. Length changes in the top 4 segments. When climbing, visible slack **12–24 px** (slack 1.065, built in 35–50 ms, taut again in 150 ms). Soft catch at the top (rope ±25°, barrel ±6°, 900 ms). Side ±3.5°, idle ±1.5°. The old “shift the barrel 4 px and keep the rope taut” look is not acceptable.

**Portal VFX:** 1.8·BH, 3 counter-rotating ring bitmaps, ~28 spiral particles. The **visual** flourish may be ~750 ms; the **sequence length** is 2.5 s / 0.6 s as in §8.1.

**Barrel break:** 6–8 staves, 2–4 hoops, 8 splinters, 12 dust, 60 ms hit-stop, 6 px shake. **No water drops.** A short freeze + splinters is required (Hooky doc-compliant); do not add a long slow-motion shot.

**Hits:** 50 ms hit-stop on sword connect (40 ms on swing connect), sparks, 4 px shake. No world-time 0.6×.

Plants break through the wall with a crack telegraph (`vfx.wallBreak` or equivalent), not a warning icon. Rope-cutter may fray the rope visually (`vfx.ropeFray`) while `rope_cutting_loop` plays.

---

## 10. First-run flow (Hooky, doc-compliant parts only)

This is pacing and teaching, not a new feature list. No pausing tutorial text. No enemy that stands still as a dummy.

| Time (first session) | What happens |
|---|---|
| 0–4 s | Title: living meadow, pulsing portal, Tara by the rope, Kiro ready, coin pile scaled to **total coins**, one large **SPIELEN** |
| Portal | **2.5 s** the first time, **0.6 s** afterwards, skippable. On the fly-through flash: `portal_enter` (0.75) together with well ambience and `music_calm_loop`. Input is live as soon as the well is shown — no “Tap to start” |
| ~1.5 s into gameplay | First coin chain (3–5, teaching movement). Each coin in the chain plays a **semitone higher** (overrides random coin jitter for that chain). Pickup VFX yes; **no “KETTE x5” text**, even on a 5-chain |
| 2.0 s into gameplay | First crawler starts a **700 ms** wind-up. It **cannot damage** the player this first time; if missed, it retreats and comes back normally. A pulsing sword icon on the action button is allowed; **no 0.6× slow-mo** |
| Later, naturally | Wall contact, swing, mixed enemies, barrel break with freeze + splinters, spare-button badge “1”. Do not force a two-bat Doppel, a 25 m banner, or a record line |
| Barrel break | Short freeze, splinters, Kiro faster (`×1.15`), spare button pops if stock ≥ 1, 1200 ms invuln |
| Faint | See §11. Not before ~20 s unless the player clearly caused it. No rope-cutter before 70 m |

Playtest targets (for later, not blockers for this brief): first kill < 15 s for ≥ 90 % of testers; ≥ 70 % use the swing unprompted; median faint → Nochmal tap < 4 s; ≥ 80 % start a second run on their own.

---

## 11. Title, portal, faint

**Title:** mountain meadow, ruined wooden house, stone well, spinning pixel spiral portal, fireflies, grass. Logo **KAGEWELL** at the top, optional short “Barrel Ninja” lockup, **SPIELEN**, total coins and best depth / best points. Kiro and Tara stand ready (not the faint pose). No paragraph of controls. Title audio: `music_calm_loop` at 0.50 plus quiet `ambience_well_loop` (0.35–0.50). Meadow ambience is for the faint scene, not the title, unless you want a very low bed — default is well ambience + calm music on the title.

**Portal / run start:** skippable; first 2500 ms, later 600 ms; scroll 40 px/s, then 400 ms up to 60. At run start, play **`portal_enter` (0.75) together with well ambience (0.60) and `music_calm_loop` (0.50)**. Also play `ui_confirm` on the SPIELEN tap. `music_calm` may kick in on the fly-through flash (Hooky) — if the confirm already started the calm loop, do not restart it; just keep it running through the flash.

**Faint:** a reward scene, not a game-over card. Soft white fade; meadow; Tara leans over Kiro; he sits up; the **run’s** coin pile pops coin by coin, counter ≤ **1.2 s**, rising pitch. Show run coins, total coins, depth, points, **Nochmal** and **Titel**. Nochmal is at the action-button spot, tappable at **300 ms**, skip-on-tap, control in ≤ **600 ms**. Keep coins in `localStorage`.

**Tara-scene audio (binding):**

1. Well ambience **off**
2. Music ducked to **×0.15–0.20** in ~0.8 s (do not hard-cut)
3. `meadow_ambience_loop` **on** at 0.45 (`loopEnd` **24.0**, including for m4a)
4. Then play **`tara_wake` at 0.75**
5. **Do not play `game_over`** — `tara_wake` replaces it

The hit that causes the faint is still `player_hit` (0.90) or `rope_snap` (0.85) just before this scene. `new_highscore` may play once if the run is a new best, with no stamp text. On **Nochmal** or **Titel**, stop meadow ambience, restore calm music, and bring well ambience back as appropriate.

---

## 12. Audio — single mapping table

Load from `../audio/` (ogg + m4a required, mp3 fallback if present). First copy the new stems into `audio/` as described in §4 — **never overwrite existing files**. Volumes are gains at master = 1. Vary `playbackRate` 0.94–1.06 on sword slashes. On **coin chains**, step a semitone per coin instead of random jitter; reset at the next chain. For `barrel_swing_*`, an extra rate jitter of 0.96–1.05 is optional on top of picking a random variant.

**Chip / 8-bit is OFF by default.** Equal-power music crossfade **1.8 s**, first start fade-in 0.6 s. **Upshift only** during a run. Every new run and the title start at calm. Pause: music ×0.35, loops keep running. `loopEnd` is the design length (calm/mid 76.8, fast 71.111, well ambience 24.0, meadow ambience 24.0, cutting loop 1.5) — not the container duration. For `meadow_ambience_loop`, set `loopEnd = 24.0` especially on m4a.

Set `rope_retract` on climbing (cooldown 400–600 ms). `rope_extend` on descending (cooldown). `rope_creak` at 0.40, cooldown **1400 ms**, tied to tension (climb, sag, sway), not a 2 % chance per frame.

Implement **exactly one** mapping table (or an `AUDIO_MAP` object that matches it). Event keys stay stable.

| Event key | File | Vol. | Loop | Notes |
|---|---|---|---:|:---:|---|
| `music_calm` | `music_calm_loop` | 0.50 | yes, 76.8 | Title, pause, run start, 0–119 m |
| `music_mid` | `music_mid_loop` | 0.50 | yes, 76.8 | From 120 m, upshift only |
| `music_fast` | `music_fast_loop` | 0.50 | yes, 71.111 | From 300 m |
| `ambience_well` | `ambience_well_loop` | 0.35–0.50 title; 0.60 in the well | yes, 24.0 | **Off** during the Tara meadow scene |
| `ambience_meadow` | `meadow_ambience_loop` | **0.45** | yes, **24.0** | Tara scene only; `loopEnd` 24.0 (m4a too) |
| `ui_click` | `ui_click` | 0.50 | no | Menus, mute, pause |
| `ui_confirm` | `ui_confirm` | 0.60 | no | SPIELEN, Nochmal |
| `portal_enter` | `portal_enter` | **0.75** | no | At run start, **together with** well ambience and `music_calm_loop` |
| `score_pickup` | `score_pickup` | 0.45 | no | Rising pitch in a chain |
| `sword_slash` | `sword_slash` | 0.90 | no | Rate jitter 0.94–1.06 |
| `enemy_hit` | `enemy_hit` | 0.85 | no | |
| `enemy_death` | `enemy_death` | 0.80 | no | |
| `barrel_break` | `barrel_break` | 0.85–0.90 | no | First hit with a barrel |
| `barrel_pickup` | `barrel_pickup` | 0.70 | no | Equip only, not other events |
| `barrel_swing` | `barrel_swing_1` / `_2` / `_3` | **0.65** | no | **Random variant at swing start.** Not `swipe`, not `sword_slash`, not `barrel_break` |
| `barrel_land` | `wall_landing_1` / `_2` | **0.80** | no | **Random variant on wall impact.** Not `barrel_break` |
| `player_hit` | `player_hit` | 0.90 | no | Faint when unbarreled, just before the Tara scene |
| `rope_snap` | `rope_snap` | 0.85 | no | Rope-cut faint; then Tara scene |
| `tara_wake` | `tara_wake` | **0.75** | no | After meadow ambience is on; **replaces `game_over`** |
| `rope_creak` | `rope_creak` | 0.40 | no | Gap 1400 ms |
| `rope_retract` | `rope_retract` | 0.50 | no | Climb; hook this up (root never calls it) |
| `rope_extend` | `rope_extend` | 0.50 | no | Player descent. Vine extend may reuse `warning`, not this, if you need a sound |
| `rope_cutting` | `rope_cutting_loop` | 0.55 | yes, 1.5 | Fade 150 ms in, 120 ms out; stop when idle, paused, or run over |
| `warning` | `warning` | 0.40–0.45 wind-ups; 0.75 cutter enter | no | Sound only — no warning graphic |
| `lunge` / dive | `swipe` | 0.60–0.70 | no | Crawler jab, bat swoop |
| `new_highscore` | `new_highscore` | 0.80 | no | Once at faint if new best depth; **no stamp text** |
| `game_over` | `game_over` | 0.80 | no | **Do not play** on the Tara scene; `tara_wake` is the cue |

Do not wait for duck-SFX, zap, or spike-rock sounds. Duck is silent. Zap is not in the build. Spikes are silent.

Mute: master gain 0, loops keep running silently. HUD mute is required.

Details and measured loudness for the pre-existing pack: `AUDIO-MAPPING-2026-11-23.md`. Details for the new stems: `audio-new/README.md` and `audio-new/sounds.json`.

---

## 13. Test hooks (required)

```js
window.__BN = {
  state,          // e.g. title | portal | play | faint | pause
  swingCd,        // ms remaining, 0 if ready
  atWall,         // boolean
  actionIcon,     // 'sword' | 'swing' | 'locked' (must match what a tap does)
  actionLast,     // last executed action
  spareBarrels,   // integer
  joy: { x, y, dir, anchor },
  hudRects,       // CSS-pixel rects for HUD and all touch targets
  dpr,            // include raw, effDPR / backing, dprInt, dprCap
  frameTimes      // recent frame intervals (ms), enough for p50/p95 over a long run
};
```

Query params:

- `?seed=` — deterministic spawn / RNG
- `?noSpawn=1` — no enemies or hazards (coins/portal/title still fine)
- `?debug=1` — sag A/B, hitboxes, and other debug; **never** on the field without this (or the pause menu)

Also expose enough of `hudRects` and joy anchor for Playtest to measure CSS sizes and safe-area gaps.

---

## 14. Acceptance checklist (hard gate)

Copy of Playtest `ABNAHME-rebuild-2026-11-23.md`. **If any one point fails, the build is not acceptable.** H = headless Playwright/CDP, S = screenshot, G = real device.

### A. Joystick (lower right)

| # | Criterion | How |
|---|---|---|
| A1 | Rest anchor ALWAYS visible (ring + knob) from the first gameplay frame; contrast ≥ 3:1 | S + pixels |
| A2 | Rest centre in the lower-right quarter; edge gap ≥ 24 CSS px + safe-area-inset | H (`__BN`) |
| A3 | Ring diameter ≥ 120 CSS px on 360×640; knob ≥ 48 CSS px | H |
| A4 | Floating: touch in the right half (below HUD) re-anchors; release returns to rest in ≤ 150 ms | H |
| A5 | Dead zone 10–15 % of radius (21.8 % is a fail) | Code + H |
| A6 | 4 directions in 90° sectors with hysteresis ≥ 10° (no flicker at 45°/135°/225°/315°) | H |
| A7 | Knob follows the finger 1:1 up to the radius, then clamps; leaving the ring does not drop input | H |
| A8 | Touch → visible move latency p50 ≤ 17 ms, p95 ≤ 34 ms | H |

### B. Action button (lower left) and icon truth

| # | Criterion | How |
|---|---|---|
| B1 | Size ≥ 64 CSS px (target 72) on 360×640 | H |
| B2 | Icon ALWAYS matches the action a tap performs now; 0 mismatches over 200 taps including `swingCd` | H |
| B3 | During `swingCd` at the wall: icon = sword + visible swing cooldown ring; flips to swing in ≤ 1 frame when ready | H + S |
| B4 | Normal slashes at the wall during `swingCd` are not blocked | H |
| B5 | Sword hit region = full 90° arc from just above the head; hitbox matches the visible blade | H + S |
| B6 | Press feedback visible ≤ 1 frame after `touchstart` | H |
| B7 | Input buffer 100–150 ms: a tap just before a cooldown ends is executed, not dropped | H |

### C. Barrel button and spare inventory

| # | Criterion | How |
|---|---|---|
| C1 | Barrel button ≥ 56 CSS px; only when the barrel is broken AND spare > 0 | H |
| C2 | Tappable from the first visible frame | H |
| C3 | Spare HUD always visible (icon + number, grey at 0); text ≥ 12 CSS px, contrast ≥ 4.5:1 | S |
| C4 | Pickup: +1 same frame + short feedback; spend: −1 in sync | H |
| C5 | No overlapping touch targets; gap ≥ 8 CSS px | H |

### D. HUD

| # | Criterion | How |
|---|---|---|
| D1 | No debug buttons (B, HB, A/B) on the field or HUD; A/B only in pause/options or `?debug=1` | H + S |
| D2 | HUD shows depth (m), coins, spares; nothing under notch / home indicator | S |
| D3 | All HUD text ≥ 12 CSS px, contrast ≥ 4.5:1 vs the darkest well | Pixels |
| D4 | HUD does not cover spawn lanes or the ninja (no overlap with the player rect over a 60 s bot run) | H |
| D5 | Left/right split by pointer-ID; joystick + action together 100/100 | H |
| D6 | No browser scroll / zoom / long-press menu / text selection; menus fully usable on 360×640 | H |

### E. Sharpness / rendering (DPR 1–3)

| # | Criterion | How |
|---|---|---|
| E1 | Canvas backing store = CSS size × DPR (rounded), at DPR 1, 2, 2.625, 3 | H |
| E2 | Pixel art integer-scaled (no mixed pixel widths); `imageSmoothing` off for sprites; UI sharp (no greyscale fringes > 1 device pixel) | S |
| E3 | Not “tiny”: ninja sprite ≥ 18 % of screen width on 360×640; enemies ≥ 12 % | H + S |
| E4 | Mean playfield luminance ≥ 60/255; ninja contrast ≥ 3:1; enemy wind-up clearly visible | Pixels |
| E5 | Frames p95 ≤ 17.5 ms, 0 frames > 33 ms in a 3 min bot run (headless, 4× CPU throttle as mobile proxy); memory after 3 min not > 20 % over start | H + G |
| E6 | Resize / rotation / tab switch: layout rebuilds correctly, no stretched sprites | H |

### F. Test matrix (every A–E point on every row)

| Viewport (CSS px) | DPR | Stands for |
|---|---|---|
| 360×640 | 1, 2, 3 | Small Android |
| 390×844 | 2, 3 | iPhone 12–15 |
| 412×915 | 2.625, 3 | Pixel / Galaxy |

Plus portrait and landscape behaviour for each viewport (landscape: “Bitte drehen” or a clean layout).

### G. QA gate before handing to Playtest

- 0 console errors / warnings at start, in play, and on the faint screen
- Live URL and repo commit are byte-identical (hash compare)
- Audio unlocks on first touch (iOS); no sound before interaction
- PWA / offline: second start offline loads fully (`sw.js` has cached `prototyp/` + needed `../audio`, `../vfx`, `../fonts`)
- Flows: Title → Play → Faint → Title; coins persist across reload
- Bot runs (passive / random / evading) 4×180 s without hangs and without unearned deaths
- Screenshots of all states on all matrix rows in `qa/screenshots/proto-rebuild-*`

**Real device only (not headless):** haptics and thumb reach, real iOS audio unlock, 120 Hz, heat / battery, safe-area with a real notch. After the build, send Playtest the live link and the commit hash — they will not touch the repo.

---

## 15. Implementation notes

- Rebuild `prototyp/` as a cohesive new game, not a patch on the rejected 1671-line file. Reuse input ideas, `CONFIG` key names, and `localStorage` persistence where they still fit.
- Keep pointer handling in the same frame as the input (no one-frame delay).
- `enemy-anim` (or your replacement) **must be loaded**. Crawler, bat, rope-cutter, vines and rocks need idle / wind-up / attack / hit / death, not a one-frame wiggle.
- `drawSword` starts above the head and draws a katana, not a wedge from the barrel centre.
- Fairness checks in balancing §8 are mandatory for the spawner.
- Optional later swap of this prototype into the root site is a **single future commit** tagged `v4-fallback`. Do not do that swap in this rebuild.

---

## 16. Files in this spec pack (`docs/rebuild-2026-11-23/`)

| File | Role |
|---|---|
| `REBUILD-BRIEF-FINAL-2026-11-23.md` | This brief (start here) |
| `team-replies-2026-11-23.md` | Alu’s binding decisions |
| `ART-DIRECTION-ULTRA-RETRO-2026-11-23.md` | Pixel-art bible |
| `concepts/kagewell-gameplay-concept.jpg` | Gameplay target look |
| `concepts/kagewell-title-concept.jpg` | Title target look |
| `concepts/kiro-barrel-sample-1x.png` | 80×96 Kiro + barrel pixel sample |
| `concepts/kiro-barrel-grid-demo.png` | 1× vs 4× grid demo |
| `SPEC-KAGEWELL-ULTRA4K.md` | Animation timings, rope, VFX, perf |
| `BALANCING-REBUILD-2026-11-23.md` | Binding `CONFIG` (apply §8.1 overrides) |
| `HOOKY-ERSTE-30-SEKUNDEN-2026-11-23.md` | Opening flow; extras in its “nicht im Doc” list are out |
| `AUDIO-MAPPING-2026-11-23.md` | Inventory, volumes, music rules for the existing pack |
| `audio-new/` | New stems (ogg + m4a + README / sounds.json / LICENSES). Copy into `audio/` without overwriting |
| `ABNAHME-rebuild-2026-11-23.md` | 40-point gate (also copied in §14) |
| `REBUILD-PLAN-2026-11-23.md` | Doc vs prototype findings, Kippwelt note, plan history |

---

*End of brief. If a detail is missing, look it up in the pack — do not invent a new system.*
