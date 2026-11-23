# Barrel Ninja / Kagewell — Ultra-4K-Retro Animations- & VFX-Spezifikation

**Stand:** 23.11.2026 · **Autor:** Animation & Effekte · **Empfänger:** Alu (Projektleitung), Entwicklung, Playtest & Qualität  
**Bezug:** `REBUILD-PLAN-2026-11-23.md`, `concepts/art-direction.md`, `design/balancing-spec.json`, `qa/ABNAHME-rebuild-2026-11-23.md`, `hasanbeg99/kagewell/prototyp/` (Commit `87f2800`)  
**Verbindliche Palette:** Ausschließlich `concepts/art-direction.md` (`BNVFX.PALETTE`, Klingen-Trail `#4FF0FF`).  
**Verbindliche Regel:** **Keine Warn-Marker** (keine `!`, keine Blink-Lanes, keine Zielkreise/Ausrufezeichen). Gegner kündigen sich ausschließlich durch ihre sichtbare Ausholbewegung (und bei Pflanzen durch den Mauerriss) an.

---

## 0. Ist-Analyse des aktuellen Prototyps (`prototyp/` @ `87f2800`)

Warum `prototyp/game.js` aktuell „mikrig und statisch“ wirkt:

1. **DPR auf 3 gedeckelt & Low-Res-Bitmaps:** `resize()` klemmt `dpr = Math.min(3, Math.round(devicePixelRatio))`, setzt `image-rendering: pixelated` und blittet winzige Pixelmaps (`BIRD_MAP` `18×10` → `36×20` log. px = **9,2 %** der 390-px-Breite, verfehlt QA E3 ≥ 12 %; `CREEP_MAP` `24×16` → `48×32`; `COIN` `8×8` → `16×16`). Selbst auf einem 4×-Backbuffer bleibt die Silhouette grobklotzig und klein.
2. **Fehlende Gegner-Animationen:** `vfx/enemy-anim.js` wird in `prototyp/index.html` gar nicht geladen. Krabbler und Vögel haben je nur **1 Frame** (`windup` wackelt um ±1,5 px, `aim` bobbt ±2 px, Tod rotiert den ganzen Sprite ohne Zerfall). Seilschneider, Beiß- und Spuckpflanze fehlen komplett.
3. **Unsichtbares Schwert & fehlende Kiro-Pose:** `drawSword()` zeichnet ab Fassmitte (`py + BH/2`) einen nackten `#4FF0FF`-Keil ohne Katana-Klinge (kein Griff/Tsuba/Stahl) und ohne Kiros Hiebpose — damit verfehlt er zusätzlich die Doc-Regel („90°-Bogen ab knapp über dem Kopf“).
4. **Kaum sichtbarer Seil-Durchhang & fehlende Szene:** `sagPx = 4` in Modus B verschiebt nur das Fass vertikal um 4 px; `segRest` zieht sich jede Frame straff auf `dist`, sodass am Verlet-Seil selbst kaum Slack entsteht. Mondlichtkegel, Wandlaternen, Parallax-Tiefe, Portal-Spirale und animierte Münzen fehlen.
5. **Palettenbruch:** `prototyp/game.js` nutzt eigene Farben (`#0c0a1c`, `#4a5cc4`, `#ff7a2c`, `#6a8ae0`) statt `concepts/art-direction.md`.

---

## 1. Render-Architektur für native DPR bis 4× (ohne Framedrops)

### 1.1 Backbuffer-Größe & adaptiver DPR-Cap (`4 → 3 → 2`)

- **Effektive DPR:** `rawDPR = window.devicePixelRatio || 1` (nicht auf `Math.round` runden — exakte Skalierung wie `2.625` oder `3.5` direkt nutzen!).
- **Backbuffer:**
  ```js
  const effDPR = Math.min(rawDPR, dprCap); // dprCap startet bei 4
  canvas.width  = Math.round(cssW * effDPR);
  canvas.height = Math.round(cssH * effDPR);
  ```
  Auf `390×844` @ DPR 4 ergibt das `1560×3376 px` (**5,27 MPix**).
- **Zweistufige adaptive Drosselung mit Hysterese:**
  - **Stufe 1 (ab `p90 > 18,5 ms` über 60 Frames, ohne Resize-Ruckler):**
    - `vfx` Partikelbudget auf `60 %` (`168` statt `280`),
    - optionale Umgebungs-Staubflocken halbieren, Mondlicht-Kegel optional deaktivieren.
  - **Stufe 2 (nur wenn Stufe 1 nicht reicht: `p90 > 20,5 ms` über weitere 60 Frames, Cooldown ≥ `4000 ms`):**
    - `dprCap` um 1 senken (`4 → 3`, danach `3 → 2`), `resize()` + gestaffelten `ImageBitmap`-Rebuild anstoßen (laufendes Spiel läuft ohne Hänger weiter; alte Bitmaps bleiben bis `Promise.all` fertig ist aktiv).
  - **Hochschalten (Hysterese):** Erst wenn `p90 < 14,5 ms` über `180 Frames` (`3 s`) und Cooldown ≥ `8000 ms`, `dprCap` um 1 anheben (`2 → 3` bzw. `3 → 4`).

### 1.2 Retro-Look-Strategie (verbindliche Entscheidung)

**Entscheidung:** **High-Res 90er-Arcade-Vektor-Atlanten (`ImageBitmap`s in Ziel-DPR `effDPR` bis 4×) + hochauflösende additive VFX darüber** (kein hochskalierter Low-Res-Pixelmatsch).

- **Begründung:**
  1. `concepts/art-direction.md` schreibt verbindlich vor: *„Kein Pixel-Look; weiche, saubere Vektorformen, alles auf devicePixelRatio skaliert.“*
  2. Sabas Forderung *„Retro-Style soll Ultra-4K sein, nicht so mikrig“* meint die **knackige 90er-Arcade-Silhouette** (markante dunkle `2–2,5 log. px` Outlines in `#0E1724`/`#05070F`, klare Cel-Shading-Farbstufen aus der Palette, lesbare Retro-Fonts `Bungee`/`Russo One`/`PS2P`), jedoch mit **gestochen scharfen 4K-Kanten** statt verpixelter `18×10`-Klötzchen.
  3. Figuren werden deutlich größer (Referenz-Fasshöhe **`BH = 84 log. px`**, Breite **`BW = 76 log. px`** bei `390×844` → Ninja+Fass `19,5 %` Breite auf 390 px / `21,1 %` auf 360 px; Gegner `0.70–0.95·BH` = **`58–80 log. px`** = `15–21 %` Breite → erfüllt QA E3 `>= 12 %` und `>= 18 %`).
