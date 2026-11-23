# Kagewell – neue Sounds (Nachlieferung 23.11.2026)

Alle Klänge wurden **komplett per Code synthetisiert** (`generate_new.py`, fester Seed `20261022`
plus Namens-Hash, wie im bestehenden Paket). Keine Samples, keine fremden Aufnahmen.
Urheber: **Oruci Sabahudin**, frei verwendbar (siehe `LICENSES.md`).

Stilistisch an `/workspace/barrel-ninja/audio/` angelehnt: dieselbe In-Skala auf D
(D–Eb–G–A–Bb), dieselben Klangmodelle (Karplus-Strong-Koto, additive Flöte, Modal-/FM-Glocken,
Stick-Slip-Seil, Holz-Moden, synthetischer Hall). Das bestehende Paket in `audio/` und das
Repo wurden nicht verändert. Der Build zieht diese Dateien aus diesem Ordner.

Nicht in diesem Paket (bewusst später): Mauer-Ducken, Stromfeld, Stachelfelsen.

## Formate

| Format | Wofür | Encoding |
|---|---|---|
| `.m4a` (AAC-LC) | iOS/Safari | SFX 96 kbps mono (Transienten ggf. 128/160 kbps), Atmo 96 kbps stereo |
| `.ogg` (Vorbis) | Android/Chrome/Firefox, Web – bestes Loop-Verhalten | SFX q4 mono, Atmo q2 stereo |
| `.mp3` | Fallback | SFX 80 kbps mono, Atmo 96 kbps stereo |

44,1 kHz. SFX mono, Wiesen-Atmo stereo. Master-True-Peak ≤ −1,5 dBTP, dekodierte Dateien ≤ −1 dBFS.
Hochpass 80 Hz bei SFX (75 Hz bei Loops): Wucht über Obertöne, nicht über Subbass.
WAV-Master (24 bit) und Spektrogramme: `/workspace/barrel-ninja-sfx/new/`.

Lautheit der SFX als maximale Momentary-Loudness (M, 400 ms), Loops als Integrated (I).
Kein SFX ist lauter als `sword_slash` (M ≈ −14,7 LUFS). **Empf.** = empfohlene Lautstärke im Spiel
(0–1, als Gain/`volume`) bei Master = 1.

## Dateiliste

| Datei | Dauer | Loop | loopEnd (s) | Einsatz | LUFS | True Peak dBTP | Empf. | Größe ogg / m4a / mp3 |
|---|---|---|---|---|---|---|---|---|
| `barrel_swing_1` | 0.46 s | nein | – | Fass-Schwung Variante 1: holziger Whoosh, leichter Seilzug (kürzer) | -16.0 (M) | -3.8 | **0.65** | 8 KB / 7 KB / 5 KB |
| `barrel_swing_2` | 0.52 s | nein | – | Fass-Schwung Variante 2: holziger Whoosh, leichter Seilzug | -16.0 (M) | -4.0 | **0.65** | 8 KB / 8 KB / 6 KB |
| `barrel_swing_3` | 0.58 s | nein | – | Fass-Schwung Variante 3: holziger Whoosh, etwas mehr Seilzug (länger) | -16.0 (M) | -3.56 | **0.65** | 10 KB / 8 KB / 6 KB |
| `wall_landing_1` | 0.38 s | nein | – | Mauer-Landung Variante 1: Holz auf Stein, kürzerer Steinhall | -16.0 (M) | -1.73 | **0.8** | 7 KB / 6 KB / 4 KB |
| `wall_landing_2` | 0.46 s | nein | – | Mauer-Landung Variante 2: Holz auf Stein, etwas länger und dumpfer | -16.9 (M) | -1.5 | **0.8** | 8 KB / 9 KB / 5 KB |
| `tara_wake` | 2.15 s | nein | – | Tara-Szene: Aufwach-Stinger, In-Skala auf D, Koto + Flöte + Glocke | -16.0 (M) | -3.26 | **0.75** | 25 KB / 27 KB / 22 KB |
| `meadow_ambience_loop` | 24.00 s | ja | 24.0 | Wiesen-Atmo (Tara-Szene): Wind im Gras, dezente Zirpen (24 s Loop, stereo) | -24.0 (I) | -11.18 | **0.45** | 233 KB / 288 KB / 282 KB |
| `portal_enter` | 1.22 s | nein | – | Portal-Eintritt: mystischer Sog/Swell mit In-Skala-Obertonglitzern | -16.0 (M) | -5.39 | **0.75** | 14 KB / 16 KB / 13 KB |

## Einsatz im Rebuild

- **Barrel Swing (Start/Flug):** zufällig eine der drei Varianten `barrel_swing_1`–`3` wählen
  (oder `playbackRate` 0,96–1,05 zusätzlich). Nicht `swipe`, nicht `sword_slash`, nicht `barrel_break`.
  Beim Start des Schwungs auslösen; die Landung ist ein eigener Sound.
- **Landung an der Gegenmauer:** `wall_landing_1` oder `_2` zufällig, im Moment des Aufpralls.
  Nicht `barrel_break` (das Fass bleibt ganz).
- **Tara-Szene:** Brunnen-Atmo und Spielmusik wegducken (Musik auf ×0,15–0,20 in ~0,8 s, Atmo aus).
  `meadow_ambience_loop` einblenden, danach `tara_wake` als Stinger. `game_over` hier nicht verwenden.
- **Portal-Eintritt:** beim Start des Laufs (`Spielen`), zusammen mit dem Hochziehen der Brunnen-Atmo
  und `music_calm_loop`. Nicht nur `ui_confirm`.

## Loops nahtlos abspielen

Die Wiesen-Atmo ist zirkulär gebaut. Nicht `<audio loop>` verwenden (Lücke + AAC-Padding).
WebAudio: `loop = true`, `loopStart = 0`, **`loopEnd` explizit**:

```js
const LOOP_END = {
  meadow_ambience_loop: 24.0
};
src.loop = true; src.loopStart = 0; src.loopEnd = LOOP_END[name];
```

## Neu erzeugen

`/workspace/audio-venv/bin/python generate_new.py`

Benötigt numpy, scipy, soundfile, pyloudnorm, matplotlib und ffmpeg (libvorbis, aac, libmp3lame).
Einzelne Sounds: `python generate_new.py --only tara_wake portal_enter`.
Schreibt nach `/workspace/barrel-ninja/audio-new/` und `/workspace/barrel-ninja-sfx/new/`.
Importiert die Bausteine aus `/workspace/barrel-ninja/audio/generate.py`, verändert diese Datei nicht.

## Lizenz

Selbst synthetisiert, keine Fremdmaterialien. Urheber Oruci Sabahudin, frei verwendbar –
Details in `LICENSES.md`.
