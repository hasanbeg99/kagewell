# Kagewell / Barrel Ninja — Audio-Zuordnung (23.11.2026)

**Zweck:** Exakte Zuordnung vorhandener Sounds aus dem Repo `hasanbeg99/kagewell` plus WebAudio-Chiptune in der Root-`index.html` für den Rebuild in `prototyp/`. Kein Spielcode geändert.

**Quellen (alles auf der Box nachgeprüft, nichts erfunden):**

| Quelle | Pfad |
|---|---|
| Repo-Klon (shallow) | `/workspace/qa-src/kagewell` (`origin`: `https://github.com/hasanbeg99/kagewell.git`, HEAD u. a. `a40f721` / `87f2800`) |
| Audio-Paket im Repo | `audio/` (23 Stämme × ogg + m4a + mp3 = 66 Mediendateien) |
| Identisches Arbeits-Paket | `/workspace/barrel-ninja/audio/` (gleiche SHA-256 für alle gemeinsamen Dateien; zusätzlich nur `preview.html`, nicht im Repo) |
| WAV-Master (nicht im Repo) | `/workspace/barrel-ninja-sfx/wav/` |
| Rebuild-Plan | `/workspace/teamdoc/REBUILD-PLAN-2026-11-23.md` |
| Messungen | `ffprobe` + `ffmpeg ebur128=peak=true` (ffmpeg 7 / Lavc61), 23.11.2026 |

**Lizenz:** `audio/LICENSES.md` — alle Dateien in `audio/` (ogg/m4a/mp3), `generate.py` und die WAV-Master sind **vollständig prozedural** erzeugt (Seed `20261022` laut `audio/README.md`). Keine Samples Dritter, keine Übernahme aus anderen Spielen. Urheber Oruci Sabahudin, frei inkl. kommerziell, ohne Namensnennung. **Keine fremden oder unklaren Quellen.**

**Ist-Stand `prototyp/`:** `prototyp/index.html` und `prototyp/game.js` enthalten **keine** Audio-Anbindung (komplett stumm). Der fertige Player sitzt in der Root-`index.html` (`AudioMgr` + `Chip`). Rebuild soll Dateien über `../audio/` laden und den bestehenden Manager übernehmen oder nachbauen — nicht die Live-Root `/` überschreiben.

---

## 1. Inventar der Dateien in `audio/`

23 Klangstämme, jeweils `.ogg` (Vorbis), `.m4a` (AAC-LC) und `.mp3`. Alle 44,1 kHz. SFX mono, Atmo/Musik stereo. Generator: `audio/generate.py`. Metadaten: `audio/sounds.json`. Aktive Zuordnung Root-Spiel: `audio/manifest.json`. Referenz (nicht aktiv): `audio/manifest.suggested.json`.

**Format-Empfehlung für den Rebuild (wie Root-`AUDIO_EXTS`, Zeilen 575–581):** Browser wählt `.ogg` → `.m4a` → `.mp3` per `canPlayType`. **ogg + m4a sind Pflicht** (m4a für iOS/Safari). mp3 bleibt als letzter Fallback im Repo, muss nicht neu erzeugt werden. Alles über WebAudio-Buffer abspielen, nicht über `<audio loop>` (Lücken an Loop-Nähten; AAC-Padding).

**Messung:** Lautheit der Loops als Integrated (I, LUFS). SFX als max. Momentary (M, 400 ms); bei Clips < 400 ms wurde hinten Stille aufgefüllt, sonst liefert EBU R128 oft I = −70 (ungültig, zu kurz). True Peak (TP) in dBFS laut ebur128. Leichte Abweichungen zu `sounds.json` (typisch 0,1–0,5 dB) kommen von Decoder/True-Peak-Algorithmus; fürs Mapping gelten die gemessenen OGG-Werte. mp3 ist durch Encoder-Delay oft 30–50 ms länger als die Design-Dauer — **`loopEnd` immer auf die Design-Dauer setzen**, nicht auf die Container-Dauer.

