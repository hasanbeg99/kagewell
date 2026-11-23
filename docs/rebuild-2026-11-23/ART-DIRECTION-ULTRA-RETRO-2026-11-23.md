# Kagewell (Barrel Ninja) — Art Direction „Ultra-4K-Retro“ (Prototyp-Neubau)

**Stand:** 23.11.2026  
**Ziel-Repo & Ordner:** `hasanbeg99/kagewell`, Ordner `prototyp/` (Root `/` bleibt unberührt)  
**Ersetzt:** `/workspace/barrel-ninja/concepts/art-direction.md` (alter Vektor-Stil wird durch gestochen scharfe 16/32-Bit-Hi-Bit-Pixelart ersetzt)  
**Referenz-Assets (erstellt unter `/workspace/teamdoc/concepts/`):**
- Gameplay-Konzept (9:16): `/workspace/teamdoc/concepts/kagewell-gameplay-concept.jpg`
- Titelbildschirm & Wiesenszene (9:16): `/workspace/teamdoc/concepts/kagewell-title-concept.jpg`
- Muster-Sprite 1× (80×96 AP, echtes Pixelart-PNG): `/workspace/teamdoc/concepts/kiro-barrel-sample-1x.png`
- Muster-Sprite Grid- & Paletten-Demo (1× vs. 4× DPR): `/workspace/teamdoc/concepts/kiro-barrel-grid-demo.png`

---

## Leitidee: Was „Ultra-4K-Retro“ bedeutet

Die alte Version in `prototyp/game.js` verwendete Winz-Bitmaps (`18×10` bis `26×34` Pixel) auf `390×844` und blies sie 2–3× auf. Das wirkte auf modernen Retina-/4K-Displays „mikrig“ und karg.  
**Ultra-4K-Retro** folgt stattdessen dem **16/32-Bit-Hi-Bit-Standard** (vergleichbar mit *Metal Slug*, *Owlboy*, *Blasphemous* oder *Shovel Knight* auf Hochformat-Arcade-Niveau, **ohne** fremde Figuren oder Marken zu kopieren):
- **Große, detailreiche Sprites (56–104 Art-Pixel)** statt 16-px-Klötzchen: Holzmaserung, genietete Eisenbänder, Chitin-Panzer, Stirnband-Platte, Lichtreflexe.
- **Native Gerätepixel-Schärfe bis DPR 4**: Jedes Art-Pixel wird ohne Weichzeichner exakt ganzzahlig auf Gerätepixel abgebildet.
- **Atmosphäre ohne Matsch**: Mehrstufiges Pixel-Lighting, 3 Parallax-Ebenen und gestufte Dither-Halos statt billigem `shadowBlur` oder schwarzen Leerräumen.

---

## 0) Render-Prinzip & Technische Umsetzung (HTML5 Canvas)

### 0.1 Logisches Grid vs. Art-Pixel (AP) vs. Gerätepixel (DP)
- **Referenz-Viewport:** Logische Breite `logicalW = 390` CSS-px (dynamisch `360–430` CSS-px auf Smartphones; auf Desktop Schachtbreite auf max. `480` CSS-px begrenzt, 100 % Vollbild-Hochformat auf Mobile).
- **Art-Pixel-Raster (`1 AP = 1 CSS-px` bei 390 px Breite):**  
  Im Gegensatz zu groben `180×320`-Rastern entspricht `1 Art-Pixel (AP)` exakt `1 logischem Referenz-Pixel`.  
  Bei `dpr = Math.min(Math.round(window.devicePixelRatio || 1), 4)` (auf iPhone i. d. R. `3`, auf 4K-Displays bis `4`) wird jedes Art-Pixel auf exakt **`dpr × dpr` echte Gerätepixel** abgebildet:
  - DPR 1 → `1×1` DP (390×844 px)
  - DPR 2 → `2×2` DP (780×1688 px, z. B. 360×640 → 720×1280)
  - DPR 3 → `3×3` DP (1170×2532 px, iPhone-Standard)
  - DPR 4 → `4×4` DP (1560×3376 px, Ultra-4K-Schärfe)
- **Warum `1 AP = 1 CSS-px` mit 2-AP-Silhouettenkontur?**  
  Auf einem 6,1"-Display ist 1 CSS-px als feine Pixelstufe für Innen-Details (Nieten, Augen, Maserung) perfekt geeignet; äußere Silhouetten erhalten eine **1–2 AP starke dunkle Kontur (`#120A1E`)**, damit sie aus der Armlänge Distanz sofort knackscharf ablesbar bleiben. Auf DPR 3/4 entstehen dadurch `240×288` bis `320×384` echte Gerätepixel für Kiro+Fass – messerscharfe Kanten ohne jede Treppchen-Unschärfe.

### 0.2 Ganzzahlige Skalierung & Pixel-Disziplin
- **Canvas-Backing-Store:**  
  ```js
  const dprInt = Math.max(1, Math.min(4, Math.round(window.devicePixelRatio || 1)));
  canvas.width = Math.round(viewportW * dprInt);
  canvas.height = Math.round(viewportH * dprInt);
  ```
- **CSS & Context:**  
  - CSS: `image-rendering: pixelated; image-rendering: crisp-edges;`
  - Vor jedem Frame / Blit: `ctx.imageSmoothingEnabled = false;` (niemals temporär auf `true` stellen für Welt-Sprites!).
  - **Integer-Snapping beim Zeichnen:** Alle Sprite-Koordinaten auf `Math.round(x * dprInt)` bzw. Art-Pixel-Raster einrasten (`sx(x) = Math.round(x * scale * dprInt)`), damit Pixel beim Scrollen oder Pendeln nicht „schwimmen“ (kein Subpixel-Shimmering).
  - **Rotation (nur Barrel Swing / Tod / Klinge):** Sprites im Offscreen-Canvas werden **vorab auf `dprInt`-Größe** hochskaliert gecacht (`preScaleNearest(spriteCanvas, dprInt)`). Dadurch bleiben auch leicht rotierte Sprites (`wallTilt ±3°`, `Barrel Swing`) sauber ohne matschiges Hochskalieren aus Mini-Bitmaps.

