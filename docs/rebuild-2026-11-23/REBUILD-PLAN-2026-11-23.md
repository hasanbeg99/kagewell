# Barrel Ninja / Kagewell — Rebuild-Plan (Stand 23.11.2026)

**Auslöser:** Sabas Feedback vom 23.11.2026:
- *"Diese version ist mit abstand die schlechteste Feedback erhalten"*
- *"Nichts hat gepasst schaue dir das doc nochmal an gründlich und erstelle keine 100 repos das spiel ist doch das selbe wie kippwelt oder nicht? Also nutz das ganze team und macht das sofort wieder gut und der retro style soll ultra 4k seind bicht so mikrig"*
- *"Gebt euch mühe, nehmt euch soviel zeit wir ihr braucht, volllast!!"*

**Ziel-Repo & Pfad-Empfehlung:**
- **Repo:** `hasanbeg99/kagewell` (KEIN neues Repo erstellen!).
- **Pfad:** Rebuild im Ordner **`prototyp/`** (`https://hasanbeg99.github.io/kagewell/prototyp/`).
- **Begründung:** Das Root-Spiel unter `/` (`index.html`, v4-Abseil mit Wischsteuerung) bleibt als funktionierender Fallback unberührt, bis Saba den neuen Prototyp im Test freigibt und ausdrücklich das Überschreiben von `/` anfordert (entspricht Sabas Regel: keine Live-Ersetzung ohne Freigabe). Bestehende Repo-Assets (`audio/`, `vfx/`, `fonts/`, `icons/`) werden direkt wiederverwendet.

---

## 1. Kippwelt-Klärung (Faktenlage aus Repos & Workspace)

| Projekt | Repo / Live-URL | Spielprinzip | Zusammenhang |
|---|---|---|---|
| **Barrel Ninja / Kagewell** | `hasanbeg99/kagewell`<br>`https://hasanbeg99.github.io/kagewell/`<br>Prototyp: `.../kagewell/prototyp/` | Ninja Kiro im Fass am Seil in endlosem Brunnen; Schwert & Barrel Swing gegen Gegner/Fallen; Münzen sammeln. | **Dasselbe Projekt** (am 17.11.2026 von `barrel-ninja` zu `kagewell` = *Kage* [Schatten] + *Well* [Brunnen] umbenannt). |
| **Kippwelt** | `hasanbeg99/kippwelt-demo`<br>`https://hasanbeg99.github.io/kippwelt-demo/` | Hypercasual-Puzzle: Halten = Kugel klebt an der Decke, Loslassen = Kugel fällt; Tippen ⟲/⟳ = Welt um 90° ins Portal drehen. | **Komplett anderes Spiel.** Nur ähnliche Namen mit „K“ (`Kagewell` vs. `Kippwelt`). |

Anzahl Repos: Auf `hasanbeg99` existieren insgesamt 15 Repos; für den Barrel-Ninja-Prototyp wurde **kein** neues Repo erstellt.

---

## 2. Gründlicher Abgleich: Google Doc „Projekt Barell Ninja“ vs. Ist-Stand (`prototyp/` & Root `/`)

Quelle: Google Doc `1-Lr1SPi7nNji07R3UkwIH41uThSin0YJeWmxBuOlbGU` (alle 5 Tabs: `Übersicht & Demo`, `Spielmechanik Allgemein`, `Story`, `Steuerung und Physik`, `Titelscreen`, plus alle 5 Kommentar-Threads). Keine eingebetteten Bilder/Zeichnungen vorhanden.

### 2.1 Warum der aktuelle Prototyp (`prototyp/`, Commit `87f2800`) durchgefallen ist