| Stamm (`audio/<name>.ogg/.m4a/.mp3`) | Design-Dauer | Loop / `loopEnd` | Kanäle | OGG M bzw. I (LUFS) | OGG TP (dBFS) | Empf. Vol. 0–1 | Beschreibung (`sounds.json`) |
|---|---:|:---|:---:|---:|---:|---:|---|
| `swipe` | 0,24 s | nein | 1 | M −16,6 (I ungültig) | −2,1 | **0,55** | Wisch / aufsteigendes Luftrauschen |
| `rope_retract` | 0,42 s | nein | 1 | M −16,2 | −2,7 | **0,50** | Seil einziehen, Holz-Stopp |
| `rope_extend` | 0,50 s | nein | 1 | M −16,6 | −2,0 | **0,50** | Seil verlängern, Spannungs-Knarz |
| `rope_creak` | 0,75 s | nein | 1 | M −17,2 | −4,8 | **0,40** | Seil knarzt (Stick-Slip) |
| `sword_slash` | 0,48 s | nein | 1 | M −14,9 | −1,3 | **0,90** | Katana: Whoosh + metallisches Shing |
| `enemy_hit` | 0,32 s | nein | 1 | M −15,0 (I ungültig) | −1,5 | **0,85** | Treffer am Gegner |
| `enemy_death` | 0,75 s | nein | 1 | M −15,1 / I −18,0 | −2,8 | **0,80** | Gegner tot, Zerfallen |
| `player_hit` | 0,50 s | nein | 1 | M −15,3 | −1,6 | **0,90** | Spieler/Fass getroffen, dissonanter Stich |
| `barrel_break` | 0,90 s | nein | 1 | M −16,5 / I −20,1 | −2,0 | **0,85** (Root-Code nutzt 0,90) | Fass zerplatzt, Splitter, Reifen |
| `barrel_pickup` | 0,55 s | nein | 1 | M −15,9 / I −16,8 | −3,4 | **0,70** | Ersatzfass anlegen, Holz-Tonk + Marimba |
| `warning` | 0,75 s | nein | 1 | M −15,1 / I −16,8 | −3,4 | **0,75** | Telegraph, Taiko ka-DON + Gong |
| `rope_cutting_loop` | 1,50 s | **ja / 1,5** | 1 | I −18,2 | −3,2 | **0,55** | Seil wird geschnitten |
| `rope_snap` | 0,80 s | nein | 1 | M −15,7 / I −19,1 | −3,1 | **0,85** | Seil reißt |
| `ui_click` | 0,07 s | nein | 1 | M −19,0 (I ungültig) | −1,6 | **0,50** (Root-Code nutzt 0,60) | UI-Klick, Holzblock |
| `ui_confirm` | 0,40 s | nein | 1 | M −15,9 | −4,7 | **0,60** | UI-Bestätigung, E5–A5 |
| `score_pickup` | 0,42 s | nein | 1 | M −16,0 | −5,1 | **0,45** | Münze, Glocken Ting-ting E6–B6 |
| `game_over` | 2,60 s | nein | 1 | M −15,1 / I −19,1 | −5,0 | **0,80** | Absteigende In-Skala, Koto + Shakuhachi |
| `new_highscore` | 1,90 s | nein | 1 | M −15,2 / I −18,5 | −2,3 | **0,80** | Aufsteigende Yo-Skala, Taiko, Glocken |
| `ambience_well_loop` | 24,00 s | **ja / 24,0** | 2 | I −24,1 | −10,7 | **0,60** | Brunnen-Atmo: Wind, Tropfen, Hall |
| `music_calm_loop` | 76,80 s | **ja / 76,8** | 2 | I −18,0 | −6,4 | **0,50** | Musik ruhig, 75 BPM, Koto + Shakuhachi |
| `music_mid_loop` | 76,80 s | **ja / 76,8** | 2 | I −18,0 | −3,8 | **0,50** | Musik mittel, 100 BPM, Shamisen, leichte Taiko |
| `music_fast_loop` | 71,111 s | **ja / 71,111** | 2 | I −18,0 | −3,3 | **0,50** | Musik schnell, 135 BPM, treibende Taiko |

OGG-, M4A- und MP3-Varianten existieren für **jeden** Stamm (nachgezählt: 66 Mediendateien). Peaks aller Dateien unter 0 dBFS, typisch ≤ −1,3 dBFS — kein hartes Clipping.

**Volumen-Hinweis:** `sounds.json` ist das Sounddesign-Soll. Das aktive Root-`manifest.json` / `SOUND_DEFAULTS` weicht an zwei Stellen ab: `barrel_break` 0,90 statt 0,85, `ui_click` 0,60 statt 0,50. Für den Rebuild die `sounds.json`-Werte verwenden (Fass-Break ist gemessen eher leise, 0,85–0,90 ist vertretbar und sollte im Playtest entschieden werden).

---

## 2. WebAudio in der Root-`index.html` (Zeilen bezogen auf `/workspace/qa-src/kagewell/index.html`)

Zwei Schichten, alles läuft über `AudioMgr.play(name, opts)`:

1. **Datei-Player** `AudioMgr` (ab Zeile 553) — lädt `audio/manifest.json`, dekodiert Buffer, Loops mit `loopEnd`, 3 Musikstufen, Synth-Fallback wenn die Datei fehlt.
2. **Chiptune** `Chip` (ab Zeile 764) — 8-Bit-Ersatz für SFX und Musik. **`Chip.on` ist standardmäßig an** (`Store.data.chip !== false`, Zeile 769). Dann werden die modernen Dateien für SFX/Musik **nicht** gespielt. Ausnahme laut Kommentar Zeile 766: `ambience_well_loop` und `rope_cutting_loop` bleiben Dateien. Umschalten im Root-Menü: Button „KLANG: 8-BIT / MODERN“ (Zeile 1664).

**Empfehlung Rebuild:** Atmosphärischen Brunnen-Sound als Default (**Modern / `chip = false`**), 8-Bit optional behalten. Sonst hört man die fertigen Loops im Prototyp nie.

### 2.1 `AudioMgr` — Funktionen

| Funktion | Zeile | Rolle |
|---|---:|---|
| `BALANCE.audio` | 557–565 | `musicTiersM: { mid: 120, fast: 300 }`, Crossfade 1,8 s, Fade-out Game Over 1,0 s, Pause-Ducking ×0,35, `pitchVary` 0,94–1,06 für `swipe` / `sword_slash` / `score_pickup`, `ropeCreakMinGapMs: 1400` |
| `SOUND_DEFAULTS` / `MUSIC_TIERS` / `AUDIO_EXTS` | 566–582 | Soll-Lautstärken, Loop-Enden, Formatwahl ogg→m4a→mp3 |
| `AudioMgr.init` | 588 | `fetch('audio/manifest.json')`, Bytes vorladen |
| `AudioMgr.unlock` | 634 | AudioContext erst nach Geste, iOS-Stille-Buffer, startet Menü-Musik Stufe 0 |
| `AudioMgr.play` | 653 | Wenn `Chip.on` → `Chip.play`; sonst Buffer + optional `playbackRate`; sonst `AudioMgr.synth` |
| `AudioMgr.ropeCreak` | 668 | Cooldown 1400 ms, Volume zufällig 0,7–1,0 × Basis 0,4 |
| `AudioMgr.loopSource` / `setLoop` | 669 / 676 | Nahtlose Loops (Atmo, Seilschnitt), Fade 150/120 ms |
| `AudioMgr.setMusicTier` | 688 | Equal-Power-Crossfade 1,8 s (64 Schritte sin/cos) oder `Chip.startMusic` |
| `AudioMgr.startRunMusic` | 711 | Jeder Lauf startet bei Stufe 0 (calm) |
| `AudioMgr.updateMusicForDepth` | 712 | Nur Hochschalten: mid ab 120 m, fast ab 300 m |
| `AudioMgr.fadeMusicTo` / `musicOutOnOver` | 716 / 717 | Pause-Ducking bzw. 1 s Ausblenden beim Run-Ende |
| `AudioMgr.tone` / `noise` | 723 / 730 | Synth-Primitive (Fallback) |
| `AudioMgr.synth.*` | 738–756 | Fallback je Name; **zusätzlich** `cutTick` (750) — **keine Datei**, nur Synth (0,04 s High-Tick). Nicht in `Chip.sfx`. |

### 2.2 `Chip` — Primitive, SFX, Musik-Sequencer

| Funktion | Zeile | Rolle |
|---|---:|---|
| `Chip.on` (Getter) | 769 | `Store.data.chip !== false` |
| `Chip.nbuf` | 770 | NES-artiges gehaltenes Rauschen |
| `Chip.wave` | 772 | 25-%-Puls als PeriodicWave |
| `Chip.seq` | 774 | Notenfolge `[[freq, dauer], …]` |
| `Chip.sweep` | 782 | Frequenzgleiten |
| `Chip.nz` | 789 | Gefiltertes Rauschen |
| `Chip.sfx.swipe` … `new_highscore` | 796–812 | 8-Bit-Pendants zu **allen Datei-SFX außer** `rope_cutting_loop` (und den Musik-/Atmo-Loops) |
| `Chip.play` | 814 | Dispatch `Chip.sfx[name]` |
| `Chip.CHORDS` / `BASS` / `LEAD` | 817–819 | Sequencer-Daten: 64 Schritte, Harmonik **Am – F – G – E** (nicht die In-Skala der Datei-Loops) |
| `Chip.startMusic` / `stopMusic` / `tick` | 820 / 824 / 825 | Timer 30 ms; BPM **100 / 118 / 136** je Stufe; Stufe 0 = Bass+Arp, Stufe 1 = +Lead+Hi-Hat, Stufe 2 = +Kick+Snare |