### 0.3 Pre-Rendering & 60-fps-Performance-Budget (bis DPR 4)
1. **Offscreen-Sprite-Atlas beim Boot (`buildArt(dprInt)`):** Alle Figuren, Gegner-Frames, Münzphasen, Wände und Arcade-Buttons werden einmalig bei Start (und nur bei DPR-Wechsel neu) in Offscreen-Canvases gerendert. Keine Pro-Frame-Pixel-Loops!
2. **Kein `ctx.shadowBlur` und keine Pro-Frame-Gradienten:** Glows (Laternen, Portal-Schein, Münz-Aura) werden als vorgerenderte Pixel-Halo-Sprites mit abgestufter Alpha-/Dither-Struktur gecacht und nur via `drawImage` geblittet.
3. **Budget-Leitplanken (iPhone @ 60 fps):**
   - Max. **280 aktive Pixel-Partikel** (Pool in `Float32Array`, wie `vfx.js`).
   - Max. **60–90 `drawImage`-Calls** pro Frame (Wände gekachelt aus 128-px-Blöcken, nicht Stein für Stein).
   - **Auto-Adaptiv-Fallback:** Falls `p90` der Frame-Zeit > 22 ms steigt, werden dekorative Staubpartikel um 40 % reduziert; die scharfe Sprite-Darstellung bleibt immer 100 % erhalten.

### 0.4 Ziel-Bildschirmanteil & iPhone-Lesbarkeit
- Auf `390` AP Schachtbreite (Seitenwände je `34` AP, Schachtlichte `322` AP):
  - **Kiro + Fass:** ~`20,5 %` der Bildschirmbreite (`80×96` AP), sodass der Spieler seinen Charakter, Duck-Pose und Schwertreichweite im Gefecht sofort erfasst.
  - **Gegner:** `14–20 %` der Bildschirmbreite (`56–76` AP), klar größer als die Spielermünzen (`32×32` AP = ~`8,2 %`), damit Gefährlichkeit über Größe + Silhouette sofort erkennbar ist.
  - **Mindest-Kontrast:** Alle interaktiven Objekte tragen die `#120A1E`-Außenkontur und mindestens 35 % Helligkeitsabstand zur gedimmten Rückwand (`0.5×` Parallax).

---

## 1) Sprite-Spezifikation, Animationen & Pixelart-Regeln

### 1.1 Übersicht: Größen, Bildschirmanteil & Detailgrad

| Asset | Art-Pixel (B × H) | Anteil (390 px) | Echte Px @ DPR 3 / 4 | Detailgrad & Merkmale |
|---|---|---|---|---|
| **Kiro im Fass** | `80 × 96 AP` (Fasskörper `54 × 50 AP`, Kopf darüber) | `20,5 %` | `240×288` / `320×384` | Großer Chibi-Kopf (~42 % Gesamthöhe), Kapuze mit Stirnband + vernieteter Metallplatte, entschlossener Augenschlitz, 2-streifiger roter Verlet-Schal, Katana-Scheide über Schulter, 6-Dauben-Eichenfass mit 3 genieteten Eisenbändern, Holzmaserung & Griffhänden am Rand |
| **Kiro ohne Fass** | `52 × 72 AP` | `13,3 %` | `156×216` / `208×288` | Ganzkörper-Ninja frei am Seil hängend: Beine angewinkelt in Bewegung, Shinobi-Wickelgamaschen, längerer flatternder Schal (`34 AP`), klar schmalere Hitbox sichtbar |
| **Schwerthieb (90°-Bogen)** | `76 × 78 AP` (Radius `72 AP` ab Fassmitte, Start knapp über Kopf) | `19,5 %` | `228×234` / `304×312` | Sichtbare gekrümmte Katana-Klinge (`34 AP` lang) mit Tsuba + 4-stufige Pixel-Sichelspur (`#4FF0FF` → `#FFFFFF`) und Pixel-Funken am Bogenrand |
| **Wandkrabbler** | `76 × 52 AP` | `19,5 %` | `228×156` / `304×208` | Segmentierter Chitin-Panzer (5 Segmente), 4 bewegliche Krallenbeine zur Mauer, aufstellbare violette Rückenstacheln, aufklappende Mandibeln, glühendes Orange-Auge |
| **Klingen-Fledermaus** | `68 × 56 AP` (Spannweite) | `17,4 %` | `204×168` / `272×224` | Violetter Nachtkörper, spitze Ohren, glühende Bernstein-Augen, metallische Sichelflügel mit sichtbaren Klingen-Segmenten und Sturzflug-Glanz |
| **Seilschneider-Kobold** | `56 × 68 AP` | `14,4 %` | `168×204` / `224×272` | Grünhäutiger Kletter-Kobold mit brauner Lederweste, spitzen Ohren, Kletterfüßen am Seil und übergroßen metallischen Scherenklauen (klemmen sichtbar am Seil!) |
| **Münze (Gold)** | `32 × 32 AP` | `8,2 %` | `96×96` / `128×128` | Geprägter Rand, Kagewell-Kanji/Loch-Prägung in der Mitte, 4 Drehphasen + wanderndes `#FFF8C4`-Glanzpixel |
| **Stachelfelsen (Falle)** | `52–64 × 44 AP` | `13–16 %` | `156×132` / `208×176` | Zerklüfteter Felsvorsprung mit Moosansatz und 3 gestaffelten Eisen-Dornen aus der Seitenwand |
| **Dornenranke / Beißpflanze** | Knolle `36 × 40 AP`, Ausfahr-Glied `20 × 22 AP`, Spitze `26 × 22 AP` | `9–22 %` | `108×120`+ | Aufquellende rote Blüte in Steinritze als organischer Telegraph, stachelige Rankenglieder, silberne Zahnspitze |
| **Strom-Emitter (Tiefe)** | `28 × 40 AP` + Blitz `12 AP` hoch | `7,2 %` | `84×120` | Vernietete Metallspule an der Wand mit geladenem Cyan-Kern und gezackten Pixel-Blitzen |

### 1.2 Animations-Frames pro Aktion (verbindliche Frame-Tabellen)