- **`imageSmoothingEnabled`-Regeln (strikt je Ebene):**
  - **Ebene 0 & 1 (Schacht-Hintergrund, gekachelte Seitenwände ohne Rotation):** `ctx.imageSmoothingEnabled = false`, Zielkoordinaten auf ganze Gerätepixel eingerastet (`Math.round(x * effDPR) / effDPR`) → **0 Graustufen-Säume** (QA E2).
  - **Ebene 2–4 (rotierte/skalierte `ImageBitmap`-Sprites, Verlet-Seil, Verlet-Schal, Katana-Smear, Gegner-Gliedmaßen):** `ctx.imageSmoothingEnabled = true`, `ctx.imageSmoothingQuality = effDPR >= 3 ? 'medium' : 'high'`.
  - **Ebene 5 (Weiche Glows, Laternen, Portal-Halo, Mondkegel):** Vorgerendert bei **`FX_DPR = Math.min(effDPR, 2)`** mit `imageSmoothingEnabled = true`. Weiche Radialgradienten sind bei 2× optisch identisch zu 4×, sparen aber **75 % Speicher & Fillrate**!

### 1.3 Vorrendern als kompakte `ImageBitmap`-Sprites (warum KEINE `2048×2048`-`<canvas>`-Atlanten!)

Unser Benchmark (Abschnitt 4) hat gezeigt: Große `2048×2048` `<canvas>`-Atlanten erzeugen bei DPR 4 unter Software-Skia/4×-Throttle **49,67 ms** Script-Spikes und `37,7 MB` VRAM. Mit **kompakten einzelnen `createImageBitmap()`-Sprites (`≤ 512 px` je Kante bei DPR 4, Kacheln/Glows bei `FX_DPR = 2`)** sinkt die Scriptzeit auf **`1,36 ms avg / 2,00 ms p95`**!

- **Speicherbudget bei DPR 4 (Schätzung Vollset; Formel `w_px × h_px × 4 B`):**

| Asset-Gruppe | Logische Größe & Anzahl | Render-DPR | Gerätepixel | Speicher (MB) |
|---|---|---|---:|---:|
| Hintergrund-Schachtkachel (1 aktiv, max. 2 bei Biom-Übergang) | `330×256` × 2 | `FX_DPR = 2` | `660×512` | `2,70 MB` |
| Seitenwände L/R-Kachel (moosig/rissig) | `36×256` × 2 | `DPR = 4` | `144×1024` | `1,18 MB` |
| Spieler-Set (Fass normal/hit/rim, Kiro Kopf 4 Posen, Katana, Ersatzfass) | `~84×96` bis `110×110` × 8 | `DPR = 4` | `336×384`..`440×440` | `~4,60 MB` |
| 5 Gegner (modulare Körperteile: Segmente, Flügel, Schere, Kiefer, Blase) | `~80×80`..`110×110` × 11 | `DPR = 4` | `320×320`..`440×440` | `~5,40 MB` |
| Münzen (6 Spin-Frames) | `40×40` × 6 | `DPR = 4` | `160×160` | `0,61 MB` |
| Portal-Spirale (3 Ring-Layer + Glow) | `180×180` × 4 | `FX_DPR = 2` | `360×360` | `2,07 MB` |
| `BNVFX`-Sprites (Partikelscheiben, Glows, Laterne, Vignette) | `≤ 160` / `≤ 320 px` | `FX_DPR = 2` | max `320×320` | `~1,20 MB` |
| **Summe Vollset (geschätzt)** | | | | **`~17,76 MB`** |
| **Hartes Speicher-Limit bei DPR 4** | | | | **`≤ 24,0 MB`** |

*(Hinweis: Im Minimal-Benchmark mit je 1 Pose pro Gegner wurden exakt **`6,92 MB`** bei DPR 4 gemessen; bei DPR 3 sinkt das Vollset auf ~`10,5 MB`, bei DPR 2 auf ~`5,2 MB`.)*

### 1.4 Fillrate- & Allokations-Regeln bei 4× auf Mobilgeräten

- **Kein `shadowBlur`** (gemessener Frame-Killer: `113,89 ms` bei DPR 4!).
- **Keine Gradienten pro Frame:** Alle Gradienten werden beim `ImageBitmap`-Bau erzeugt oder in `WeakMap` pro Kontext gecacht (`BNEnemyAnim`).
- **Fillrate-Limit für `'lighter'`:** Bei `5,27 MPix` Backbuffer darf die Summe aller additiven (`'lighter'`) Flächen **maximal `35 %` der Bildschirmfläche (`≤ 1,85 MPix`)** pro Frame betragen:
  - max. 2 sichtbare Laternen-Glows (`r ≤ 95 log. px`),
  - max. 1 Portal-Glow (`r ≤ 90 log. px`),
  - aktiver Schwert-Trail (max. 4 schmale Bögen),
  - max. 60 gleichzeitig aktive additive Funken im 280er-Pool.
  - **Kein Vollbild-`'lighter'`-Quad** für Mondlicht (Mondlicht als dezent vorgerenderter `alpha`-Layer im Hintergrund oder nur in den oberen 45 % des Schachts bei `Q.low === false`).
- **Null Allokationen pro Frame:** Alle Partikel, Hiebe, Flashes, Risse, Leichen, Münz-Flüge, Seil- & Schalknoten arbeiten ausschließlich in vorallokierten `Float32Array`s / festen Ringpuffern.

---

## 2. Detaillierte Animations- & VFX-Specs (Punkte 1–5)

Alle Größen sind **relativ zur Fasshöhe `BH`** angegeben (Referenz bei `390×844`: `BH = 84 log. px`, `BW = 76 log. px`). Frame-Zahlen beziehen sich auf **60 fps (`16,67 ms/Frame`)**.

---

### (1) Sichtbare Katana-Klinge & Kiro-Pose im 90°-Bogen

**Ziel:** Weg vom unsichtbaren Keil ab Fassmitte — Kiro schwingt eine deutlich lesbare Katana-Klinge von knapp über dem Kopf (`-90°`) über volle `90°` bis zur Waagerechten (`0°` rechts / `-180°` links), inkl. Schulter-/Kopfpose und Hieb-Feedback.

#### Aufbau & Pivot (relativ zu `BH`)
- **Pivot (Schulter-/Griff-Zentrum):**
  - Mit Fass: `(vis.x + dir * 0.08·BH, vis.y - 0.18·BH)` *(liegt knapp über dem oberen Fassrand auf Höhe von Kiros Schulter/Kopfbasis)*.
  - Ohne Fass (`broken`): `(vis.x + dir * 0.06·BH, vis.y + 0.08·BH)`.
- **Reichweite & Hitbox (QA B5):** Sektor **`-90°` bis `0°`** (rechts) bzw. **`-90°` bis `-180°`** (links), Radius **`R = 1.05·BH`** (`~88 log. px`), vertikale Toleranz ab Pivot **`[-1.05·BH, +0.28·BH]`** — Hitbox und sichtbarer Klingen-Smear decken exakt denselben 90°-Quadranten ab.
- **Katana-`ImageBitmap` (`1.00·BH × 0.22·BH`, ca. `84×18 log. px`):**
  - **Tsuka (Griff, `0.20·BH`):** `#121833` (`suitShade`) mit Rautenwicklung in `#E2283C` (`scarf`).
  - **Tsuba (Stichblatt, `0.06·BH × 0.16·BH`):** `#4A4F57` (`iron`) mit Highlight `#9AA3AD` (`ironGlint`).
  - **Klinge (`0.74·BH`):** leicht gekrümmt (Sori `0.04·BH`), Klingenrücken `#3A5670` (`edge`), Schneide `#D8E4EE` (`steel`), Spitzen-Highlight `#FFFFFF` (`flash`), `1,8 log. px` Außenkontur `#0E1724` (`joint`).