`Chip.sfx`-Namen und Kurzcharakter (Fallback, wenn 8-Bit an oder Datei fehlt):

| `Chip.sfx` / Zeile | Inhalt kurz |
|---|---|
| `swipe` 796 | Highpass-Rauschen 0,06 s + Puls-Sweep 900→300 Hz |
| `sword_slash` 797 | Square-Sweep 1800→260 Hz + Highpass-Rauschen |
| `enemy_hit` 798 | Square 220/110 Hz + Lowpass-Rauschen |
| `enemy_death` 799 | Puls absteigend 523→196 Hz + Rauschen |
| `player_hit` 800 | Square-Sweep 420→70 Hz + Rauschen |
| `barrel_break` 801 | Langes Lowpass-Rauschen + Triangle 300→50 Hz |
| `barrel_pickup` 802 | Puls C5–E5–G5–C6 |
| `warning` 803 | Square-Alarm 880 / 880 / 660 Hz |
| `rope_retract` 804 | Triangle-Sweep 260→700 Hz |
| `rope_extend` 805 | Triangle-Sweep 700→240 Hz |
| `rope_creak` 806 | Triangle 98 / 92 Hz |
| `rope_snap` 807 | Bandpass-Rauschen + Square 900→90 Hz |
| `ui_click` 808 | Square 1320 Hz, 30 ms |
| `ui_confirm` 809 | Puls 784 / 1175 Hz (G5–D6) |
| `score_pickup` 810 | Square 988 / 1319 Hz |
| `game_over` 811 | Absteigende Triangle- + Puls-Linie |
| `new_highscore` 812 | Aufsteigender Puls bis C6 |

---

## 3. Zuordnung: Spielmoment → vorhandene Datei / Chip-Funktion

Pfade relativ zum Repo-Root. Im Rebuild aus `prototyp/` als `../audio/<name>.{ogg,m4a,mp3}` laden. Volume ist der empfohlene Gain (0–1) bei Master = 1, zusätzlich zu evtl. `opts.vol`-Faktoren wie im Root. „Chip“ = dieselbe `AudioMgr.play`-Name, landet automatisch in `Chip.sfx[name]`.

### 3.1 Von Alu ausdrücklich erfragt