- **Kiro im Fass / ohne Fass:**
  - *Idle / Sinken:* 2 Frames Atmen/Blinzeln (alle 2,6 s 140 ms Blink) + kontinuierlicher 10-Segment-Verlet-Schal (`ninja-anim.js`).
  - *Schwerthieb (90°-Bogen von knapp über Kopf bis waagerecht, links/rechts):*
    - **Windup (2 Frames, gesamt 40 ms):** Kiro reißt Katana über den Kopf nach hinten, leichte Vorneigung.
    - **Active Sweep (3 Frames, gesamt 100 ms):** Klinge fegt in `-90° → 0°` (rechts) bzw. `-90° → -180°` (links) + 3 pixelige Geister-Bögen.
    - **Recover (2 Frames, gesamt 40 ms):** Auspendeln + Fass-Rückstoß (`±3°`).
  - *Wand-Ducken (Barrel Swing Ready):* 3 Frames Ease-Out (`120 ms`) — Kiro taucht ins Fass ab (Fassrand verdeckt Untergesicht, Augen + Stirnband bleiben sichtbar, Schalspitze flattert über Rand), Fass neigt sich `3°` zur Wand, `2–4` Mörtelkrümel lösen sich.
  - *Barrel Swing (Flug zur Gegenmauer):* 1 Windup-Frame (`70 ms`, Fass staucht auf `0,92×`), danach `8` Winkel-Frames (`45°`-Schritte) während des leichten Aufwärts-Bogens (`60 AP` Scheitelhöhe) mit **3 halbtransparenten Geister-Fässern** (`alpha 0.28 / 0.18 / 0.10`).
  - *Treffer (Fass bricht / Ohnmacht):* 1 Frame reiner Weiß-/Cyan-Hit-Flash (`#FFFFFF`), `1200 ms` Blink-Unverwundbarkeit im 70-ms-Takt, plus 12 rotierende Holz- & Eisenring-Splitter.
  - *Ersatzfass anlegen:* 4 Frames (`400 ms`) — neues Fass klappt von unten über Kiro auf (`scaleY 0.2 → 1.0`) mit kleinem Funkenring.

- **Wandkrabbler (reiner Körper-Telegraph, ≥ 450 ms Windup):**
  - *Idle / Krabbeln:* 2 Frames (`260 ms` Wechsel, Beine greifen abwechselnd).
  - *Windup (`520 ms`):* 3 Frames — Körper zieht sich `-6 AP` in Wandspalt zurück, Rückenstacheln stellen sich `+4 AP` auf, Mandibeln klappen auf, Auge pulst `#FF5A2A → #FFF8C0`.
  - *Lunge / Attack (`220 ms`):* 2 Frames — gestreckter Ausfallstoß in den Schacht.
  - *Hit / Death:* 1 Frame Weiß-Flash (`90 ms`), danach Zerfall in drehenden Körper + abfliegende Chitin-Splitter (`650 ms`).

- **Klingen-Fledermaus:**
  - *Flug / Kreisend:* 4 Frames Flügelschlag (`oben → mitte → unten → mitte`, `110 ms/Frame`).
  - *Aim / Windup (`500 ms`):* Flügel klappen sichelförmig nach hinten, ein weißes Klingen-Glint-Pixel läuft über die Flügelschneide (kein hässlicher Warn-Pfeil).
  - *Sturzflug (`Dive`):* 2 Frames angelegte Flügel + 2 Pixel-Speedlines.
  - *Hit / Death:* 1 Frame Flash + taumelnder Absturz mit 4 abfallenden Feder-/Metallpartikeln.

- **Seilschneider-Kobold:**
  - *Klettern am Seil (von oben ab ~60 m):* 4 Frames abwechselndes Greifen mit Hand und Kletterfuß.
  - *Schneiden (`Cutting`):* 3 Frames — Scherenklauen schnappen im 240-ms-Takt zusammen, gelbe → rote Pixel-Funken am Seil.
  - *Hit / Death:* 1 Frame Flash + Sturz in die Tiefe.

- **Münzen & Fallen:**
  - *Münze:* 4 Frames Dreh-Zyklus (Breit → 66 % → schmale Kante → 66 %, `130 ms/Frame`) + periodischer 2-Frame-Diagonalschimmer.
  - *Stachelfelsen:* Statisch verankert (oder bei Ausfahr-Felsen 3 Frames mit kurzem `300 ms` Metall-Glint vor Ausfahren).
  - *Dornenranke:* 3 Frames Knollen-Zittern (`500 ms`) → 3 Frames Ausfahren → Rückzug.

### 1.3 Outlines, Schattierung & Dithering-Regeln
- **Outlines (Selective Outlines):**
  - Außenkontur aller Gameplay-Objekte immer **`#120A1E`** (`1 AP` für feine Fortsätze/Schal, `2 AP` bzw. doppelte Eckverstärkung bei großen Hauptmassen wie Fass, Kiro-Kopf, Krabbler-Körper).
  - Innenkanten zwischen Materialien (z. B. Fassdauben-Fugen, Klingenansatz) nutzen den **dunkelsten Ton der Material-Rampe** statt `#120A1E`, damit nichts „gitterhaft“ zerfällt.
- **Schattierung (Material-Rampen mit Hue-Shifting):**
  - Lichtquelle kommt global von **oben links (ca. 35°)** (Mondlicht von oben + kühles Rim-Light).
  - Jedes Hauptmaterial hat **4 bis 5 Farbtöne** mit gezieltem Hue-Shift: Schatten driften ins Kühle/Violette (`#120A1E` / `#10152B` / `#3A1E10`), Highlights ins Warme/Helle (`#FFE3C4` / `#E0A868` / `#EEF4FF`).
  - Keine flachen einfarbigen Flächen > `6×6 AP`: Holz zeigt Dauben & Maserung, Metall zeigt gerichteten Kanten-Glanz, Stein zeigt gekerbte Fugen.