#### Phasen-Timing (Gesamt `180 ms` = 11 Frames; Cooldown `260 ms`)

| Phase | Dauer (ms) | Frames @60 | Easing | Klinge & Smear | Kiro-Pose & Fass |
|---|---:|---:|---|---|---|
| **0. Bereitschaft (Idle)** | — | — | — | Klinge steckt sichtbar griffbereit schräg hinter/neben Fassrand (`+118°`) | Kopf blinzelt alle ~18 s; Schal flattert |
| **1. Windup (Ausholen)** | `35–40 ms` | **2–3** | `easeOutQuad` | Klinge schnellt über den Kopf auf **`-105°`** (15° Überspannung), `scaleY = 1.0` | Kiro-Kopf neigt `-6°` zurück, Augenband spannt; `scarf.impulse(-dir*140, -90)` |
| **2. Active Sweep (Hieb)** | `90 ms` (+`10 ms` Halten) | **5–6** | `easeOutCubic` (`1-(1-u)³`) | Klinge fegt **`-90° → 0°`** (bzw. `-180°` links); **4-Frame-Smear-Keil** in `#4FF0FF` (`lighter`, Alpha `0.85 → 0.52 → 0.28 → 0.12`) + dünner `#FFFFFF`-Kern im Lead-Frame | Kiro dreht Kopf/Oberkörper **`+dir * 10°`** in den Schlag; Fass-Rückstoß **`-dir * 3°`**; `scarf.impulse(dir*260, -70)` |
| **3. Follow-through & Recovery** | `40 ms` | **2–3** | `easeOutQuad` | Klinge überschwingt minimal auf **`+8°`**, fadet Smear aus (`45 ms`), zieht zurück in Bereitschaft | Kopf & Fass-Rückstoß (`3°`) klingen weich in `140 ms` auf `0°` zurück |
| **4. Treffer-Feedback** *(nur bei Hit!)* | `40–60 ms` Hit-Stop | **3** | — | 1 Frame weißer Treffer-Flash (`r = 0.30·BH`), **6–8 additive Hit-Funken** (`#4FF0FF` + `#FFFFFF`) in Hiebrichtung | `vfx.hitStop(50)` + `vfx.shake(4)` (bei Fehlschlag: **0 ms** Hit-Stop, **0 px** Shake) |

#### API-Anbindung
- **Bestehend:** `vfx.slash(x, y, dir, opts)`, `vfx.hit(x, y, opts)`, `vfx.emit(...)`, `scarf.impulse(...)`.
- **Erweiterung `vfx.js` (v0.3.0):** `vfx.slash()` übernimmt `a0` und `sweep` sauber direkt aus `opts` (kein nachträgliches Überschreiben auf dem Handle nötig) und unterstützt `opts.blade: false` vs. `true` (optionaler Weiß-Kern).
- **Neu in `ninja-anim.js` (v0.2.0):** `BNNinjaAnim.createKiro({ scale })` mit `kiro.draw(ctx, vis, state, assets)` (rendert Fass-Layer, Kiro-Kopf/Arme, Bereitschafts-/Hieb-Katana als `ImageBitmap` in richtiger Z-Reihenfolge).
- **Reduced Motion:** `0 px` Shake, kein `3°`-Fass-Rückstoß, Trail auf 2 Geister-Frames mit `0.45×` Alpha halbiert; Klinge + Pose bleiben vollständig sichtbar.

---

### (2) Große mehrphasige Gegner-Animationen (alle 5 Gegner)

**Grundsätze:**
- Alle Balance-Zeiten aus `balancing-spec.json` bleiben **unverändert**; Animationen lesen `e.t / e.windupMs` (`900 → 450 ms`), `e.crackMs` (`900 → 600 ms`), `cutMs` (`2200 → 1600 ms`).
- **Größen-Upgrade gegen „mikrig“:** Alle 5 Gegner skalieren auf **`0.72–0.95·BH` (`60–80 log. px`)** = **15–21 %** der Viewportbreite (QA E3 ≥ 12 % deutlich übertroffen).
- **Augen leuchten konstant** (reine Silhouette/Lesbarkeit im dunklen Brunnen, *kein* Aufblitzen als Warn-Marker).
- **Keine Warn-Marker:** Nur die jeweilige Körper-/Riss-Ausholbewegung kündigt den Angriff an.

#### 2.1 Wandkrabbler (`krabbler`) — Länge `~0.86·BH` (`72 log. px`), 5 Segmente + Kopf
- **Farben:** `#3B3F4A` (`krabbler`), `#8C8F99` (`krabblerSpike`), `#FF5A2A` (`krabblerEye`), `#0E1724` (`joint`), `#6E7682` (`spike`).
- **Pivot:** Rückenmitte an der Wandkante (`side = ±1`).

| Phase | Dauer (ms) | Frames @60 | Easing & Bewegung |
|---|---:|---:|---|
| **Idle** | `720 ms` Loop | **43** | Senkrecht an Wand; Beine krabbeln sinusförmig, Segmente atmen `±3,5 %` (`sy`), Mandibeln leicht öffnend (`0.2..0.3 rad`) |
| **Windup** *(einziger Telegraph)* | `windupMs` (`900→450`) | **54 → 27** | `0–25 %`: Kopf schwenkt zur Schachtmitte (`-90° → 0°/180°`). `15–70 %`: Körper zieht **`0.22·BH`** zur Wand zurück, staucht **`sx 0.80 / sy 1.22`**, Stacheln spreizen auf **`1.8×`**, Mandibeln reißen auf (`1.15 rad`). `75–100 %`: Spannungs-Zittern (`±2,5 px`). |
| **Attack (`jab` / `leap`)** | `250 ms` (`jab`) / `800–1100 ms` (`leap`) | **15** / **48–66** | `jab`: `easeOutCubic` Streckung in `80 ms` (**5 Frames**), `sx 1.15 / sy 0.88`, Mandibeln schnappen bei `55 ms` zu. `leap`: Einrollen in `140 ms` (**8–9 Frames**) + Spin `0.016 rad/ms`. |
| **Recover** | `500 ms` | **30** | Zurückdrehen an Wand (`smooth((q-0.2)/0.8)`), Stacheln legen sich an. |
| **Hit → Death** | `90 ms` + `720 ms` | **5** + **43** | `90 ms`: Weißer 1-Frame-Flash + Rückstoß `0.06·BH` + `sx 0.78 / sy 1.20`. `720 ms`: Panzer platzt in 5 ballistische Segment-`ImageBitmap`s (`g = 1100`) + `vfx.hit(..., {type:'krabbler'})`. |