| Spielmoment | Datei / Funktion | Format | Vol. | Loop | Hinweise |
|---|---|---|---:|:---:|---|
| **Titelbildschirm** | `audio/music_calm_loop` + leise `audio/ambience_well_loop`; Buttons: `ui_click` / Start: `ui_confirm`. Chip: `Chip.startMusic(A, 0)` (ab Unlock, `AudioMgr.setMusicTier(0)`, Z. 648, 1658) | ogg+m4a | Musik 0,50; Atmo 0,35–0,50 am Titel (im Lauf 0,60); Click 0,50; Confirm 0,60 | Musik/Atmo ja (`loopEnd` 76,8 / 24,0) | Beim ersten Tap `AudioMgr.unlock()` (Autoplay). Menü und jeder neuer Lauf beginnen bei Stufe 0. Kein eigener Titel-Jingle vorhanden. |
| **Münz-Pickup** | `audio/score_pickup` · `Chip.sfx.score_pickup` Z. 810 · Root-Hook Z. 1247 | ogg+m4a | **0,45** (Near-Miss im Root mit `{vol:0,8}` → effektiv ~0,36, Z. 1133) | nein | `playbackRate` 0,94–1,06. Oft hintereinander — Basis bewusst leise. |
| **Schwert(hieb)** | `audio/sword_slash` · `Chip.sfx.sword_slash` Z. 797 · Hook `attack()` Z. 1101 | ogg+m4a | **0,90** | nein | `playbackRate` 0,94–1,06. Cooldown laut Rebuild ~260 ms, kein Dauerfeuer. Bei Treffer zusätzlich `enemy_hit` / Kill: `enemy_death`. |
| **Fass-Schwung (Barrel Swing)** | **FEHLT** (keine Datei, kein Chip-SFX, kein Hook). Vorübergehend *nur als Lücke-Füllung*, nicht als eigener Swing-Sound: Start-Whoosh `swipe` (0,55–0,70), Treffer weiter über `enemy_hit` / `enemy_death` | ogg+m4a | swipe 0,55–0,70 | nein | Siehe Fehlliste. `swipe` ist ein kurzes Luftrauschen (0,24 s), kein Fass-Körper, kein Mauer-Aufprall. Nicht `barrel_break` verwenden (klingt nach zerstörtem Fass). Nicht `sword_slash` (Metall). |
| **Fass zerbricht** | `audio/barrel_break` · `Chip.sfx.barrel_break` Z. 801 · Root-`hurt()` spielt das bei nicht-letztem HP (Z. 1141) | ogg+m4a | **0,85–0,90** | nein | Rebuild-Regel: *erster Treffer bei intaktem Fass*. Danach I-Frames. Gemessen eher leise (I ca. −20, M −16,5) — im Playtest ggf. näher an 0,90. |
| **Ersatzfass anlegen** | `audio/barrel_pickup` · `Chip.sfx.barrel_pickup` Z. 802 | ogg+m4a | **0,70** | nein | Am eigenen Fass-Knopf, nur wenn Fass kaputt und Inventar ≥ 1. Root nutzt denselben Sound zusätzlich für Reisbällchen und Wellen-Ende (Z. 1246, 1194) — im Rebuild nicht vermischen, falls diese Events bleiben. |
| **Seil-Knarzen** | `audio/rope_creak` · `Chip.sfx.rope_creak` Z. 806 · `AudioMgr.ropeCreak()` Z. 668 | ogg+m4a | Basis **0,40**, Root skaliert ×0,7–1,0 | nein | **Cooldown 1400 ms.** Root: nur bei schnellem Abseilen, 2 % Chance/Frame (Z. 1228) — wirkt dünn. Rebuild: an Spannung koppeln (Hochsteuern/Absacken Regel 3, Schaukel oben Regel 2, seitliches Pendeln Regel 5), weiter mit Gap 1400 ms. |
| **Ohnmacht / Tara-Szene** | Teilweise vorhanden, **Szene selbst fehlt akustisch.** Treffer ohne Fass: `player_hit`; Seilschnitt: `rope_snap` dann `game_over` (Root Z. 1141, 1151–1153). Neuer Bestwert: `new_highscore` (Z. 1608). Buttons: `ui_confirm` / `ui_click`. Chip: dieselben Namen | ogg+m4a | player_hit 0,90; rope_snap 0,85; game_over 0,80; highscore 0,80 | nein | **Musik:** `musicOutOnOver` blendet in 1 s aus (Z. 717) — für die Wiesen-Szene besser **ducken auf ×0,15–0,20 in ~0,8 s** (stärker als Pause ×0,35), Atmo entweder ausblenden oder stark ducken (Brunnen-Wind passt nicht zur Wiese). `game_over` ist eine absteigende Brunnen-Klage, kein Aufwachen neben Tara. Siehe Fehlliste (`tara_wake`, Wiesen-Atmo). |
| **Musikschichten nach Tiefe** | Dateien `music_calm_loop` / `music_mid_loop` / `music_fast_loop` über `AudioMgr.updateMusicForDepth` / `setMusicTier`. Alternative: `Chip.startMusic` Stufen 0/1/2 | ogg+m4a | **0,50** | ja | Siehe Abschnitt 4. |

### 3.2 Weitere Momente aus dem Rebuild-Plan und vorhandenen Hooks