- **Dithering-Regeln:**
  - **ERLAUBT (sparsam!):** Geordnetes **2×2-Bayer-Schachbrett-Dithering** ausschließlich für:
    1. große Übergänge im Brunnen-Hintergrund (Tiefennebel zwischen Lichtzone und Abgrund),
    2. sanfte Übergänge in Lichtkegeln / Mondlicht-Rändern und
    3. den Halo des Spiralportals auf dem Titelscreen.
  - **VERBOTEN:** Kein Dithering auf sich schnell bewegenden Figuren, Gegnern, Münzen oder UI-Buttons (erzeugt bei Bewegung Flimmern / „Pixel-Rauschen“ auf Handys!). Dort ausschließlich harte **Cel-Pixel-Cluster** aus 4–5 Rampentönen.

---

## 2) Brunnen-Beleuchtung & Parallax-Architektur

### 2.1 Drei Parallax-Ebenen (klare Tiefentrennung)
1. **Ebene 0 — Tiefe Rückwand (`0.5×` Scroll-Tempo):**
   - Kachel-Set `128 × 128 AP` aus großen, gedimmten Steinquadern, eingelassenen Rundbögen, feinen Nischen und eingemeißelten alten Brunnen-Runen/Inschriften (alle `~256 AP` ein spezielles Relief-Segment).
   - Palette bewusst dunkel & kontrastarm (max. 25 % Kontrast), damit Gegner niemals mit dem Hintergrund verschmelzen.
2. **Ebene 1 — Architektonische Mittelebene (`0.75×` Scroll-Tempo):**
   - Vor der Rückwand, aber **hinter** Seil und Kiro (`alpha 0.70–0.85`): hängende rostige Eisenketten, dicke geschwungene Baumwurzeln (in den oberen 150 m), alte Kupfer-/Holzrohre mit Schellen, herabhängende feuchte Ranken und Tropfwasser-Fäden.
   - Vertikale Anordnung abwechselnd links/rechts in Streifen (`band = 96 AP`), mit deterministischem Seed, damit das Bild reich wirkt, aber der mittlere Seilkorridor sauber lesbar bleibt.
3. **Ebene 2 — Vordere Seitenwände (`1.0×` Scroll-Tempo, je `34 AP` breit):**
   - Besteht aus **4 unterschiedlichen `34 × 96 AP`-Wandsegment-Varianten** (gemischt ohne sichtbare Wiederholungs-Naht):
     - *Variante A:* Große behauene Quader mit Moos-Polstern.
     - *Variante B:* Gebrochene Steine mit schrägen Rissen und Mörtelfugen.
     - *Variante C:* Feuchte Quader mit herablaufenden Wasserstreifen + Algen-Kante.
     - *Variante D:* Eingelassene alte Eisenklammern / Steininschriften.
   - **Innenkante zum Schacht:** Klare `2 AP` Highlight-Kante (`#3D5875` / `#6485A6`) + `1 AP` `#120A1E` Abschluss, sodass der Spieler jederzeit exakt sieht, wo die Mauer-Hitbox beginnt (wichtig für Barrel Swing!).

### 2.2 Tiefen-Biome & Dunklerwerden nach unten
- **Mondlicht-Zone (0–40 m):** Kräftiger kühler Mondlicht-Kegel von der Brunnenöffnung oben (`#9FD8FF`), beleuchtet Staubflocken und Seil.
- **Tiefenzonen alle 100 m** (harter, stilvoller Übergang mit einem horizontalen **`10 AP` dicken Steinbalken-Fries** über die Schachtbreite):
  1. `0–100 m`: **Mondlicht-Brunnen** (kühles Nachtblau/Indigo).
  2. `100–200 m`: **Moosgrund** (dunkles Petrol-Grün, vermehrte Wurzeln & Tropfwasser).
  3. `200–300 m`: **Glutschacht** (tiefes Dunkelrot-Violett, warme Glut-Partikel statt Staub).
  4. `300+ m`: **Kristall-Kluft** (tiefes Ultramarin-Violett mit dezenten schimmernden Kristall-Adern in der Rückwand; danach zyklisch).
- **Abdunklung nach unten:** Mit zunehmender Tiefe nimmt die Helligkeit des Mondlicht-Kegels oben ab (ab ~80 m nur noch schwacher oberer Schimmer); gleichzeitig rücken **flackernde Wandlaternen** (alle ~180 AP abwechselnd links/rechts) als warme Kontrast-Inseln ins Zentrum.

### 2.3 Lichtquellen & Pixelart-Effekte (strikt OHNE weichen Blur!)
- **Verbot:** Kein `ctx.shadowBlur`, keine großen weichgezeichneten CSS-/Canvas-Verläufe auf Figuren.
- **Mondlicht-Kegel & Wandlaternen-Schein:**
  - Gebaut als **vorgerenderte Pixel-Stufen-Ringe** (4 konzentrische Stufen mit `8 %`, `16 %`, `28 %` Alpha und Bayer-2×2-Dither-Übergang an den Rändern).
  - Laternen flackern alle `120 ms` leicht zwischen 3 Pixel-Stufen (`#FFB347` / `#FFE2A8` / `#FFFFFF`), wodurch sofort echtes 16-Bit-Arcade-Feeling entsteht.
  - *Lesbarkeitsregel:* Gegner spawnen mit mindestens `48 AP` Abstand zu hellen Laternen.
- **Pixelart-VFX (aus `vfx.js` adaptiert auf gestochen scharfe Pixel-Partikel):**
  - **Schwert-Funken & Treffer:** `10–14` quadratische `2×2` und `3×3 AP` Pixel-Partikel in `#4FF0FF` / `#FFFFFF` + 1-Frame-Weiß-Flash auf dem Gegner + `40 ms` Hit-Stop + `4 AP` horizontal/vertikal gerasteter Screenshake.
  - **Fass-Bruch:** `10` gedrehte Holzsplitter-Pixelgruppen (`4×6 AP`), `2` gebogene Eisenring-Stücke, `6` graublaue `3×3 AP` Pixel-Staubwolken (schrumpfen in 4 Stufen statt Alpha-Fade!).
  - **Wand-Staub beim Ducken & Münz-Einsammeln:** `3–5` herabrieselnde Mörtelpixel beim Ducken; bei Münzen `4` kreuzförmige 4-Point-Pixel-Sparkles (`+` → `×` → `·`).
  - **Umgebungs-Atmosphäre:** `28` langsam schwebende `1×1` und `2×2 AP` Staub-/Glühflocken auf 3 Parallax-Geschwindigkeiten.