#### 2.2 Klingen-Fledermaus (`fledermaus`) — Spannweite **`0.95·BH` (`80 log. px`)**
- **Farben:** `#241B3A` (`bat`), `#B9C3D6` (`batBlade`), `#D8E4EE` (`steel`), `#6E7682` (`spike`), `#FFC23A` (`batEye`).
- **Pivot:** Brustkorb-Mitte.

| Phase | Dauer (ms) | Frames @60 | Easing & Bewegung |
|---|---:|---:|---|
| **Idle** | `1500 ms` Loop | **90** | Hängt kopfüber (`180°`) an der Wand, Flügel eng angelegt (`spread 0.25`), leichtes Pendeln `±4°`, Ohren zucken |
| **Windup** *(einziger Telegraph)* | `windupMs` (`900→450`) | **54 → 27** | `0–20 %`: Ohren spitzen hoch (`earA +0.35`). `20–60 %`: Löst sich von Wand (`oy +0.12·BH`), dreht aus Kopfstand (`180° → 0°`), Sichelflügel entfalten auf `100 %`. `60–88 %`: Flügel spannen weit nach hinten (`cock = 0.95`), Ducken **`sy 0.84 / sx 1.08`**. `88–100 %`: Flügelspitzen zittern. |
| **Attack (`cross` / `swoop`)** | `900–1400 ms` | **54–84** | Kraftvoller Flügelschlag-Zyklus **12 Frames (`200 ms`)** pro Schlag mit `±8 %` Körper-Squash/Stretch, leicht vorgebeugter Jagdflug |
| **Hit → Death** | `90 ms` + `760 ms` | **5** + **46** | `90 ms`: Flash + Flügel knicken ein. `760 ms`: Beide Sichelflügel brechen separat ab und trudeln mit Spin `±11 rad/s` weg, Körper stürzt (`g = 1000`). |

#### 2.3 Seilschneider-Kobold (`seilschneider`) — Größe **`0.72·BH` (`60 log. px`)** am Seil
- **Farben:** `#4E7A3A` (`cutter`), `#2F5B4A` (`moss`), `#C7CED6` (`cutterClaw`), `#FFC23A` (`batEye`), `#0E1724` (`joint`).
- **Pivot:** Greif-Mitte am Seil.

| Phase | Dauer (ms) | Frames @60 | Easing & Bewegung |
|---|---:|---:|---|
| **Idle (`descend`)** | `570 ms`/Zyklus | **34** | Klettert Hand-über-Hand am Seil herab, Beine wechseln ab (`±4,5 px`), Ohren wippen |
| **Windup (`cut` Teil 1)** | `min(windupMs, 0.4·cutMs)` (`880→450 ms`) | **53 → 27** | Greift Seil fest, lehnt sich **`14°`** zurück, reißt Scherenklaue über Kopf (`+63°`), Scherenblätter spreizen maximal (`1.15 rad`); letzte `20 %`: Zittern |
| **Attack (`cut` Teil 2)** | `0.6·cutMs` (`1320→960 ms`) | **79 → 58** | Klaue saust in `90 ms` (**5–6 Frames**) aufs Seil, schnippt mit steigender Frequenz (`prog` 0→1) + `vfx.ropeFray()`-Seilfasern (`#C9A66B`) |
| **Hit → Death** | `90 ms` + `820 ms` | **5** + **49** | `90 ms`: Wird nach oben-hinten gedrückt (`oy -6 px`). `820 ms`: Fliegt rotierend (`9 rad/s`) vom Seil, beide Scherenblätter trennen sich und wirbeln weg. |

#### 2.4 Beißpflanze (`beisspflanze`) — Kopfgröße **`0.78·BH` (`66 log. px`)** aus Rückwand
- **Farben:** `#4E7A3A` (`cutter`), `#2F5B4A` (`moss`), `#E2283C` (`scarf` Maul), `#F4F1EA` (`text` Zähne).
- **Pivot:** Wandloch-Zentrum `(colX, rowY)`.

| Phase | Dauer (ms) | Frames @60 | Easing & Bewegung |
|---|---:|---:|---|
| **Windup (`crack`)** | `crackMs` (`900→600`) | **54 → 36** | `vfx.wallBreak` Riss wächst in 3 Schüben (`0–35 %`, `40–65 %`, `72–100 %`) + Krümel. Ab `q > 0.55`: Knospe drückt hinter dem Spalt hervor (`peek 0→1`, `scale 0.16→0.42`) |
| **Attack (`bite`)** | `200 ms` | **12** | Schießt mit `easeOutBack` auf **`1.20×`** heraus; Kiefer öffnet `0–100 ms` auf `105°`, schnappt `100–200 ms` hart zu (`sx 1.12 / sy 0.88`) |
| **Idle (`stay`)** | `900 ms` | **54** | Drohendes Wiegen (`±4,5°`), Blätter wippen |
| **Retract** | `300 ms` | **18** | Schrumpft `1.0 → 0` ins Loch + `vfx.wallClose(h, 300)` |
| **Hit → Death** | `90 ms` + `700 ms` | **5** + **42** | Flash + Stauchung, dann welkt Kopf sackend ins Loch, 2 Blätter fallen pendelnd herunter |

#### 2.5 Spuckpflanze (`spuckpflanze`) — Kopfgröße **`0.75·BH` (`63 log. px`)**
- **Farben:** `#4E7A3A` (`cutter`), `#2F5B4A` (`moss`), `#E2283C` (`scarf` Augen), `#05070F` (`abyss` Rohrmündung).
- **Phasen:**
  - `crack`: `900 ms` (**54 Frames**) wie Beißpflanze (`vfx.wallBreak` + Knospen-Peek).
  - `aim`: `500 ms` (**30 Frames**): `easeOutBack` voll herausfahren, Rohr dreht zu `aimDir`, Blase bläht sich von `r = 0.16·BH → 0.24·BH` (+50 %), ab `q > 0.72` Druck-Zittern.
  - `attack (spit)`: erste `220 ms` von `stay` (**13 Frames**): Rohr schnellt `0.07·BH` vor, Blase kollabiert (`easeOutCubic`), Körper-Rückstoß `0.06·BH` entgegen `aimDir`, Projektil + 4 Moos-/Spuck-Partikel.
  - `stay` (Rest) → `retract` (`300 ms` = **18 Frames**) → `hit (90 ms)` + `death (700 ms)`.

#### API-Anbindung (`enemy-anim.js` v0.2.0)
- **Erweiterung:** `BNEnemyAnim.create({ vfx, balance, cutterWindupMs, unitScale: BH / 52, dpr })`:
  - `ea.setPixelRatio(dpr)` baut `ImageBitmap`-Teile (`krabSeg`, `batWing`, `gobBody`, `plantLeaf`) bei Init/Resize vor → `0` Gradient-Lookups/Pfad-Neubauten bei statischen Gliedern.
  - `ea.drawEnt(...)`, `ea.kill(...)`, `ea.update(wdt)`, `ea.drawCorpses(ctx)` bleiben API-kompatibel!