| Spielmoment | Datei / Funktion | Vol. | Loop | Hinweise |
|---|---|---:|:---:|---|
| Start / „Spielen“ / Portal-Eintritt | `ui_confirm` + `AudioMgr.startRunMusic()` (Z. 1602) + Atmo auf 0,60 hochziehen | 0,60 / Musik 0,50 | Musik/Atmo ja | **Eigenes Portal-SFX fehlt.** Nicht still starten. Atmo laut Root ab erstem Unlock (Z. 626), im Lauf nicht neu triggern. |
| Seil einziehen (hoch) | `audio/rope_retract` · Chip Z. 804 | 0,50 | nein | **Datei existiert, im Root aber nirgends aufgerufen.** An Joystick-Hoch koppeln, mit Cooldown (z. B. 400–600 ms), nicht jeden Frame. |
| Seil verlängern / schneller sinken | `audio/rope_extend` · Chip Z. 805 | 0,50 | nein | Datei existiert. Im Root **umgenutzt** fürs Ausfahren der Dornenranke (Z. 1028), nicht fürs Spieler-Seil. Im Rebuild: Spieler-Abseilen mit Cooldown; Ranke besser `warning` (Telegraph) plus eigener Sound (fehlt) oder vorerst `rope_extend` bei Vol. 0,50 lassen und klar benennen. |
| Mauer-Ducken ins Fass | **FEHLT** | — | — | 120 ms Ease-Out laut Plan. Kein passender kurzer Holz-/Mörtel-Sound. |
| Swing landet an Gegenmauer | **FEHLT** | — | — | Holz/Stein-Impakt. Nicht `barrel_break`. |
| Gegner-Telegraph (Krabbler-Windup, Fledermaus-Aim, Seilschneider erscheint) | `audio/warning` · Chip Z. 803 · Hooks Z. 1021 (Vol. 0,45), 1058 (0,40) | 0,40–0,75 | nein | Beim Seilschneider-Einstieg (~60–80 m) voll 0,75; bei häufigen Windups lieber 0,40–0,45, sonst Alarm-Müdigkeit. Plan: kein hässliches Warnsymbol, also Ton ist wichtig. |
| Krabbler-Lunge / Fledermaus-Sturzflug | `audio/swipe` · Hooks Z. 1022 (0,70), 1062 (0,60) | 0,60–0,70 | nein | `playbackRate` variieren. Joystick-Steuerung braucht `swipe` nicht mehr als Player-Input. |
| Gegner getroffen, lebt noch | `audio/enemy_hit` · Hook Z. 1129 | 0,85 | nein | Optional leichte Pitch-Variation (im Root nicht in `pitchVaryNames`). |
| Gegner besiegt | `audio/enemy_death` · Hook Z. 1126 | 0,80 | nein | Qualität: absteigender Ton kann im Rauschen untergehen — Nachbesserung sinnvoll, Datei ist aber vorhanden. |
| SMASH / Kombo-Kill (Root: jeder 4. Treffer) | Root spielt `barrel_break` bei `{vol:0,8}` (Z. 1124) — **Zweckentfremdung** | — | — | Kein eigener Smash-Sound. Entweder weglassen (Treffer + Death genügen) oder nachliefern. Nicht als „Fass zerbricht“ lesen. |
| Spieler getroffen, Fass noch ganz | `barrel_break` (siehe oben) | 0,85–0,90 | nein | Rebuild: genau ein Mal pro Fass, dann Kiro frei am Seil. |
| Spieler getroffen, kein Fass → Ohnmacht | `player_hit` | 0,90 | nein | Geschmackssache (dissonanter Stich). Danach Tara-Szene, nicht klassisches „Tod“-Feeling. |
| Seilschneider pickt am Seil | `audio/rope_cutting_loop` via `AudioMgr.setLoop(..., true/false)` Z. 1071, 1127, 1150, 1605–1606 | 0,55 | **ja**, `loopEnd` 1,5; Fade 150 ms an, 120 ms aus | Loop stoppen, sobald kein pecker mehr aktiv, bei Pause, Menü und Run-Ende. In 8-Bit-Mode bleibt diese Datei (kein Chip-Loop). |
| Seil reißt | `audio/rope_snap` dann (Root) `game_over` +0,25 s | 0,85 / 0,80 | nein | Danach Tara-Szene wie oben, Musik wegducken. |
| Stachelfelsen | **kein Hook, keine Datei** | — | — | Root spawnt `rock` stumm (Z. 1173). |
| Stromfeld (`zap`) | Root: `enemy_hit` bei `{vol:0,4}` wenn Feld an geht (Z. 1033) — **schlechter Fit** (das ist ein Schlag, kein Strom-Brummen) | — | — | Eigener Zap-Sound fehlt. Vorübergehend `warning` (0,40) zum Anschalten, aber kein Loop für die Dauer „on“. |
| Knappes Ausweichen | Root: `score_pickup` `{vol:0,8}` Z. 1133 | effektiv ~0,36 | nein | Optional beibehalten; nicht mit Münze verwechseln (gleiche Datei). |
| Pause an / aus | Kein SFX nötig; Musik `fadeMusicTo(0,35)` bzw. zurück auf 1 (Z. 1605–1606). `ui_click` für den Button | Ducking ×0,35 | Musik weiterlaufen lassen | Seilschnitt-Loop während Pause aus, bei Resume wieder an wenn nötig. |
| Mute | `AudioMgr.setMuted` — Master-Gain auf 0, Loops laufen stumm weiter (Z. 652, 1665) | — | — | Pflicht im HUD laut Plan. |
| „Nochmal“ / zurück zum Titel | `ui_confirm` bzw. `ui_click`; Musik `startRunMusic()` bzw. `setMusicTier(0)` | 0,60 / 0,50 | — | Root-Buttons Z. 1653–1661. |
| Neuer Highscore / Besttiefe | `audio/new_highscore` · Chip Z. 812 | 0,80 | nein | Einmal pro Run-Ende, wenn `isNew`. Root spielt denselben Sound auch bei Abschnittswechsel (Z. 1199, vol 0,6) und Shop-Kauf — Shop/Dorf **nicht** im Rebuild. Für Biome-Wechsel lieber `ui_confirm` (0,60), Highscore-Fanfare nicht inflationär. |
| CRT/Klang-Toggle, Pause-Menü | `ui_click` | 0,50 | nein | — |