---

## 3) Steuerung im Stil von 90er-Arcade-Automaten

**Design-Grundsatz:** Eigenständige 90er-Spielhallen-Cabinet-Hardware-Optik (abgeschrägte Metall-Lünetten, genietete Ringe, glänzende Arcade-Knöpfe). **Keinerlei** Anleihen an Sonic, Sega oder andere fremde Figuren/Marken — nur das charakteristische haptische Gefühl jener Ära (großer Kugel-Joystick rechts, knackiger Action-Button links).

### 3.1 Maße in pt (= CSS-px auf iOS), Platzierung & Safe Area
Referenz iPhone (`390×844 pt`, `safe-area-inset-bottom` ~`21–34 pt`):
- **Unterer Randabstand:** Mindestens `18 pt + env(safe-area-inset-bottom)` bis Unterkante der Grafik.
- **Seitenabstand:** Mindestens `18 pt + env(safe-area-inset-left/right)`.
- **Unten rechts — Virtueller Arcade-Joystick:**
  - **Touch-Zone (unsichtbare Fangfläche):** Rechte untere Bildschirmhälfte (`x ≥ 50 %`, `y ≥ 45 %`) mit `setPointerCapture` (Daumen darf nach Aktivierung auch über die Mitte ziehen).
  - **Sichtbare Grafik im Ruhezustand (immer sichtbar, damit sofort intuitiv!):**
    - Äußere Sockel-Platte / Gate-Ring: **`96 pt` Durchmesser** (oktagonal-rund abgeschrägtes Arcade-Metall `#1E2433` / `#3B445C` / `#63708F` mit 4 dezenten Richtungskerben ↑↓←→ und `2 AP` Kontur `#120A1E`, `72 %` Deckkraft im Ruhezustand, `95 %` bei Touch).
    - Metall-Schaft: `10 pt` breit, verbindet Sockelmitte dynamisch mit dem Kugelgriff.
    - **Kugelgriff (Ball-Top):** **`44 pt` Durchmesser**, klassisches Arcade-Signalrot (`#8C1120` → `#E2283C` → `#FF7A85`) mit scharfem weißem `4×4 AP`-Glanzpunkt oben links.
  - **Zustand gedrückt / gezogen:** Basis „floatet“ bei Touch direkt unter den Start-Finger (innerhalb der Touch-Zone), Kugelgriff wandert bis max. `54 pt` Radius mit Schatten-Versatz. Aktiver Sektor (↑/↓/←/→) leuchtet an der Sockel-Kerbe in Cyan `#4FF0FF` auf. Totzone `10–12 pt`, 4-Wege-Achsen-Lock mit `15°` Hysterese.

- **Unten links — Primärer Action-Button (Schwert / Barrel Swing):**
  - **Sichtbare Button-Grafik:** **`72 pt` Durchmesser** (Mindestmaß `68–72 pt`).
  - **Unsichtbare Hit-Area:** **`88 pt` Durchmesser** (zentriert über Grafik).
  - **Aufbau (Cabinet-Pushbutton):** Abgeschrägter Außenring (`6 pt` breit, dunkler Stahl `#2A2E38` / `#7B8494`), leicht gewölbte Innenfläche mit oberem Pixel-Glanzbogen (`2 AP`) und klarem Icon (`36×36 AP`).
  - **Zustands-Wahrheit (zwingend synchron mit Gameplay!):**
    1. **Standard / im freien Raum / während `swingCd > 0`:** Dunkel-Indigo-Button (`#19223B`), heller Stahlrand (`#D8E4EE`), **Katana-Icon** (`#EEF4FF` Klinge + `#4FF0FF` Schimmer + Gold-Tsuba).
    2. **An Mauer (`≤ 12 pt`) & Fass intakt & `swingCd === 0`:** Button wechselt sofort auf warmes Holz-Braun (`#5A3518`) mit leuchtendem **Goldrand (`#FFD84A`)** und **Fass-Icon**.
    3. **Während `swingCd` (`1500 ms`):** Äußerer pixel-gerasterter **Cyan-Füllring (`#4FF0FF`)** um den Button läuft im Uhrzeigersinn hoch, während das Innere bereits wieder das **Katana-Icon** zeigt (so weiß der Spieler: Schwerthieb ist sofort möglich!).
    4. **Gedrückt-Zustand:** Innenfläche sinkt optisch **`3 pt` nach unten**, obere Glanzkante wird zum Innenschatten, kurzer Weiß-Puls (`50 ms`).

- **Unten links (rechts neben Action-Button) — Sekundärer Fass-Button (Ersatzfass):**
  - **Sichtbarkeit:** Erscheint **nur**, wenn Kiros Fass zerbrochen ist **und** mindestens `1` Ersatzfass vorhanden ist (`btnAnim` Pop-In in `140 ms`, leichtes Bounce).
  - **Größe:** **`58 pt` Durchmesser** (Hit-Area `70 pt`), **`26 pt` Abstand** rechts neben dem Action-Button.
  - **Look:** Kleinerer achteckiger/runder Arcade-Knopf in Holz/Gold (`#3A1E10` / `#FFD84A`) mit klarem Fass-Icon + kleiner Ziffer (`×1`, `×2`, `×3`) am unteren Rand.

### 3.2 Oberes HUD (kompakt, 0 Debug-Müll)
- Alles in einer sauberen Kopfzeile innerhalb `top: env(safe-area-inset-top) + 10 pt`:
  - **Mitte:** Große gerahmte Plakette mit **`148 m`** (`20 pt`, `#F4F1EA` mit `#120A1E` 2-px-Schatten) + kleinem `TIEFE`-Label (`9 pt`, `#9BB0D4`).
  - **Oben links:** Sichtbare **Fass-Anzeige** (kleines Fass-Icon `22×24 AP` + `×1/2/3`, bei kaputtem Fass rotes gestricheltes Fass-Symbol) und darunter **Münzzähler** (Münz-Icon + `0127` in `#FFD84A`). Punkte/Kombo klein darunter (`#9BB0D4`).
  - **Oben rechts:** Saubere Arcade-Icon-Buttons (`38×38 pt`, Hit-Area `48×48 pt`): **Ton (Mute/Unmute)** und **Pause** (`||`). Debug-Schalter (`Sag A/B`, `Hitbox`) verschwinden komplett in das Pause-Menü!