- **Reduced Motion:** Hochfrequentes Windup-Zittern (`q > 0.72`) durch ruhiges `2 Hz`-Pulsieren (`±3 %` Scale) ersetzen; Todesteile mit `0.3×` Spin.

---

### (3) Barrel Swing (Fass-Schwung zur Gegenmauer)

**Farben:** Fass `#8A5A2E` (`wood`), `#5A3518` (`woodDark`), `#4A4F57` (`iron`), `#9AA3AD` (`ironGlint`), Geister/Spur `#4FF0FF` (`trail`) / `#9FD8FF` (`moon`), Staub `#3A5670`/`#1C2A3A`.

#### Phasen-Timing

| Phase | Dauer (ms) | Frames @60 | Easing | Bewegung, Squash/Stretch & VFX |
|---|---:|---:|---|---|
| **0. Wand-Ducken** *(Voraussetzung)* | `120 ms` | **7–8** | `easeOutCubic` | `sy = 0.90, sx = 1.06`, Kiro sinkt `0.26·BH` ins Fass (Fassrand verdeckt Gesicht, **Schalspitze bleibt sichtbar**), **`3°` Wandneigung**, 8 Staub + 5 Mörtelkrümel, `scarf.impulse(-side*80, 40)` |
| **1. Swing-Windup** | `70 ms` *(60–80)* | **4** | `easeOutQuad` | Fass zieht **`0.10·BH`** gegen die Startwand zurück, dreht **`-23°` (`-0.4 rad`)** rückwärts in Vorspannung, `sx 0.92 / sy 1.08` |
| **2. Flug (Bogen + Spin)** | `520 ms` | **31** | X: linear `u`; Y: `sin(u·π)` | **Aufwärtsbogen:** Scheitel **`-0.75·BH` (`-63 log. px`)**. **Spin:** **1,0 Umdrehung (`360°`, konfigurierbar `0.5–1.0`)**. **3 Afterimages** (bei `u ≈ 0.22, 0.45, 0.68`, Alpha `0.14 / 0.22 / 0.30` aus Fass-`ImageBitmap`). **Seilwelle:** läuft das Verlet-Seil hoch (`amp = sin(u·π) * 0.32·BH`). |
| **3. Wandaufprall** | `120 ms` | **7–8** | `easeOutQuad` | Landung `4 px` neben Gegenmauer; sofort **Stauchung `sy = 0.82 / sx = 1.12`** (klingt in `100 ms` auf `1.0` ab); `vfx.barrelHit()` (5 Holzsplitter) + 8 Staub + 6 Wandkrümel; **`4 px` Shake**; automatisch wieder geduckt |
| **4. Gegner-Treffer unterwegs** | `40 ms` Hit-Stop | **2–3** | — | Pro Gegner-Treffer im Swing: **`40 ms` Hit-Stop**, `vfx.hit(..., { hitStop: 40, shake: false })`; **kein** Hit-Stop beim leeren Wandaufprall |

#### API-Anbindung
- **Bestehend:** `vfx.barrelHit(x, y, dir)`, `vfx.hit()`, `vfx.shake(4)`, `vfx.emit()`, `scarf.impulse(swingDir*300, -40)`.
- **Neu (Ringpuffer ohne Allokation):** `vfx.afterimage(bitmap, x, y, rot, alpha)` oder fester 4-Slot-Pool in `BNNinjaAnim` statt `ghosts.push/shift` (spart Objektallokationen).
- **Reduced Motion:** `0 px` Shake beim Aufprall; max. 2 Afterimages mit Alpha `≤ 0.18`; Spin halbiert (`0.5` Umdrehung) oder als gleitende Neigung `±18°`.

---

### (4) Verlet-Seil, Durchhang beim Hochsteuern & Schaukeln oben

**Architektur-Grundsatz:** Gameplay-Hitbox `(px, py)` folgt der Eingabe direkt (kritisch gedämpfte Feder `80–120 ms`, bzw. `inputStart 60 %` + `100 ms` Rampe, **kein Überschwingen**). Das Verlet-Seil und das Schaukeln laufen **rein optisch** nach (Hitbox-Sway max. `±4 px` oder `0 px`).

#### Solver-Parameter (`vfx/rope.js` → `BNRope`)
- **Segmente:** **12 Segmente** (`10–14` Bereich, 13 Knoten in `Float32Array`).
- **Fester Zeitschritt:** `stepMs = 1000 / 120` (`8,333 ms`), max. `6` Substeps pro Frame.
- **Constraint-Iterationen:** **3 Durchgänge** pro Substep.
- **Längen-Verwaltung:** Obere `topSegs = 4` Segmente nehmen beim Auf-/Abseilen Länge auf/ab (`minSegLen = 5 px`); untere 8 Segmente halten die Seilspannung träger.

#### Sichtbarer Durchhang beim Hochsteuern (Regel 3)
*Problem bisher:* `segRest` wurde jede Frame direkt an `dist` angepasst, daher entstand beim Hochsteuern kein sichtbarer Seil-Durchhang.
- **Lösung (Slack-Impuls bei `dir === 'up'`):**
  - Auslöser: Sobald der Joystick auf `up` wechselt (`fresh`), erhält das Seil einen optischen **Slack-Faktor `slack = 1.065`** (ca. **`12–24 log. px` effektive Überlänge**, verteilt auf Segmente `4..11`) plus einen winzigen seitlichen Ausweich-Impuls (`±5 px` alternierend in Knoten `4..8`).
  - **Timing:**
    - Aufbau in **`35–50 ms` (2–3 Frames)** → klar erkennbare leichte S-Welle / Bauch im unteren Seildrittel!
    - Straffung zurück auf `1.000` in **`150 ms` (9 Frames)** mit `easeOutQuad`.
  - **Modus B (Standard) vs. Modus A (Pausemenü):** In Modus B fährt `py` sofort hoch, nur das Seil staucht kurz sichtbar. In Modus A sinkt zusätzlich `py` für `60 ms` um `4 px` ab.

#### Schaukeln (gedämpfte Winkelfeder, nicht frei schwingend)
- **Oben an der Grenze (`py <= barrelTopMin` & `up`):**
  - Winkelfeder weich gekappt bei max. **`±25°` Seil-Auslenkungswinkel** (bzw. Fass-Pendel `±6°` / `14 log. px` Querversatz, Periode `900 ms`, Halbwertszeit `400 ms`). Signalisiert klar „geht nicht weiter rauf“, ohne Kontrolle zu nehmen.
- **Seitliches Bewegen / Stopp:** **`±2–4°`** (`3.5°`, Periode `1100 ms`, HWZ `300 ms`), kleiner Impuls bei Richtungswechsel.
- **Idle:** Sanfte **`±1,5°`** Atmung (Periode `1600 ms`).