1. **„Mikriger“ Look statt „Ultra-4K 90er-Retro“:**
   - `prototyp/game.js` zeichnet in fixem `390×844`-Logikraum winzige Low-Res-Bitmaps (`BIRD_MAP` 18×10 → 36×20 px blaue Dreiecke; `CREEP_MAP` 24×16 → 48×32 px; `COIN_MAP` 8×8 → 16×16 px Punkte; `NINJA_MAP` 26×34 → 78×102 px) mit grober `scaleInt(..., 2/3)`-Blockskalierung und `imageSmoothingEnabled = false`.
   - Die gesamte Atmosphäre aus dem Root-Spiel (`/index.html`) wurde weggelassen: kein Mondlicht-Lichtkegel von oben, keine flackernden Wandlaternen, keine Parallax-Zwischenebene (Rohre, Ketten, Wurzeln), keine Tiefen-Biome, keine Staubpartikel, keine Tiefen-Nebelverläufe.
   - Die Gegner haben kaum Animation (Vögel sind ein einziger statischer 10-px-Sprite ohne Flügelschlag; Krabbler haben nur 1 statischen Frame; `vfx/enemy-anim.js` wird gar nicht geladen).
   - Die Touch-Steuerung sieht aus wie graue Entwickler-Debug-Kästchen (`pixelRect` mit 2-px-Strich als Schwert und 3 Strichen als Fass), der Joystick ist im Ruhezustand komplett unsichtbar, und oben links kleben die kryptischen Debug-Buttons `B` und `HB`.

2. **Kein richtiges Spiel, keine Story-Einbettung, kein Audio:**
   - Der Prototyp startet ohne Titelscreen direkt ins Gameplay vor zwei regungslos schwebenden Vögeln.
   - **Story-Tab wird im Ohnmachts-Screen verfehlt:** Das Doc beschreibt explizit: *„Als er wieder zu sich kommt liegt er auf der Wiese neben dem Brunnen und Tara beugt sich, sich sorgend über ihn - Er wacht auf und setzt sich auf und was entdeckt er neben sich? All die Münzen die er gesammelt hatte!“* Stattdessen zeigt `drawFaint()` nur einen schwarzen Kasten mit 3 Zeilen `8px`-Text (`"Kiro ist ohnmächtig"`).
   - **Komplett stumm:** `audio/` (24+ fertige Sounddateien + 3-stufige Loop-Musik + WebAudio-Chiptune-Sequencer im selben Repo) ist in `prototyp/` nicht angebunden.
   - **Fehlendes HUD & fehlende Gefahren:** Kein Tiefenzähler (`m`), kein Score/Kombo, **keine Anzeige für Ersatzfässer** (Spieler sieht gar nicht, dass er ein Ersatzfass hat oder wann er eines einsammelt), keine Fallen (`Dornenranken`, `Stachelfelsen`, `Stromfelder`, `Seilschneider`), obwohl Doc („Wesen die ihn angreifen, Fallen, Lichter“) und Root-Spiel das bereits definieren.