---

## 4) Titelbildschirm & Ohnmachtsszene auf der Wiese (Story-getreu)

### 4.1 Vorlage aus dem Story-Tab (verbindliche Figuren & Welt)
- **Welt:** Kiro lebt verborgen in den **Bergen Japans** in einem **alten, verfallenen traditionellen japanischen Haus**, hinter dem ein alter **Steinbrunnen** auf einer **grünen Wiese** steht. Das Dorf ist verfallen und verlassen.
- **Portal:** Im Brunnen erscheint eine **„Spirale aus Licht, Farben und Pixel“** — ein geheimnisvolles Portal in eine tiefe Welt.
- **Kiro:** Junger Ninja (dunkelblauer Anzug `#2A3B73`, roter Schal `#E2283C`, Stirnband mit Metallplatte, dunkle wuschelige Haare, Katana).
- **Tara:** Kiros **Ninja-Schwester** — eigenständige, sofort erkennbare Silhouette: hochgebundener dunkler Pferdeschwanz, Kunoichi-Gewand in tiefem Pflaumen-Violett (`#59307A`) mit Jade-Schärpe (`#359E84`) und goldener Borte (`#F0B43A`), besorgter Blick.
- **Ohnmachtsszene (Run-Ende):** Kiro wacht neben dem Brunnen auf der Wiese auf / setzt sich auf, **Tara beugt sich besorgt über ihn**, und **direkt neben Kiro liegt der glänzende Haufen aller gesammelten Münzen**.

### 4.2 Komposition & Szenenaufbau (Titelscreen & Run-Ende)
Beide Screens teilen sich dieselbe liebevoll gepixelte 9:16-Diorama-Welt auf der Bergwiese (Wiedererkennung & Asset-Sharing!):

1. **Titelbildschirm (Einstieg):**
   - **Oberes Drittel (Himmel & Logo):** Dämmerungs-/Nachthimmel über japanischen Bergen (`#0B1026 → #3F3B6E`), links im Mittelgrund das leicht verfallene japanische Holzhaus mit moosigem Schindeldach und warm schimmerndem Papierfenster. Mittig oben schwebt das **Logo `KAGEWELL`** (bevorzugt vor dem kleinen Untertitel `BARREL NINJA` in Gold): gemeißelte Stein-/Metall-Pixelbuchstaben mit Goldfassung und dezentem Cyan-Schimmer am unteren Rand (`40–48 pt` Höhe, `1–2 px` dunkle Kontur).
   - **Mittleres Drittel (Brunnen, Spiralportal & Wiesenszene):**
     - Im Zentrum der grüne Hang mit Wildblumen und dem alten bemoosten **Steinbrunnen samt hölzerner Seilwinde**.
     - Aus dem Brunnenmund steigt das **Spiralportal** auf: mehrarmige Pixel-Spirale in Cyan (`#4FF0FF`), Violett (`#8B42F5`) und Gold (`#FFD84A`) mit weißem Zentrum, umgeben von fliegenden Pixel-Funken.
     - **Rechts neben dem Brunnen auf der Wiese:** Die charakteristische Erzähl-Szene als lebendiger Start-Anker — Kiro liegt/stützt sich auf dem Gras neben seinem geschwärzten/ramponierten Seilfass, **Tara kniet und beugt sich besorgt zu ihm hinunter**, und neben Kiro schimmert ein **Haufen goldener Münzen** (skaliert dezent nach gespeicherten Gesamtmünzen!).
   - **Unteres Drittel (Menü & HUD):**
     - Haupt-Button **`SPIELEN`** (großer Arcade-Rahmen, mind. `220×58 pt`, Cyan-Glow-Kontur `#4FF0FF`, deutliches Gedrückt-Feedback).
     - Darunter 2 kompakte Arcade-Plaketten nebeneinander: **Gesamtmünzen** (`G × 1247`) und **Beste Tiefe** (`87 m`).
     - Ganz unten ein ruhiger, knapper **3-Icon-Steuerungshinweis** (Stick = Bewegen | Schwert = Schlag | Wand = Barrel Swing — max. 1 Zeile, kein Textwall!).
     - Rechts oben: kleiner Sound-Toggle + optional `[?]`-Story-Kurzeinblendung (max. 2 Sätze).

2. **Ohnmachtsszene (Run-Ende / nach Treffer ohne Fass oder Seilschnitt):**
   - Kamerafahrt / harter Retro-Iris-Wipe auf dieselbe **Wiese neben dem Brunnen** (leicht herangezoomt auf Kiro, Tara und den Münzhaufen):
     - **Sekunde 0–0.6:** Kiro liegt benommen im Gras, kleine Pixel-Sterne/Schwindel-Ringe kreisen über ihm, Tara kniet dicht neben ihm und beugt sich mit besorgter Handbewegung über ihn.
     - **Sekunde 0.6–1.2:** Kiro setzt sich mit einem Blinzeln auf (wie im Doc: *„Er wacht auf und setzt sich auf“*), und die gesammelten Lauf-Münzen **regnen/plumpsen als klimpernder Pixel-Goldhaufen** direkt neben ihn ins Gras!
   - **Kompaktes Ergebnis-Panel im unteren Bereich:**
     - Überschrift: `AUFGEWACHT!` (kein „Tod/Game Over“-Blut)
     - 3 klare Werte: **Tiefe** (`148 m`), **Run-Münzen** (`+127`), **Gesamt-Münzen** (`1.374`) + **NEUER REKORD**-Badge bei Bestwert.
     - Buttons: **`NOCHMAL`** (primär, startet sofort neuen Abstieg ins Portal) und **`TITEL`** (sekundär).