#### DPR-skalierte Ultra-4K-Zeichnung (4-Pass-Stroke in 1 Pfad-Aufbau)
1. Glatte Kurve über Catmull-Rom durch die 13 Verlet-Knoten (vorallokierter `Float32Array(50)`-Puffer, 0 GC).
2. Pass 1 (Kontur): `#0E1724` (`joint`), `lineWidth = 0.085·BH` (`~7,1 log. px`).
3. Pass 2 (Grundlinie): `#8C6E3F` (`ropeShade`), `lineWidth = 0.060·BH` (`~5,0 log. px`).
4. Pass 3 (Heller Grat): `#C9A66B` (`rope`), `lineWidth = 0.028·BH` (`~2,4 log. px`, leicht um `-0,8 px` Richtung Lichtquelle versetzt).
5. Pass 4 (Verdrillungs-Strichel): alle `6 log. px` schräge Querstriche (`±45°`) in `#5A3518` (`woodDark`), `lineWidth = 1,2 log. px` — alle Striche in einem einzigen `beginPath()...stroke()`-Aufruf!

#### API (`vfx/rope.js` v0.1.0 — neues Modul)
```js
const rope = BNRope.create({ segments: 12, stepMs: 1000/120, iterations: 3, topSegs: 4, maxTopAngleDeg: 25 });
rope.reset(ax, ay, bx, by);
rope.triggerUpSag({ slack: 1.065, ms: 160 });
rope.triggerSwingWave(dir, u);
rope.update(dtMs, ax, ay, bx, by, swingPhase, swingU);
rope.draw(ctx, BH); // skaliert Strichstärken mit BH und über ctx-Transform sauber auf 1x..4x DPR
```
- **Reduced Motion:** Schaukel-Amplituden auf `30 %`, Swing-Welle auf `40 %`, Durchhang auf `50 %`.

---

### (5) Portal-Spirale, Münze & Fass-Bruch-VFX

#### 5a) Portal-Spirale (Brunneneingang / Einstieg)
- **Größe:** Durchmesser **`1.80·BH` (`~151 log. px`)**.
- **Farben:** `#05070F` (`abyss` Kern), `#12304A` (`top`), `#9FD8FF` (`moon`), `#4FF0FF` (`trail`), `#FFE2A8` (`lanternCore`).
- **Aufbau (3 vorgerenderte `FX_DPR=2` Ring-`ImageBitmap`s + 1 Halo-Glow):**
  1. **Außenring (4 Spiralarme):** Rotation `+0,45 U/s` (`162°/s`), Alpha `0.55`, `#9FD8FF`.
  2. **Mittelring (3 Spiralarme):** Rotation `-0,85 U/s` (`-306°/s`), Alpha `0.78`, `#4FF0FF`.
  3. **Kernstrudel (2 Arme + Kernring):** Rotation `+1,40 U/s`, Alpha `0.95`, `#4FF0FF` → `#FFE2A8`.
  4. **Halo-Glow:** `180×180` Radialgradient (`FX_DPR=2`), 1× `'lighter'` Draw-Call (Alpha `0.65`).
- **Spiral-Partikel:** Pool von **28 Partikeln** (analytisch auf logarithmischer Spirale nach innen laufend, Lebensdauer `450–700 ms`, Size `2–4 log. px`, `#4FF0FF` / `#9FD8FF`).
- **Start-Übergangs-Sequenz (`750 ms` = 45 Frames):** `0–220 ms` (13 Frames, `easeOutBack`) Portal öffnet `0 → 1.0`; `220–520 ms` (18 Frames) Kiro seilt durch den Kern hinein (`scale 0.7 → 1.0`); `520–750 ms` (14 Frames) Portal schrumpft/scrollt nach oben aus dem Bild.
- **Reduced Motion:** Rotationsgeschwindigkeiten `0.25×`, Partikel halbiert, kein Zoom-Sog.

#### 5b) Münze (Ultra-4K-Retro Spin, Glint, Pickup-Burst, HUD-Flug)
- **Größe:** **`0.38·BH` (`32 log. px` Durchmesser)** — mit `1,8 log. px` `#0E1724`-Kontur, Rand `#8A5A2E`/`#5A3518`, Fläche `#FFB347` (`lantern`), Prägung `#FFE2A8` (`lanternCore`).
- **Spin-Frames:** **6 vorgerenderte `ImageBitmap`s** (`40×40 log. px` @ DPR 4 = `160×160 px`), Zyklus **`540 ms` (`90 ms` = 5–6 Frames pro Step)**. Frames 2 & 4 zeigen eine schmale goldene Randkante (`#8A5A2E` + `#FFE2A8`), damit die Münze plastisch dreht.
- **Glint:** Alle `1800 ms` (gestaffelt per `id * 230 ms`) läuft ein schräger Glanzstreifen (`#FFE2A8` / `#FFFFFF`) in **`180 ms` (11 Frames)** diagonal über die Münzfläche.
- **Pickup-Burst & Zähler-Flug:**
  - Bei Kontakt: **6 goldene Funken** (`#FFE2A8`/`#FFB347`) + 1 expandierender Ring (`r: 0.18·BH → 0.42·BH`, **`180 ms` = 11 Frames**, `easeOutCubic`).
  - **Zähler-Flug:** 16er-Ringpuffer; Münze fliegt in **`360 ms` (22 Frames, `easeInCubic` + leichter Bogen)** zum Münz-HUD; beim Eintreffen HUD-Pop (`1.0 → 1.25 → 1.0` in **`120 ms` = 7 Frames**).
- **Reduced Motion:** Spin-Zyklus `1100 ms`, kein HUD-Flug (sofortiger HUD-Pop + 3 lokale Funken).

#### 5c) Fass-Bruch (`vfx.barrelBreak` Upgrade)
- **Farben:** `#8A5A2E` (`wood`), `#5A3518` (`woodDark`), `#4A4F57` (`iron`), `#9AA3AD` (`ironGlint`), `#3A5670` (`edge`), `#9FD8FF` (`moon`), `#E2283C` (`scarf` Vignette), `#FFFFFF` (`flash`).