---

## 4. Musikschichten nach Tiefe — Regeln

Die drei Datei-Loops stehen in derselben In-Skala auf D (D–Eb–G–A–Bb), gleicher Bass-Zyklus, gleiches Kernmotiv. Crossfades an beliebiger Stelle sind harmonisch; Beat-Sync ist wegen unterschiedlicher Tempi **nicht** nötig (`audio/README.md`).

Der Chip-Sequencer ist **harmonisch und tempo-mäßig ein anderes Stück** (Am–F–G–E, 100/118/136 BPM) und ersetzt die Dateien komplett, wenn `Chip.on`.

| Tiefe | Datei-Loop | BPM | Chip-Stufe | Chip-Inhalt | Chip-BPM |
|---|---|---:|---:|---|---:|
| Titel, Pause-Menü, Laufstart, **0–119 m** | `audio/music_calm_loop` (`loopEnd` 76,8) | 75 | 0 | Bass + Arpeggio | 100 |
| **120–299 m** | `audio/music_mid_loop` (`loopEnd` 76,8) | 100 | 1 | + Lead + Hi-Hat | 118 |
| **≥ 300 m** | `audio/music_fast_loop` (`loopEnd` 71,111) | 135 | 2 | + Kick + Snare | 136 |

**Crossfade- und Schaltregeln (soll = Root `BALANCE.audio`, Z. 557–565, 687–718):**

- Equal-Power-Kurve, Dauer **1,8 s** (`musicXfadeS`). Beim allerersten Start ohne Vorgänger kürzer fade-in (Root: 0,6 s).
- **Nur hochschalten** während eines Laufs, kein Zurück auf calm/mid wenn der Spieler klettert.
- Jeder neue Lauf und der Titel: fest Stufe 0 / `music_calm_loop`.
- Run-Ende: Musik in **1,0 s** aus (`musicFadeOutOnOverS`), Current-Source stoppen. Für die Tara-Szene stattdessen auf ×0,15–0,20 ducken (siehe oben) und erst beim „Nochmal“ oder Titel wieder calm starten.
- Pause: Musik auf **×0,35**, Loops nicht stoppen.
- Schwellen stehen in `BALANCE.audio.musicTiersM` (`mid: 120`, `fast: 300`), nicht fest im Audio-Code. `balance.json` im Repo ist leer (nur Kommentar) — Werte dort überschreibbar machen.
- **Nicht verwechseln:** `audio/README.md` nennt ältere **Score**-Schwellen 500 / 1500. Das Root-Spiel und der Rebuild-Plan („Musikschichten nach Tiefe“) nutzen **Meter**. Biome wechseln alle 100 m (`T.sectionM`, Sets Brunnen / Moosgrund / Glutschacht) — dafür gibt es **keine** eigenen Musikstems; die drei Intensitätsstufen laufen unabhängig davon.

Atmo `ambience_well_loop` läuft durchgehend unter der Musik (Vol. 0,60), auch im 8-Bit-Modus als Datei. Kein zweiter Atmo-Loop vorhanden.

---

## 5. Fehlliste — was nachgeliefert werden sollte

Nur Lücken, für die **keine** passende vorhandene Datei existiert (Zweckentfremdungen sind als solche markiert, nicht als Lösung verkauft).