### 4.3 Animationen auf Titelscreen & Wiese (60 fps, leichtgewichtig)
- **Spiralportal:** 2 rotierende Pixel-Arm-Layer (`+0.8 rad/s` und `-0.45 rad/s`) + 16 spiralförmig eingesogene/aufsteigende `2×2 AP`-Pixel-Funken; Beleuchtung auf dem Brunnenrand pulst leicht im 150-ms-Takt.
- **Wiese & Haus:** 2-Frame-Graswiegen alle `450 ms`, sanft ziehende Bergnebel-Pixelstreifen (`0.15×`), flackerndes warmes Fenster im alten Haus.
- **Glühwürmchen:** `14` langsam treibende `#FFE2A8`-Pixel (`2×2 AP` + `4×4 AP` Dither-Halo) über der Wiese.
- **Kiro & Tara:** Subtile 2-Frame-Atembewegung (`800 ms`), Kiros Schal weht sacht im Abendwind, Taras Pferdeschwanz wippt leicht, Münzhaufen schimmert alle `700 ms` an 2–3 Stellen.

### 4.4 Schriftart-Empfehlung (Google Fonts)
- **Primär-Font (Arcade-Titel, Zahlen, Buttons, HUD): `'Press Start 2P'`**  
  - *Bereits im Repo unter `fonts/press-start-2p.woff` vorhanden (OFL-Lizenz, Offline-PWA-tauglich!).*
  - *Begründung:* Authentische 8/16-Bit-Arcade-Proportionen, extrem charakterstark für `KAGEWELL`, `SPIELEN`, `148 m` und Münzzahlen. **Wichtige Pflichtregel:** Niemals kleiner als `11–12 pt` (UI-Labels) bzw. `16–20 pt` (Tiefe/Buttons) einsetzen — das alte `8px`-Gestöpsel wird komplett abgeschafft!
- **Sekundär-Font (für kurze Story-/Steuerungszeilen ≥ 12–14 pt): `'Silkscreen'` (Google Fonts, lokal als `.woff2` nach `fonts/` legen) oder `'Rubik'` (bereits vorhanden als `rubik-latin.woff2`):**
  - *Empfehlung:* **`Silkscreen`** (400/700) als knackscharfe, schmalere Pixel-Leseschrift für 1-zeilige Hinweise (`„Wische rechts · Hieb links“`, kurze Story-Zeile), weil sie auf `390 pt` Breite deutlich besser lesbar ist als `Press Start 2P` in Fließsätzen und den Pixel-Look im Gegensatz zu `Rubik` nicht bricht. Falls keine neue Font-Datei gewünscht ist, bleibt `Press Start 2P` (≥ `11 pt`) für alles Kurze + `Rubik` nur im Pause-/Hilfetext.

---

## 5) Vollständige Farbpalette (Hex-Rampen pro Material)

Alle Farben folgen einem konsistenten **4- bis 5-stufigen Rampen-System** (`Dunkelste Kontur/Tiefe → Schatten → Mittelton → Licht → Highlight`).

### 5.1 Kontur & Universalschatten
| Rolle | Hex | Verwendung |
|---|---|---|
| Universal-Outline | `#120A1E` | Außenkontur aller Sprites, Buttons & HUD-Plaketten |
| Hit-Flash | `#FFFFFF` | 1-Frame-Trefferblitz (max. 50–90 ms) |

### 5.2 Hintergrund & Tiefen-Biome (alle 100 m)
| Biom | Abgrund | Tiefennebel | Schacht-Mittel | Schacht-Oberlicht |
|---|---|---|---|---|
| 0–100 m: Mondlicht-Brunnen | `#05070F` | `#0B1426` | `#122640` | `#1C3D61` |
| 100–200 m: Moosgrund | `#040B0C` | `#0B1E21` | `#133336` | `#1F4D4F` |
| 200–300 m: Glutschacht | `#0D060A` | `#1C0D16` | `#2F1622` | `#482330` |
| 300–400 m: Kristall-Kluft | `#070614` | `#12102B` | `#1F1D48` | `#2E2E68` |

### 5.3 Architektur & Natur im Brunnen
| Material | Tiefschatten / Fuge | Schatten | Mittelton | Licht / Kante | Highlight |
|---|---|---|---|---|---|
| **Stein (Vorderwand)** | `#0E1724` | `#182536` | `#273A50` | `#3D5875` | `#6485A6` |
| **Stein (Rückwand 0.5×)** | `#0B121D` | `#121D2D` | `#1B2B40` | `#283E59` | — |
| **Moos & Ranken** | `#142E25` | `#214A3B` | `#367554` | `#5BA66D` | `#8FD188` |
| **Holz / Fass** | `#3A1E10` | `#5A3518` | `#8A5A2E` | `#B87D44` | `#E0A868` |
| **Eisen / Stahl / Klinge** | `#2A2E38` | `#4A4F57` | `#7B8494` | `#B9C3D6` | `#EEF4FF` |
| **Seil (Hanf)** | `#6E522B` | `#9C7842` | `#C9A66B` | `#EAD19B` | — |
| **Wasser / Tropfen** | `#173D5C` | `#2B6994` | `#59A9D9` | `#B8ECFF` | — |

### 5.4 Charaktere (Kiro & Tara)
| Charakter / Teil | Tiefschatten | Schatten | Mittelton | Licht | Highlight |
|---|---|---|---|---|---|
| **Kiro: Ninja-Anzug** | `#10152B` | `#1A2347` | `#2A3B73` | `#465EA3` | `#7392D9` |
| **Kiro: Haut** | — | `#BD835B` | `#E8C9A6` | `#FFE3C4` | — |
| **Kiro: Schal & Stirnband** | `#7E1122` | `#C41E33` | `#E2283C` | `#FF6673` | — |
| **Kiro: Augen** | `#1E2540` (Iris) | — | `#F4F6FF` (Sklera) | `#FFFFFF` (Glanz) | — |
| **Tara: Kunoichi-Gewand** | `#231233` | `#3B1E54` | `#59307A` | `#7E4AA6` | — |
| **Tara: Jade-Schärpe & Gold** | `#1D6B5E` | `#359E84` | `#66CFA8` | `#F0B43A` (Borte) | `#FFF0A8` |
| **Tara: Haar (Nacht-Indigo)** | `#120F24` | `#222040` | `#3E3E6B` | `#6E74A8` | — |
| **Tara: Haut & Augen** | `#BD835B` | `#E8C9A6` | `#FFE3C4` | `#2E4A6B` (Iris) | `#FFFFFF` |