| Zeit / Phase | Dauer (ms) | Frames @60 | Effekt & Details |
|---|---:|---:|---|
| **Impact + Flash** | `0–60 ms` | **1–4** | 1 Frame weißer Kern-Flash (`r = 0.70·BH`); **`60 ms` Hit-Stop**; **`6 px` Trauma-Shake**; roter Vignetten-Puls (`650 ms` Fade) |
| **Fass-Dauben (`K_STAVE`)** | `900–1200 ms` | **54–72** | **6–8 große Holzdauben** (`0.16·BH × 0.45·BH`, Holzmaserung + dunkle Kante) sprengen radial auseinander (`v = 180–400 px/s`, `g = 950`, Spin `±10 rad/s`) |
| **Eisenreifen (`K_RING`)** | `1000–1200 ms` | **60–72** | **2–4 gebogene Eisenreifen-Stücke** (`#4A4F57` + Glanz `#9AA3AD`) fliegen seitlich-aufwärts |
| **Splitter, Staub & Brunnenwasser** | `350–800 ms` | **21–48** | **8 Holzsplitter**, **12 Staubwolken** (`alpha 0.35`), **8–10 Wassertropfen** (`#9FD8FF`, `g = 850`, `400 ms`) |
| **Ersatzfass anlegen (`equip`)** | `400 ms` | **24** | `0–240 ms` (`easeOutBack`): neue Dauben schließen sich um Kiro; `240–400 ms`: Eisenbänder schnappen ein + 6 Funken (`lanternCore`) |

- **Neue/erweiterte `BNVFX`-APIs (`vfx.js` v0.3.0):**
  - Partikelart `K_STAVE` (gebogene Holzdaube mit optionalem `ImageBitmap`-Blit) & `K_DROP` (Tropfen in `moon`/`trail`).
  - `vfx.portalSpawn(x, y, opts)` / `vfx.portalDraw(ctx, x, y, tMs, scale)` (oder eigenes kleines Modul `vfx/portal-coins.js` mit `BNPortalCoins.create({ vfx, dpr })` — hält `vfx.js` schlank!).
  - `vfx.afterimage(...)` bzw. in `ninja-anim.js`.
- **Reduced Motion:** `0 px` Shake, `0.2` max. ScreenFlash, Vignette `0.5`, Partikelzahl halbiert.

---

## 3. Performance-Budget & Abnahme-Gates (Ziel 16,67 ms @ 60 fps)

### 3.1 Frame-Budget (Referenz `390×844` @ DPR 4, Vollbetrieb)

| Budget-Posten | Ziel / Limit | Gemessen / Schätzung |
|---|---|---|
| **Gesamte Frame-Zeit (Ziel 60 fps)** | **≤ 16,67 ms** (QA E5 `p95 ≤ 17,5 ms`, `0` Frames > `33,3 ms`) | **16,67 ms avg / 16,70 ms p95** *(gemessen @ DPR 4 Throttle 1×; bei 4× Throttle s. 3.2)* |
| **Script: Logik + Physik** (Input, Seil-Verlet 12 Seg., Schal-Verlet 9 Seg., Gegner-AI, Kollision) | **≤ 1,80 ms** | *Geschätzt ~1,0–1,4 ms* |
| **Script: Canvas-Draw** (Tiles, `ImageBitmap`-Blits, Seil-Stroke, `BNVFX`-Pool) | **≤ 3,20 ms** | **`1,36 ms avg / 2,00 ms p95`** *(gemessen im DPR-4-Mini-Benchmark unter 4× CPU-Throttle!)* |
| **Draw-Calls pro Frame** | **≤ 95** | *~45–75 im Normalbetrieb* (4× Seil-Passes, ~10 Tiles, ~12 Sprites/Teile, 1 Schal, ~15 Partikel-Batches, HUD) |
| **Partikel-Pool Max** | **280** gesamt (**≤ 60** gleichzeitig `'lighter'`) | Hart gedeckelt (`BNVFX` ersetzt ältesten Slot bei Überlauf) |
| **Fillrate / Overdraw** | Basis 1× (`5,27 MPix`) + **≤ 0,35×** `'lighter'` (`≤ 1,85 MPix`) | Gesamter Overdraw **≤ 1,8×** (`9,5 MPix/Frame`), **0** `shadowBlur`, **0** Fullscreen-`'lighter'` |
| **Atlas-Speicher @ DPR 4** | **≤ 24,0 MB** | **`6,92 MB`** *(gemessen Minimalset)* · **`~17,8 MB`** *(geschätzt Vollset)* |

### 3.2 Reale Messwerte aus Mini-Benchmark (`/workspace/pwtest/ultra4k_bench*.js`)

**Test-Setup:** Google Chrome `156.0.8078.47` (Playwright headless), Viewport `390×844`, eigener HTTP-Server auf `127.0.0.1:8766` (Playtest-Port `8765` unberührt), Szene mit Kachel-Wänden, Verlet-Seil (12 Seg.), Verlet-Schal (9 Seg.), 5 Gegnern, 8 Münzen, Portal-Glow, 2 Laternen-Glows, Katana + `BNVFX` (~85–120 aktive Partikel).

| Szenario | DPR (Backbuffer) | Throttle | Atlas-Build / MB | Script Avg / P95 | Frame-Intervall Avg / P95 | Befund |
|---|---|---|---|---|---|---|
| **Negativ-Test 1:** Große `<canvas>`-Atlanten (`2048×2048`) | 4 (`1560×3376`) | 4× CPU | `22,8 ms` / `37,69 MB` | **`49,67 ms` / `58,90 ms`** | `70,76 ms` / `83,40 ms` | **FAIL** — >2048px-`<canvas>`-Crops + Readbacks sprengen Budget |
| **Negativ-Test 2:** `shadowBlur=14` + Fullscreen-`'lighter'` | 4 (`1560×3376`) | 4× CPU | `20,2 ms` / `37,69 MB` | `1,46 ms` / `2,40 ms` (JS) | **`113,89 ms` / `150,00 ms`** | **FAIL** — Rasterizer bricht auf ~8,8 fps ein |
| **Lösung:** Kompakte `ImageBitmap`s + `FX_DPR=2` | **2** (`780×1688`) | 4× CPU | `9,4 ms` / `3,07 MB` | **`0,71 ms` / `1,20 ms`** | **`16,67 ms` / `16,70 ms`** | **PASS** — `0` Frames > 33 ms |
| **Lösung:** Kompakte `ImageBitmap`s + `FX_DPR=2` | **3** (`1170×2532`) | 4× CPU | `9,3 ms` / `4,67 MB` | **`1,06 ms` / `1,80 ms`** | `36,42 ms` / `50,10 ms` | JS schnell; Software-Skia fillrate-begrenzt bei 4× CPU-Drossel |
| **Lösung:** Kompakte `ImageBitmap`s + `FX_DPR=2` | **4** (`1560×3376`) | 4× CPU | `12,7 ms` / `6,92 MB` | **`1,36 ms` / `2,00 ms`** | `72,91 ms` / `83,40 ms` | JS bleibt **≤ 2,0 ms**! Software-Skia 5,27 MPix fillrate-begrenzt |
| **Lösung (GPU-Proxy ohne CPU-Skia-Bremse):** | **4** (`1560×3376`) | 1× | `8,7 ms` / `6,92 MB` | **`0,19 ms` / `0,30 ms`** | **`16,67 ms` / `16,70 ms`** | **PASS** — `0` Frames > 33 ms |