| Priorität | Benötigter Sound | Warum er fehlt | Vorschlag an Sound (zur Nachlieferung) |
|---|---|---|---|
| **P0** | **Barrel Swing** (Start/Flug) | Explizit im Plan und in Alus Frage. Kein File, kein Chip, kein Hook. | Kurzer Holz-/Whoosh-Körper, 0,3–0,5 s, mono, loop nein. Nicht `swipe` dauerhaft benutzen. |
| **P0** | **Swing-Landung** an der Gegenmauer | Kein Impakt-Sound. `barrel_break` wäre falsch (Fass soll ganz bleiben). | Holz auf Stein, kurz, mono. Kann ein zweiter Stamm oder die zweite Hälfte desselben Swing-Files sein. |
| **P0** | **Tara-Aufwachen / Wiesen-Stinger** | `game_over` ist eine absteigende Brunnen-Klage, passt nicht zur Doc-Szene (Tara beugt sich über Kiro, Münzhaufen). | Weicher, kurzer Stinger 1,5–3 s, dieselbe In-/Yo-Skala, ohne „Game Over“-Gestus. Vol. Ziel ~0,70–0,80. |
| **P1** | **Wiesen-Atmo** (Tara-Szene) | Nur `ambience_well_loop` (Wind/Tropfen im Schacht) vorhanden. | Leiser Outdoor-Loop (Nachtwiese, Insekten/Blätter), stereo, 15–30 s, I um −24 LUFS, Vol. ~0,45. Oder klar entscheiden: Szene ohne Atmo, Brunnen-Atmo ausblenden. |
| **P1** | **Portal-Eintritt** | Plan: Spiralportal, spürbarer Abstieg. Nur `ui_confirm` + Musikstart vorhanden. | 0,8–1,5 s Steigflug/Licht-Whoosh in der In-Skala, nicht nervig, mono oder kurz stereo. |
| **P2** | **Mauer-Ducken** | 120 ms sichtbares Eintauchen, kein SFX. | Sehr kurzer Holz-/Mörtel-Puff, < 0,2 s, Vol. ~0,35–0,45, Cooldown gegen Spam. |
| **P2** | **Stromfeld** | Root missbraucht `enemy_hit` @ 0,4. Kein Brummen/Crackling, kein An/Aus. | Kurzer Zap-On + optional leiser Loop solange `on`. |
| **P2** | **Stachelfelsen / ausfahrende Falle** (neben der umgenutzten Ranke) | Felsen sind stumm; Ranke leiht sich `rope_extend`. | Stein-Schub oder Wurzel-Ziehen, getrennt vom Spieler-Seil. |
| **P3** | Eigener **Smash/Kombo**-Akzent | Root nutzt `barrel_break`. Optional. | Nur nötig, wenn Smash im Rebuild bleibt. |
| **P3** | Nachbesserung bestehender Files (kein neues Event) | Frühere Hör-Flags, Dateien existieren: `enemy_death` (absteigender Ton im Rauschen), `barrel_break` (etwas leise, I −20), `player_hit` (dissonanter Stich, Geschmackssache). | Optional neu rendern, Namen beibehalten. |

**Nicht nachliefern müssen** (schon vollständig, drei Formate, Lizenz klar): swipe, rope_retract, rope_extend, rope_creak, sword_slash, enemy_hit, enemy_death, player_hit, barrel_break, barrel_pickup, warning, rope_cutting_loop, rope_snap, ui_click, ui_confirm, score_pickup, game_over, new_highscore, ambience_well_loop, music_calm/mid/fast. `cutTick` braucht keine Datei, wenn der Cutting-Loop läuft.

`rope_retract` ist kein Fehl-File, aber ein **fehlender Hook** im Root — im Rebuild unbedingt anbinden.

---

## 6. Technische Hinweise für den Einbau in `prototyp/`

- Basis-URL: `../audio/` (nicht `audio/`, das wäre relativ zum Prototyp-Ordner falsch).
- `loopEnd` fest: cutting 1,5 / ambience 24,0 / calm 76,8 / mid 76,8 / fast 71,111.
- iOS: Context erst in der Start-Geste `resume()` + kurzer Stille-Buffer (`AudioMgr.unlock`).
- Mute respektiert Autoplay-Unlock; Service Worker soll nur die gewählte Formatvariante cachen (Root Z. 629–631).
- Default Modern-Dateien, 8-Bit als Option. Wenn 8-Bit an: Atmo- und Cutting-Loop trotzdem als Datei.
- Keine Dateien aus anderen Spielen, kein Nachladen fremder Samples.

---

## 7. Kurz: Root-Hooks zum Abschreiben (Zeilen)

| Event | Zeile |
|---|---:|
| Krabbler warning / lunge-swipe | 1021 / 1022 |
| Ranke ausfahren → `rope_extend` | 1028 |
| Zap an → `enemy_hit` 0,4 | 1033 |
| Fledermaus warning / dive-swipe | 1058 / 1062 |
| Seilpicker start/stop cutting-loop | 1071 / 1127 / 1150 |
| Schwert | 1101 |
| Smash → `barrel_break` 0,8 | 1124 |
| Kill / Hit | 1126 / 1129 |
| Near-miss → `score_pickup` | 1133 |
| Hurt: break vs player_hit | 1141 |
| Seil reißt + game_over + Musik aus | 1151–1153 |
| Welle geschafft → `barrel_pickup` | 1194 |
| Abschnitt → `new_highscore` 0,6 | 1199 |
| Tiefe → Musik-Update; fast descend → creak | 1227–1228 |
| Snack → `barrel_pickup`; Münze → `score_pickup` | 1246–1247 |
| Highscore-Fanfare auf Over-Screen | 1608 |
| Button-Clicks confirm vs click | 1653 |