### 5.5 Gegner, Münzen & Fallen
| Element | Tiefschatten | Schatten | Mittelton | Licht | Highlight / Auge |
|---|---|---|---|---|---|
| **Wandkrabbler (Panzer)** | `#281D2B` | `#6E2416` | `#B8421C` | `#EB752D` | `#FFB45C` |
| **Wandkrabbler (Stachel & Auge)** | `#514B66` | `#8C8F99` | `#C4C8D4` | `#FF5A2A` (Auge) | `#FFF8C0` (Windup) |
| **Klingen-Fledermaus (Körper)** | `#1B132E` | `#2A1E47` | `#473570` | `#6F589E` | `#FFC23A` (Auge) |
| **Klingen-Fledermaus (Flügel)** | `#586378` | `#8D99AE` | `#B9C3D6` | `#EEF4FF` | `#FFFFFF` |
| **Seilschneider (Haut)** | `#274524` | `#4E7A3A` | `#78AD52` | `#A8D877` | `#FF4040` (Auge) |
| **Seilschneider (Weste & Schere)** | `#4B2C20` | `#734432` | `#525A66` | `#C7CED6` | `#FFFFFF` |
| **Goldmünzen** | `#8C4B00` | `#D98A16` | `#FFD84A` | `#FFF8C4` | — |
| **Stachelfelsen** | `#222938` | `#3E485E` | `#6E7682` | `#DDE3EA` (Spitze) | `#FFFFFF` |
| **Dornenranke / Beißpflanze** | `#163826` | `#2F5B4A` | `#4E8F5B` | `#D62D50` (Blüte) | `#FF7590` |
| **Strom-Emitter** | `#3B4252` | `#7B8494` | `#1FA8FF` | `#4FF0FF` | `#FFFFFF` |

### 5.6 Licht, Spiralportal, Wiese & Himmel
| Element | Ton 1 (Außen/Dunkel) | Ton 2 | Ton 3 | Ton 4 | Kern / Spitze |
|---|---|---|---|---|---|
| **Mondlicht-Kegel** | `#1C3D61` | `#4980B3` | `#9FD8FF` | `#D6F0FF` | — |
| **Wandlaterne** | `#A84A14` | `#E0801A` | `#FFB347` | `#FFE2A8` | `#FFFFFF` |
| **Schwert-Spur & Funken** | `#1CA8D9` | `#4FF0FF` | `#9AF7FF` | `#C8FCFF` | `#FFFFFF` |
| **Spiralportal** | `#4A1FB8` | `#8B42F5` | `#4FF0FF` | `#FFD84A` | `#FFFFFF` |
| **Dämmerungshimmel & Berge** | `#0B1026` | `#1B203D` | `#1D254D` | `#282C52` | `#3F3B6E` |
| **Wiese & Glühwürmchen** | `#142E22` | `#214D34` | `#357845` | `#5DA856` | `#FFE2A8` / `#FFF8C4` |
| **Verfallenes Holzhaus** | `#1E1826` | `#32293D` | `#472E1E` | `#6E4930` | `#D99B4E` (Fenster) |

### 5.7 UI, 90er-Arcade-Steuerung & Akzente
| Element | Hex-Werte |
|---|---|
| **Panel-Hintergrund & Innenlinie** | `#0D1326` (88 % Alpha), Innenlinie `#263459` |
| **Arcade-Rahmen-Gold** | `#A67624` → `#E5B84B` → `#FFF0A8` |
| **Joystick Kugelgriff (Ball-Top)** | `#8C1120` → `#E2283C` → `#FF7A85` → `#FFFFFF` |
| **Joystick Sockel & Schaft** | Sockel `#1E2433` / `#3B445C` / `#63708F`; Schaft `#7D889E` / `#D8E4EE` |
| **Action-Button (Schwert / Swing)** | Fläche `#19223B` (aktiv `#2D3D66`), Rand `#D8E4EE`; Swing-Bereit `#5A3518` mit `#FFD84A` |
| **HUD-Text** | Primär `#F4F1EA`, Sekundär `#9BB0D4` |
| **Akzente (Status/Signal)** | Klinge/Treffer/Cooldown `#4FF0FF` · Gefahr/Schaden `#E2283C` · Gold/Combo `#FFD84A` · Bereit/OK `#5CE07B` |

---

## 6) Offene Fragen zur Klärung vor Coding-Start

1. **Ohnmachtsszene vs. Titelscreen-Darstellung:** Im Titelscreen-Konzept (`kagewell-title-concept.jpg`) ist die Wiese + Spiralportal + Kiro & Tara gemeinsam komponiert. Sollen **beide** Screens (Titel & Run-Ende) visuell auf dieser gemeinsamen Szenerie aufbauen (Titel: Kiro & Tara noch stehend vor dem leuchtenden Portal bzw. bereit zum Einstieg, Run-Ende: Kiro liegend/aufsetzend mit dem frischen Münzhaufen und besorgter Tara) – oder soll das Titelbild bereits genau dieses Motiv als dramatische „Vorschau“-Szene zeigen?
2. **Schriftart `Silkscreen`:** Reichen die bereits im Repo liegenden Fonts (`press-start-2p.woff`, `rubik-latin.woff2`) aus, oder soll `Silkscreen` zusätzlich in `fonts/` aufgenommen und im `sw.js` gecacht werden?
3. **Schwert-Sprung von Wand weg vs. Barrel Swing:** Wenn `swingCd > 0` an der Mauer läuft, zeigt der Action-Button das Schwert. Soll der Schwert-Arc dabei an der Mauer automatisch *von der Mauer weg in den Schacht* schlagen (empfohlen, damit kein Schlag in die Wand geht)?
4. **DPR-Cap auf älteren Geräten:** Standard-Cap `dpr = 4` ist für High-End-4K vorgesehen; soll bei Frame-Zeiten > 22 ms optional automatisch auf `dpr = 2` heruntergeschaltet werden oder reicht die Partikel-Drosselung bei festem `dprInt`?
