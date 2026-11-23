## Entwicklung & Release (08:38)
- SW: eigener prototyp/sw.js scope './', Cache kagewell-proto-vN, nur eigene Caches löschen (prefix filter), fetch nur unter /kagewell/, network-first 3s, precache ../vfx/*.js ../fonts/press-start-2p.woff ../balance.json ../audio/manifest.json, Audio-Filter /^\.\.\/audio\//. Root-SW löscht fremde Caches aller Repos -> Fix nur mit Sabas OK.
- Scripts defer: vfx.js, ninja-anim.js, enemy-anim.js, game.js.
- Audio: canPlayType Format, SFX AudioBuffer, Musik gestreamt, AudioContext erst beim ersten Tap, nur music_calm initial, mid/fast lazy, nie 9.4MB precachen.
- Fonts: font-display block, await document.fonts.load('16px PS2P').
- Rendering: Canvas = css*dpr, Kunstpixel PX = max(2, floor(cssW*dpr/240)) ganzzahlig, Sprites 32-64 Kunstpixel hoch; adaptiver Fallback min(dpr,3) wenn 3 Frames >20ms; Offscreen-Caches für Wand/Licht/Nebel/Frames, ganzzahlige drawImage, kein shadowBlur/neue Gradienten/filter/Text pro Frame (Bitmap-Ziffern-Atlas), Licht per 'lighter'; Caches bei resize neu, <64MB.
- / unberührt; kein eigenes Manifest im Prototyp (oder scope './' anderer Name). Späterer Wechsel als ein Commit mit Tag v4-fallback.

## Playtest & Qualität (08:38)
Volle Abnahmeliste (40 Punkte): /workspace/barrel-ninja/qa/ABNAHME-rebuild-2026-11-23.md — verbindlich als Akzeptanzkriterien in den Cloud-Agent-Brief übernehmen.
Kern: Joystick-Anker immer sichtbar (Ring >=120, Knauf >=48 CSS px, Kontrast 3:1), Totzone 10-15%, Hysterese >=10°, Rückkehr <=150ms; Action >=64 (Ziel 72) mit Icon-Wahrheit + Swing-Cooldown-Ring, Schwert nie blockiert, 90°-Bogen ab über Kopf, Input-Puffer 100-150ms; Fass-Knopf >=56 sofort tappbar; Ersatzfass-HUD Icon+Zahl; keine Debug-Knöpfe (nur ?debug=1/Pause); HUD >=12px 4.5:1, safe-area; Multitouch per pointerId; Canvas css*dpr, ganzzahlig, kein Smoothing; Ninja >=18% Breite, Gegner >=12%; Luminanz >=60/255; p95 <=17.5ms. Testhooks: window.__BN {state,swingCd,atWall,actionIcon,actionLast,spareBarrels,joy{x,y,dir,anchor},hudRects,dpr,frameTimes}, ?seed=, ?noSpawn=1. Nach Build: Link+Commit an Playtest.

## Hooky (08:38)
Datei: /workspace/teamdoc/HOOKY-ERSTE-30-SEKUNDEN-2026-11-23.md (Design-Startwerte, keine Marktdaten).
Doc-konform übernehmbar: Titelszene lebendig mit Portal + Münzhaufen = Gesamtmünzen, nur SPIELEN-Button; Portal 2.5s erstes Mal, danach 0.6s skippbar; erste Münzspur als Bewegungs-Lehre, steigende Münz-Tonhöhe; erster Kriecher mit langem Ausholen (700ms) und kann beim 1. Mal nicht bestrafen; Fassbruch Freeze+Splitter, Fass-Knopf mit Badge; Ohnmacht als Story-Szene (Weißblende, Tara beugt sich, Münzhaufen zählt hoch <=1.2s), Nochmal nach <=2s an Action-Button-Stelle, Tap überspringt, Nochmal->Kontrolle <1.5s; kein pausierender Tutorial-Text; keine Ohnmacht vor ~20s außer klarer Fehler; Seilschneider erst ab 60m.
EXTRAS (NICHT im Doc -> nur mit Sabas OK, NICHT einbauen): "KETTE x5"-Combo, "DOPPEL +50%"-Bonus, Zeitlupe 0.6x beim ersten Gegner, Meilenstein-Banner 25m, Rekordlinie an der Wand, "NEUER REKORD"/"Noch X m bis Rekord".

## Kreativ-Studio (08:42)
Volltext: /workspace/teamdoc/ART-DIRECTION-ULTRA-RETRO-2026-11-23.md; Konzepte /workspace/teamdoc/concepts/ (kagewell-gameplay-concept.jpg, kagewell-title-concept.jpg, kiro-barrel-sample-1x.png 80x96, kiro-barrel-grid-demo.png).
Render: 390er logisches Grid, 1 AP = 1 CSS px, dprInt clamp(round(DPR),1,4), Offscreen-Prerender, no smoothing, max 280 Partikel. (Konflikt mit Entwicklung PX-Formel -> Kreativ-Variante nehmen; bei DPR 2.625 integer scale via dprInt + Canvas css*dpr, Playtest-Kriterium "ganzzahlig" beachten.)
Sprites: Kiro+Fass 80x96 (~20% Breite), Hieb 76x78 r72 2/3/2 Frames, Swing 8 Frames + 3 Geister, Krabbler 76x52 Telegraph >=450ms, Fledermaus 68x56, Seilschneider 56x68, Münze 32x32 4 Phasen, Stachelfels 52-64x44, Dornenranke 36x40. Kontur #120A1E.
Brunnen: 3 Parallax (0.5/0.75/1.0), Mondlicht, Laternen gestuft ohne Blur, Biomwechsel alle 100m (Mondlicht, Moos, Glut, Kristall).
Controls: Joystick 96 Sockel/44 Griff (Playtest will Ring >=120/Knauf >=48 -> Playtest-Mindestwerte gelten), Action 72 (Hit 88) Katana/Fass mit Cooldown-Ring, Ersatzfass-Knopf 58. HUD: Tiefe, Fässer, Münzen, Ton, Pause.
Titel: Bergwiese, Holzhaus, Steinbrunnen, Spiralportal, Glühwürmchen, Logo KAGEWELL, SPIELEN, Münzen/Besttiefe. Font Press Start 2P.
Palette: siehe Volltext.
Alu-Entscheidungen zu offenen Fragen: (1) Titel: Kiro+Tara stehen bereit, Ohnmachtsszene erst am Run-Ende (Story). (2) Nur vorhandene Fonts, kein Silkscreen. (3) Hieb an der Wand zielt automatisch in den freien Schacht. (4) Erst Partikel drosseln, bei anhaltend >22ms einmalig DPR-Fallback (wie Entwicklung).

## Sound & Musik (08:43)
Datei: /workspace/teamdoc/AUDIO-MAPPING-2026-11-23.md. Alles aus ../audio/ (ogg+m4a). Titel music_calm_loop 0.5 + ambience_well_loop leise; ui_click .5 / ui_confirm .6; score_pickup .45 rate 0.94-1.06; sword_slash .9; barrel_break .85-.9; barrel_pickup .7; rope_creak .4 cd 1400ms; Ohnmacht player_hit .9 / rope_snap .85, Musik duck x0.15-0.2 in Tara-Szene, new_highscore .8 (game_over nur Notlösung). Musik calm 0-119m, mid ab 120m, fast ab 300m, equal-power 1.8s, nur hoch, Start calm. Moderne Loops Standard (Root-Chip nicht default). rope_retract nutzen.
Fehlend -> Sound liefert nach (Alu beauftragt 08:44, Ablage /workspace/barrel-ninja/audio-new/): Fass-Schwung + Mauer-Landung, Aufwach-Klang Tara-Szene, Wiesen-Atmo, Portal-Eintritt. Nicht: Ducken/Stromfeld/Stachelfelsen.

## Game Design & Balancing (08:44)
Datei: /workspace/teamdoc/BALANCING-REBUILD-2026-11-23.md (Keys = CONFIG in prototyp/game.js, NEU markiert). Verbindliche Werte von dort übernehmen.
Kurz: scroll 60->150 px/s (acc 1.5, 60s), Portal 1200ms skippbar; Seil 520/340/360, 60% sofort, 100% nach 100ms, Stopp 80ms, sagMode B; Krabbler ab 0m (erster holt bei 2.0s aus), Fledermaus 20m, Stacheln/Ranken 30m, Seilschneider 70m max 1 (Schnitt = Ohnmacht auch mit Fass); windup max(450,600-0.5m), gap max(700,1400-2m), concurrent 1/2@40/3@150/4@300; Schwert 40/100/40ms cd 260 ab Start; Swing 520ms 60px invuln cd 1500 ab Landung, Button = Schwert während swingCd (Early-Return weg); Münzen ~alle 4m Ketten 3-5, erste bei 1.5s; Fässer 1 Start max 3, Fund >=60m nach letztem 25%/10m, Bruch 1200ms invuln + Speed x1.15; Wellen 10s/2.5s, jede 5. Rush; Nochmal nach 300ms tappbar, Tap->Kontrolle <=600ms.
§9 Entscheidungen: Fass-Knopf statt Doppeltipp, sag nur optisch (B), Schwert nur links/rechts, Hitbox 64x72, kein Dorf.
EXTRA nur mit Sabas OK, NICHT einbauen: Rekordmarke (Laterne/Kerbe an Besttiefe).

## Animation & Effekte (08:46)
Spec: /workspace/barrel-ninja/vfx/SPEC-KAGEWELL-ULTRA4K.md; Benchmarks /workspace/pwtest/ultra4k_bench*.js.
Ursachen: DPR-Cap 3 + Mini-Pixelmaps, enemy-anim.js nicht geladen, drawSword aus Fassmitte nur Keil, sagPx verschiebt nur Fass.
Render: Backbuffer css*min(DPR,Cap), adaptiver Cap 4/3/2 mit Hysterese (p90>18.5ms Partikel 60%, >20.5ms Cap runter); Prerender ImageBitmaps <=512px Kante; Glows/BG FX_DPR=min(DPR,2); kein shadowBlur, 'lighter' <=35% Fläche; Atlas ~17.8MB.
Katana: Pivot py-0.18*BH, r 1.05*BH, 40ms auf -105°, Hieb -90°->0° 90ms easeOutCubic 4-Frame-Trail #4FF0FF, 40ms recovery, Hitstop 50ms + 4px shake + Funken.
Gegner: 0.72-0.95*BH, Idle/Windup/Attack/Hit/Death, Windup an windupMs gekoppelt, keine Marker; Seilschneider vfx.ropeFray; Pflanzen via vfx.wallBreak.
Swing: Ducken 120ms, Ausholen 70ms, Flug 520ms Scheitel -0.75*BH volle Drehung 3 Afterimages, Aufprall 120ms squash + barrelHit + Staub.
Seil vfx/rope.js: optisch, 12 Seg, 120Hz, 3 Iter, Durchhang 12-24px beim Hochsteuern, oben weich abfangen.
Portal 1.8*BH 3 Ringe 28 Partikel 750ms; Münze 32px 6 Spin-Frames + Glint + Flug zum HUD 360ms; Fassbruch Dauben/Reifen/Splitter/Staub 60ms hitstop.
Budget: Logik <=1.8ms, Draw <=3.2ms, <=95 Draw-Calls, <=280 Partikel.
Alu-Entscheidungen: Stil = Kreativ-Studio Pixel-Art (scharf, ganzzahlig, Palette), NICHT Vektor; Animation liefert Timings/Rig/Effekte. (1) Cap 4 überall mit adaptivem Fallback. (2) Pivot über Kopf ok, Hitbox-Toleranz +0.28*BH ok (Hitbox Kiro bleibt 64x72 laut GD). (3) Keine Wassertropfen. (4) Modus B ja.