**Wichtige Schlussfolgerung für die Mess-Methode:**  
Im Headless-Chromium drosselt `Emulation.setCPUThrottlingRate: 4` nicht nur JS, sondern auch Chrome's **Software-Skia-Pixel-Rasterizer** um den Faktor 4 — deshalb ist bei 5,27 MPix (DPR 4) die Headless-Framezeit fillrate-limitiert (`72,9 ms`), obwohl JS nur `1,36 ms` braucht.  
**Prüfprotokoll für QA & Entwicklung:**
1. **Headless DPR 2–3 + 4× CPU-Throttle (Port `8766` bzw. QA `8765`):** `scriptP95 ≤ 3,5 ms`, `frameP95 ≤ 17,5 ms` (bei DPR 2), `0` Konsolenfehler, Speicherwachstum nach 3 min `≤ 20 %`.
2. **Headless DPR 4 + 1× Throttle:** `scriptP95 ≤ 1,5 ms`, `frameP95 ≤ 16,7 ms`, plus **4×-Throttle-Script-Check** (`scriptP95 ≤ 3,5 ms`).
3. **Echtes Mobilgerät (DPR 3–4, GPU):** 60 fps-Prüfung mit aktivem adaptivem Cap (`4 → 3 → 2`).

---

## 4. Umsetzungsreihenfolge & Arbeitsteilung

### Was **Animation & Effekte** liefert (eigenständige Module unter `vfx/`)
1. **`vfx/rope.js` (neu, v0.1.0, `BNRope`):** Verlet-Seil (12 Seg., 120 Hz, 3 Iterationen), sichtbarer Durchhang beim Hochsteuern (`triggerUpSag`), gedämpfte Schaukel-Winkelfeder (`±25°` oben, `±3,5°` seitlich, `±1,5°` idle), Swing-Welle, DPR-skalierter 4-Pass-Stroke.
2. **`vfx/vfx.js` (Update auf v0.3.0):** `FX_DPR = min(dpr, 2)` Trennung für Glows/Laternen, sauberer `a0`/`sweep`-Support in `slash()`, `K_STAVE` (Fass-Dauben) & `K_DROP` (Wassertropfen) für erweiterten `barrelBreak()`, `afterimage()`-Ringpuffer.
3. **`vfx/ninja-anim.js` (Update auf v0.2.0):** `BNNinjaAnim.createKiro()` — `ImageBitmap`-Sprites für Fass, Kiro-Kopf, Katana (Griff/Tsuba/Klinge), 90°-Hiebpose + Bereitschaftspose, Duck-Clipping mit sichtbarer Schalspitze, integriert mit `createScarf()` & `createSpeedlines()`.
4. **`vfx/enemy-anim.js` (Update auf v0.2.0):** `unitScale` auf `0.72–0.95·BH` hochskaliert, `setPixelRatio(dpr)` baut kompakte Teil-`ImageBitmap`s vor (0 Gradient-Allokationen), voller 5-Gegner-Umfang.
5. **`vfx/portal-coins.js` (neu, v0.1.0, `BNPortalCoins`):** Portal-Spirale (3 Ring-`ImageBitmap`s + Glow + 28er-Partikelpool + Start-Sequenz), 6-Frame-Münz-Spin-`ImageBitmap`s + Glint + 16er-HUD-Flugpool.
6. **Live-Demo (`vfx/demo-ultra4k.html`):** Alle 5 Punkte einzeln und kombiniert bei DPR 1–4 testbar.

### Was **Entwicklung** in `hasanbeg99/kagewell/prototyp/` einbaut
1. **DPR- & Loop-Gerüst in `prototyp/game.js` + `prototyp/index.html`:** `effDPR = min(rawDPR, dprCap)` bis 4×, `image-rendering: auto` für Canvas + `imageSmoothingEnabled`-Layer-Switch, adaptiver Cap (`4 → 3 → 2`), `../vfx/*`-Scripts einbinden, `sw.js` Precaching ergänzen.
2. **Größenkonstanten & Palette:** `BH = 84`, `BW = 76` (bzw. proportional zu `logicalW`), Umstellung aller Farben auf `BNVFX.PALETTE`, Parallax-Schacht + Wandlaternen (`vfx.lantern`) + Biom-Tiles (`FX_DPR = 2`).
3. **Gameplay-Hooks an die Module:**
   - Input-Puffer + kritisch gedämpfte Feder an `BNRope` + `BNNinjaAnim` anbinden, `B`/`HB`-Debug-Buttons ins `?debug=1`/Pausemenü verschieben.
   - Schwert-Hitbox exakt auf den 90°-Sektor ab `(cx, headPivotY)` mit `R = 1.05·BH` angleichen (QA B5).
   - `BNEnemyAnim` für alle 5 Gegner + Fallen einhängen; `laneFlash`/`dotted`/`!` endgültig entfernen.
   - `BNPortalCoins` in Startsequenz, Münz-Spawner und HUD-Zähler einhängen; `drawFaint()` nach Story-Doc umsetzen.
   - Test-Hook `window.__BN` um `dpr`, `effDPR`, `dprCap`, `frameTimes`, `actionIcon`, `atWall`, `joy` (wie in `qa/ABNAHME-rebuild-2026-11-23.md` gefordert) erweitern.

---

## 5. Offene Entscheidungen für Alu (vor Start der Modul-Implementierung)

1. **DPR-Standard auf Desktop/High-End-Geräten:** Soll `dprCap` initial auf `4` stehen (Standard-Vorschlag dieser Spec, mit adaptivem Fallback `4 → 3 → 2`) oder soll auf Geräten mit `logicalW × 4 > 2000 px` Breite (Desktop-4K-Monitor) bei `3` gedeckelt und nur auf Mobil-Viewports (`≤ 480 CSS px`) bis `4` freigegeben werden?
2. **Schwert-Startwinkel & Hitbox-Kopplung:** Aktuell startet `game.js` die Schwert-Hitbox ab Fassmitte (`py + BH/2`), die Spec setzt Pivot & Hitbox auf **knapp über Kiros Kopf (`py - 0.18·BH`)** für einen echten 90°-Bogen (`-90° → 0°`). Bitte mit Game Design bestätigen, dass Gegner direkt auf Brust-/Unterfass-Höhe vor dem Fass noch vom unteren Auslauf (`+0.28·BH` ab Pivot) abgedeckt werden sollen.
3. **Wassertropfen beim Fass-Bruch:** In `SPEC` ist ein dezenter Spritz-Anteil (`8–10` Tropfen `#9FD8FF`) beim `barrelBreak` vorgesehen (passend zu Brunnentiefe / Apple-4.3-Idee „Wasser im Fass“). Soll der schon jetzt in `vfx.js` v0.3.0 aktiv sein oder rein Holz/Eisen/Staub?
4. **Sichtbarkeit des Durchhangs (`sagMode`):** Default bleibt Modus B (nur Seil staucht sichtbar in `35–50 ms` auf `slack = 1.065` + strammt in `150 ms`, Fass fährt sofort hoch); Modus A (Doc-Variante) nur noch im Pause-/Optionsmenü statt per Spielfeld-Knopf `B`. Abgenickt?