3. **Konkrete Mechanik- & Steuerungs-Mängel im Prototyp gegenüber dem Doc:**
   - **Joystick-Erscheinung & -Affordance:** Doc sagt: *„Am unteren Bildschirm Rand erscheint rechts ein Joystick (Ähnlich wie im Handy Spiel Sonic the Hedgehog)“*. Im Prototyp sieht man rechts unten gar nichts, bis man zufällig hintippt – und dann nur ein rotes Quadrat auf einem grauen Quadrat.
   - **Action-Button-Icon vs. Cooldown-Widerspruch:** Nach dem Barrel Swing landet man 4 px neben der Gegenmauer (`atWall <= 12`). Während `swingCd` (1500 ms) läuft, zeigt der Button trotzdem das **Fass-Icon**, führt beim Tippen aber einen **Schwerthieb** aus (seit PR #2). Icon und Aktion widersprechen sich!
   - **Schwert-Position & Darstellung:** Doc sagt: *„90 Grad beginnend knapp über seinem Kopf in die jeweilige Richtung“*, Dzeko ergänzt (`doco.K65rmk2ihP13zjirswmDuA`): *„Angriff weiterhin nach links oder rechts, Bogen wird durch Joystick beschrieben“*. Im Prototyp startet der Hieb ab Fassmitte (`py + BH/2`) als flacher Cyan-Keil ohne sichtbare Katana-Klinge oder Kiro-Hiebpose.
   - **Kein spürbares Portal-/Abstiegsgefühl:** `Übersicht & Demo` nennt *„v4 (freie Bewegung in alle Richtungen, Fass sinkt automatisch)“*, `Story` nennt das leuchtende Pixel-/Licht-Spiralportal am Brunneneingang. Im Prototyp passiert nichts beim Start und man spürt weder Portal noch Tiefenzonen.
   - **Absacken beim Hochsteuern (Seilphysik Regel 3):** Die offene Teamfrage (`doco.DHd8usBt_rWHFiEX_Gmw6A`, Alu-Vorschlag B vs. Doc-Variante A) wurde über einen nackten `B`-Knopf oben links gelöst, ohne sauberes A/B-Test-Menü (Pause/Optionen) und ohne dass das Seil beim Hochziehen spürbar „greift“.

---

## 3. Vollständige Anforderungen aus dem Google Doc (Verbindliche Checkliste)

### 3.1 Story & Screens (nur Brunnen-Spiel, noch KEIN Dorf-Shop/Umbau)
- **Titelscreen** (Tab `Titelscreen` + `Übersicht & Demo` + `Story`):
  - Klarer, markanter 90er-Retro-Titel (**Barrel Ninja** / Untertitel *Kagewell – Abstieg in den Brunnen*).
  - Kurze visuelle Story-Hinführung auf dem Startbildschirm (oder kurzer optional überspringbarer Einstieg): Kiro am alten Dorfbrunnen, Spiralportal aus Licht/Farben/Pixeln tief unten, Tara am Seil.
  - Klare, knappe Steuerungs-Übersicht (Joystick rechts = bewegen, Action links = Schwert / an Wand Barrel Swing, Fass-Knopf bei kaputtem Fass) — maximal 3–4 Punkte, kein Textwall.
  - Gespeicherte Gesamtmünzen & Bestwert/Tiefe sichtbar.
  - **NICHT bauen:** Dorf-Wiederaufbau, Ausrüstungs-Shop, spielbare Tara, Großvater-Quest (im Doc-Kommentar `doco.ZwdaFrszfBDLZ-kKip94Yw` explizit auf *nach* dem Brunnen-Spiel verschoben; Sabas Regel: nichts Ungefragtes bauen!).
- **Ohnmacht / Run-Ende (Story-getreu!):**
  - Erster Treffer mit intaktem Fass → Fass zerbricht effektvoll (Holzsplitter, Eisenringe, kurze Unverwundbarkeit, Kiro hängt frei am Seil und ist etwas wendiger/schneller).
  - Treffer ohne Fass (oder Seilschnitt durch Seilschneider!) → Kiro wird ohnmächtig (kein „Tod/Blut“).
  - **Szene auf der Wiese:** Illustrierte 90er-Retro-Szene: Kiro liegt/setzt sich auf der grünen Wiese neben dem alten Steinbrunnen, **Tara beugt sich besorgt über ihn**, neben Kiro liegt der **Haufen glänzender gesammelter Münzen**!
  - Anzeige: Gesammelte Münzen in diesem Lauf + Gesamtmünzen (persistent gespeichert) + erreichte Tiefe (`m`) / Punkte + klarer **„Nochmal“**-Button (und „Titel“).

### 3.2 Steuerung & Seilphysik (Tab `Steuerung und Physik` + Kommentar-Entscheidungen)
- **Steuereinheit:**
  - **Unten rechts:** Floating-Joystick im Stil *Sonic the Hedgehog Mobile* (große Touch-Zone rechts unten; im Ruhezustand dezenter, gut sichtbarer runder Ring-Anzeiger, damit sofort klar ist, wo gesteuert wird; bei Fingerkontakt floatet der Ring an den Touchpunkt und folgt dem Daumen mit 50–60 px Max-Ausschlag, 10–12 px Totzone, 4-Wege-Achsen-Lock mit 15° Hysterese).
  - **Unten links:** Großer Action-Button (mind. 68–72 CSS-px Grafik, mind. 84–88 CSS-px Hit-Area, sichere Abstände inkl. `env(safe-area-inset-*)`). Zeigt **Schwert-Icon** im freien Raum (und wenn Barrel Swing auf Cooldown ist!), wechselt an der linken/rechten Mauer (wenn Fass intakt & Swing bereit) sichtbar zum **Fass-Icon**.
  - **Neues Fass anfordern (Kommentar-Entscheid `doco.30gXSd1N7MSnSlMZRB1ZWQ`):** Eigener kleinerer **Fass-Knopf** (mind. 56–60 CSS-px, mind. 24 CSS-px Abstand rechts neben dem Action-Button), der **nur erscheint, wenn das Fass kaputt ist UND mindestens 1 Ersatzfass im Inventar ist**. Start: 1 intaktes Fass + 1 Ersatzfass (max. 3). KEIN Doppelklick auf Joystick!
  - **Multitouch & Tastatur:** Saubere Pointer-ID-Trennung (linker Daumen Action/Fass, rechter Daumen Joystick – auch beim Ziehen über die Bildschirmmitte via `setPointerCapture`). Zusätzlich Desktop-Testbarkeit (WASD/Pfeile + Leertaste = Action + E/F = Ersatzfass + P = Pause).
  - **Action-Puffer:** 100–120 ms Eingabepuffer, keine Dauerfeuer-Automatik, Reagieren im selben Pointer-Frame (`passive: false`, `touch-action: none`, kein Browser-Zoom/Scroll).
- **Schwertangriff (Kiro):**
  - Immer **links ODER rechts**, bestimmt durch Joystick (oder zuletzt genutzte Seitenrichtung / nächster Gegner, wenn Stick neutral/vertikal).
  - **90°-Bogen**, beginnend **knapp über Kiros Kopf** bis waagerecht in die gewählte Seite (Dzeko-Klarstellung: Angriff geht seitlich links/rechts mit 90°-Bogen ab Kopf).
  - Sichtbare Katana-Klinge + leuchtende Cyan-Slash-Spur + 1-Frame-Hit-Flash + Partikel + SFX + kurzer Hit-Stop nur beim Treffer (Eingaben während Hit-Stop puffern!).
- **Mauer-Ducken & „Barrel Swing“:**
  - An linker oder rechter Brunnenmauer (≤ 12 px Wandabstand, intaktes Fass): Kiro duckt sich sichtbar ins Fass (Fassrand verdeckt Kiro teils, 120 ms Ease-Out, leichter Mörtel-/Staubpuff, leichte 3°-Neigung an die Wand).
  - Action-Button (zeigt Fass-Symbol, wenn `swingCd === 0`): Kiro schleudert im **leichten Bogen nach oben** (Regel 4: keine gerade Linie, z. B. 56–64 px Scheitelhöhe) zur gegenüberliegenden Mauer, verletzt **alle Gegner im Weg** (inkl. Kombo-Bonus +50 % je weiterem Kill im selben Swing), während des Flugs unverwundbar, danach 1500 ms Cooldown (Füllring am Button; während Cooldown zeigt Action-Button wieder das Schwert und erlaubt sofortigen Schwerthieb!).
- **Die 6 Seilphysik-Regeln:**
  1. **Runter schneller als rauf** (z. B. runter ~520 px/s, rauf ~340 px/s, seitlich ~360 px/s bei 390×844-Referenzmaßstab).
  2. **Oben am Bildschirmrand:** Spürbare Schaukelbewegung, zeigt „geht nicht weiter rauf“.
  3. **Hochsteuern:** Winziges Absacken symbolisiert Seilspannung (Standard = Variante B: nur optisch am Seil + Fass-Eintauchen, Hitbox geht sofort hoch; Variante A im Pause-Menü zum Gegenprüfen umschaltbar).
  4. **Barrel Swing:** Leichter Bogen nach oben.
  5. **Seitliches Bewegen:** Ganz leichtes, gedämpftes Pendeln/Schaukeln (optisch spürbar, Hitbox max. ±4 px), niemals Kontrollverlust.
  6. **Null gefühlte Eingabeverzögerung:** Sofortiges Ansprechen ab Frame 1 (60 % Starttempo, in 90–100 ms auf 100 %, weiches 70–80 ms Auslaufen).

---

## 4. „Ultra-4K Retro“-Grafikarchitektur (Kernproblem direkt lösen!)

Was Saba meint mit *„der retro style soll ultra 4k sein, nicht so mikrig“*:
- **Kein** 180×320-Pixel-Matsch und **keine** winzigen 16×16-Pünktchen auf dem Handy-Display.
- Stattdessen **hochauflösende, moderne 16-Bit-/32-Bit-/HD-Pixel-Art- & Retro-Ästhetik (wie *Messenger*, *Shovel Knight*, *Dead Cells* / *Celeste* / *Battletoads Arcade*):**
  1. **Volle native Canvas-Auflösung:** `canvas.width = Math.round(viewportW * dpr)`, `canvas.height = Math.round(viewportH * dpr)` mit `dpr = Math.min(window.devicePixelRatio || 1, 4)` (bis echte 4x Retina/4K-Schärfe!). Vollbild-Hochformat ohne unnötig kleine Letterbox-Ränder (dynamische Schachtbreite bis max. Aspect-Cap auf Desktop, auf Smartphones 100 % Bildschirmfläche nutzen).
  2. **Große, detailreiche Sprites (kein 24×16-Minisprite!):**
     - **Design-Pixel-Grid deutlich feiner & größer:** Statt 26×34 Pixel für Kiro+Fass → hochdetaillierte prozedurale HD-Retro-Sprites im **96×112 px bis 128×144 px** Detailraster (oder hochauflösende Multi-Pass-Canvas-Sprites mit 4–5 Farbabstufungen, feiner Holzmaserung, genieteten Eisenbändern, Kiro-Stirnband/Augen/Katana-Scheide, animiertem Verlet-Schal) auf Logik-Größe **~76×86 CSS-px** (Fass) gerendert → auf einem DPR-3/4-Handy sind das **228×258 bis 304×344 echte Gerätepixel** für die Hauptfigur!
     - **Gegner deutlich größer & bedrohlicher:**
       - **Mauerkriecher:** mindestens **64–76 CSS-px** lang, mehrgliedriger Chitin-Körper, aufstellbare Rückenstacheln, greifende Beine, glühendes Auge + aufreißende Mandibeln im 450+ ms Windup (reiner Körper-Telegraph, keine hässlichen Warnsymbole).
       - **Klingen-Fledermaus / Seilkrähe:** mindestens **54–64 CSS-px** Spannweite, 4 animierte Flügelphasen, metallische Sichelflügel/Krallen, Blitz-Glanz vor dem Sturzflug.
       - **Seilschneider-Kobold:** klettert von oben das Seil hinab (ab ~60–80 m), Scherenklauen klappen sichtbar auf und zu.
       - **Fallen & Lichter:** aus der Wand fahrende **Stachelfelsen** und **Dornenranken** (ab ~25–40 m) + leuchtende **Münzen** (animierte 4-Phase-Drehung, goldener Glow, 28–32 CSS-px groß!).
  3. **Szenen-Atmosphäre & Beleuchtung (aus `art-direction.md` + Root-Spiel, auf 4K-Retro-Niveau):**
     - Tiefenverlauf im Brunnenschacht (oben kühles Mondlicht-Blau `#12304A` durch das Spiralportal, tiefer dunkler und geheimnisvoller `#05070F` mit Biomen alle 100 m).
     - **3 Parallax-Ebenen:** tiefe Rückwand mit detaillierten Ziegelsteinen, Moos und Rissen (0.5x), mittlere Ebene mit Ketten/Rohren/Ranken (0.75x), vordere Seitenwände (1.0x) mit steinerner Innenkante & Highlight-Fuge.
     - **Dynamisches Licht:** weicher Mondlicht-Kegel von oben, warm flackernde Wandlaternen mit radialem Lichtschein (`lighter`), glühendes Brunnenportal beim Start, schwebende Staubflocken, additive Cyan-Klingenspur `#4FF0FF`.
     - **Kein künstlicher Unschärfe-Filter:** Crisp-Edge-Sprites sauber ohne verschmiertes Bilinear-Upscaling, kombinierbar mit gestochen scharfen Vektor-Partikeln, Verlet-Seil und Verlet-Schal (`ninja-anim.js` & `vfx.js`).
  4. **UI im 90er-Arcade-Look (nicht klobige `8px`-Systemboxen):**
     - Saubere gerahmte Arcade-Buttons (abgeschrägte pixel-scharfe oder metallisch/holzgefasste Retro-Rahmen, klar lesbare Icons: glänzendes Katana vs. Holzfass mit Eisenringen, runder/klassischer Sonic-Style-Thumbstick-Ring).
     - Lesbare Typografie: `'Press Start 2P'` für Arcade-Labels/Zahlen (Mindestgröße ≥ 12–16 CSS-px, keine unleserlichen 8-px-Texte!) + `'Rubik'`/`'Russo One'` optional nur wo längere Story-Sätze lesbar sein müssen.
     - Oben kompakt: **Tiefe (`m`)** mittig groß, **Punkte** + **Münzen** links, **Fass-Zustand + Ersatzfass-Icons** sichtbar, **Pause/Ton** rechts oben. Debug-Anzeigen (`Hitbox`, `Sag A/B`) gehören in das **Pause-Menü**, NICHT in die Hauptansicht.

---

## 5. Sound & Musik (aus bestehendem Repo wiederverwenden)

- Die fertigen Audio-Assets in `audio/` (`music_calm_loop`, `music_mid_loop`, `music_fast_loop`, `ambience_well_loop`, `sword_slash`, `enemy_hit`, `enemy_death`, `barrel_break`, `barrel_pickup`, `score_pickup`, `rope_creak`, `rope_cutting_loop`, `rope_snap`, `game_over`, `ui_click`, `ui_confirm`) + Chiptune-Synth aus Root `index.html` direkt einbinden.
- Mute-Button rechts oben im HUD, respektiert Autoplay-Unlock beim ersten Tap auf „Spielen“.

---

## 6. Verbindliche Grenzen („Nur bauen, was bestellt ist“)

- **Kein** Dorf-Aufbau, **kein** Equipment-Shop, **keine** Outfits zum Kaufen, **keine** spielbare Tara (Tara erscheint nur story-gemäß als Figur auf dem Titel-/Ohnmachtsscreen bzw. am oberen Brunnenrand!).
- **Kein** Linkshänder-Modus ohne Sabas OK.
- **Keine** neuen Repos, **keine** Store-Builds (Capacitor/Xcode/ASC).
- Vor Abgabe: Vollständiger Playwright-QA-Lauf (Touch-Latenz, Multitouch, 90°-Schwertsektor, Barrel-Swing-Kette, Fass-Button, Münz-Persistenz, Ohnmachts-Screen, 360×640 / 390×844 / 412×915 bei DPR 1/2/3, 0 Konsolenfehler, Screenshots aller States zur visuellen Prüfung).

---

## 7. Team-Fragen für `SendToAgent` (AppTec-Runde vor Start des Cloud-Agents)

Da ein Subagent keinen direkten Zugriff auf `SendToAgent` hat, sind hier die exakten, sofort versandfertigen Fragen an alle 7 Team-Agenten (mit IDs):

1. **Kreativ-Studio (`89d5c92d-5bd7-4c85-a0cc-a331236eae4b`):**
   - Wie definieren wir „Ultra-4K 90er-Retro“ technisch und stilistisch für Kiro, das Fass, die Gegner und den Brunnen (Ziel-Auflösung/Sprite-Größe, Farbrampen, Schattierung, Portal-Effekt, Story-Szene „Wiese neben Brunnen mit Tara und Münzhaufen“ + Titelscreen), sodass nichts mehr „mikrig“ wirkt?
2. **Animation & Effekte (`ae39f5c9-8bf6-44fa-aacb-555924c6a547`):**
   - Wie heben wir `vfx.js`, `ninja-anim.js`, `enemy-anim.js` und die prozeduralen Sprites in `prototyp/` auf gestochen scharfe native DPR-4K-Qualität (echte Katana-Pose im 90°-Bogen ab über dem Kopf, animierte Gegner-Posen statt statischer 1-Frame-Icons, Verlet-Seil mit sichtbarer Spannung beim Hochsteuern, Münz-Sparkles, Portal-Spirale, Story-Ohnmachts-Szene) ohne Frame-Drops bei 60/120 Hz?
3. **Game Design & Balancing (`f33c6a2a-1649-443a-90a5-d6effb0842e3`):**
   - Wie sollten wir Tempo, automatisches Sinkgefühl (Doc: „v4 – Fass sinkt automatisch“), Seilphysik-Regeln 1–6 (besonders das leichte Absacken beim Hochsteuern & das Schaukeln oben), die Gegner-/Fallen-Einstiegskurve (Krabbler, Fledermaus, Seilschneider, Stacheln/Ranken) und das Zusammenspiel Barrel Swing vs. Schwert-Cooldown an der Mauer abstimmen, damit es sich sofort rund und suchterzeugend anfühlt?
4. **Hooky (`80b27995-e506-482e-93aa-972987a205ed`):**
   - Was fehlt im Moment am stärksten am „Noch eine Runde“-Sog im ersten 30-Sekunden-Einstieg (Titelbildschirm → Portal-Eintritt → erste Münzspuren/Gegner → Ohnmacht bei Tara mit dem Münzhaufen), ohne Features vorzugreifen (kein Shop/Dorf)?
5. **Playtest & Qualität (`40cd00d5-4f36-4c48-95b-fe30edfb7360`):**
   - Welche konkreten Touch- & HUD-Punkte müssen beim Rebuild Pflicht sein (sichtbarer Sonic-Style-Joystick-Anker rechts unten, Icon-Wahrheit am Action-Button während `swingCd`, sichtbares Ersatzfass-HUD, keine Debug-Knöpfe im Spielfeld, Playtest-Kriterien auf 360×640 bis 412×915 @DPR3)?
6. **Sound & Musik (`ada4016c-acc2-4f44-9103-d1170a2b7da7`):**
   - Welche vorhandenen Sounds aus `audio/` + `Chip` aus dem Root-Spiel brauchen wir zwingend im Rebuild (`sword_slash`, `enemy_hit`, `barrel_break`, `barrel_pickup`, `score_pickup` für Münzen, `rope_creak`, `rope_cutting_loop`, `game_over`, `music_calm/mid/fast`, `ambience_well_loop`), und fehlt ein Sound für Barrel Swing / Tara-Aufwachen?
7. **Entwicklung & Release (`68e96d68-461f-459d-b639-46b704e73424`):**
   - Architektur-Check für den Rebuild in `hasanbeg99/kagewell/prototyp/`: Saubere Integration von `../vfx/*`, `../audio/*`, `../fonts/*` und `sw.js`-Caching, DPR-4-Rendering-Performance-Budget auf Mobilgeräten, und wie wir den Übergang vorbereiten, falls Saba danach `/` durch `prototyp/` ersetzen will.
