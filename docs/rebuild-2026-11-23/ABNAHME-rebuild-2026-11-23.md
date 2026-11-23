# Abnahmekriterien Rebuild Kagewell `prototyp/` (Playtest & Qualität, 23.11.2026)

Jedes Kriterium ist hart: Fällt eins durch, ist der Build nicht abnahmefähig. Spalte "Prüfung" sagt, wie ich es messe (H = Headless Playwright/CDP, S = Screenshot-Sichtprüfung, G = nur echtes Gerät).
Basis-Messwerte alter Prototyp (a40f721): Input-Latenz p50 ~15 ms, Frames p50 16,7 ms / p95 ~17 ms, Multitouch ok.

## A. Joystick (rechts unten)
| # | Kriterium | Prüfung |
|---|---|---|
| A1 | Anker im Ruhezustand IMMER sichtbar (Ring + Knauf), ab erstem Gameplay-Frame, Kontrast Anker vs. Hintergrund >= 3:1 | S + Pixelmessung |
| A2 | Ruheposition: Mittelpunkt im rechten unteren Viertel, Abstand zum Rand >= 24 CSS px + safe-area-inset | H (getBoundingClientRect / __BN) |
| A3 | Ring-Durchmesser >= 120 CSS px auf 360x640, Knauf >= 48 CSS px | H |
| A4 | Floating: Touch irgendwo in der rechten Hälfte (unterhalb HUD) setzt Anker dorthin; nach Loslassen zurück zur Ruheposition in <= 150 ms | H |
| A5 | Totzone 10–15 % des Radius (aktuell 21,8 % = Fail) | Code + H |
| A6 | 4 Richtungen in 90°-Sektoren mit Hysterese >= 10° (kein Flattern bei exakt 45°/135°/225°/315°) | H (Winkel-Sweep) |
| A7 | Knauf folgt dem Finger 1:1 bis Radius, darüber am Rand geklemmt; Finger darf aus dem Ring raus, ohne Eingabe zu verlieren | H |
| A8 | Input-Latenz Touch -> sichtbare Bewegung p50 <= 17 ms, p95 <= 34 ms | H (Latenz-Split) |

## B. Action-Button (links unten) und Icon-Wahrheit
| # | Kriterium | Prüfung |
|---|---|---|
| B1 | Größe >= 64 CSS px (Ziel 72) auf 360x640; aktuell 51,6 = Fail | H |
| B2 | Icon zeigt IMMER die Aktion, die ein Tap JETZT auslöst: Schwert, Barrel Swing (an Wand + bereit) oder gesperrt. Prüfung: in jedem Frame-Zustand Icon-State == tatsächlich ausgeführte Aktion, 0 Abweichungen über 200 Taps inkl. Taps während swingCd | H (State-Hook + Tap-Log) |
| B3 | Während swingCd an der Wand: Icon = Schwert (weil Schwert ausgeführt wird) mit sichtbarem Cooldown-Ring für den Swing; nach Ablauf wechselt Icon in <= 1 Frame auf Swing | H + S |
| B4 | Normale Schwerthiebe an der Wand während swingCd NICHT blockiert (P2 aus Report 22.11.) | H |
| B5 | Schwert-Trefferbereich = voller 90°-Bogen ab knapp über dem Kopf (aktuell ~±34° = Fail), Hitbox deckt sich mit der sichtbaren Klinge | H (Gegner an Winkelpositionen) + S |
| B6 | Tap-Feedback: sichtbarer Press-State <= 1 Frame nach touchstart | H |
| B7 | Input-Puffer 100–150 ms: Tap kurz vor Ende eines Cooldowns wird ausgeführt, nicht verschluckt | H |

## C. Fass-Knopf und Ersatzfass-Inventar
| # | Kriterium | Prüfung |
|---|---|---|
| C1 | Fass-Knopf >= 56 CSS px (aktuell 42,5 = Fail), erscheint nur bei kaputtem Fass UND Ersatzfass > 0 | H |
| C2 | Fass-Knopf ab dem ersten sichtbaren Frame tappbar (aktuell ~109 ms tot) | H |
| C3 | Ersatzfass-HUD permanent sichtbar (Icon + Zahl, auch bei 0 ausgegraut), Lesbarkeit: Schrift >= 12 CSS px, Kontrast >= 4,5:1 | S + Pixelmessung |
| C4 | Einsammeln eines Ersatzfasses: Zähler +1 im selben Frame + kurzes Feedback (Pop/Sound); Verbrauch: Zähler -1 synchron | H |
| C5 | Kein Element überlappt ein anderes Touch-Ziel; Mindestabstand zwischen Touch-Zielen >= 8 CSS px | H (Rect-Überlappung) |

## D. HUD allgemein
| # | Kriterium | Prüfung |
|---|---|---|
| D1 | Keine Debug-Knöpfe (B, HB, A/B) im Spielfeld oder HUD. A/B-Toggles nur im Pause-/Optionsmenü oder per URL-Param `?debug=1` | H (DOM + Hit-Test) + S |
| D2 | HUD zeigt Tiefe (m), Münzen, Ersatzfässer; nichts davon unter Notch / Home-Indicator (safe-area respektiert) | S auf allen Auflösungen |
| D3 | Alle HUD-Texte >= 12 CSS px, Kontrast >= 4,5:1 gegen den dunkelsten Brunnenbereich | Pixelmessung |
| D4 | HUD verdeckt keine Gegner-Spawnzone und nicht den Ninja (keine Überlappung mit Spielfigur-Rect über 60 s Bot-Lauf) | H |
| D5 | Touch-Ziele links/rechts nach Pointer-ID getrennt: gleichzeitiges Joystick + Action ohne Verlust (100/100 Kombos) | H (CDP Multitouch) |
| D6 | Kein Browser-Scroll/Zoom/Long-Press-Menü/Textauswahl im Spiel; Menüs bleiben auf 360x640 voll bedienbar (BN-011) | H |

## E. Schärfe / Rendering (DPR 1–3)
| # | Kriterium | Prüfung |
|---|---|---|
| E1 | Canvas-Backing-Store = CSS-Größe x DPR (gerundet), bei DPR 1, 2, 2,625, 3 | H |
| E2 | Pixel-Art ganzzahlig skaliert (keine Misch-Pixel-Breiten, BN-013), imageSmoothing aus für Sprites; UI-Text/Icons scharf (Kantenprüfung: keine Graustufen-Säume > 1 Gerätepixel) | Screenshot-Analyse |
| E3 | Kein "mikriger" Look: Ninja-Sprite >= 18 % der Bildschirmbreite auf 360x640, Gegner >= 12 % | H (Rects) + S |
| E4 | Szene nicht zu dunkel (BN-012): mittlere Luminanz Spielfeld >= 60/255, Ninja-Kontrast zur Umgebung >= 3:1, Gegner-Wind-up klar sichtbar | Pixelmessung |
| E5 | Performance: Frames p95 <= 17,5 ms, 0 Frames > 33 ms in 3 min Bot-Lauf (Headless, CPU-Throttle 4x als Mobil-Proxy); Speicher nach 3 min nicht > 20 % über Startwert | H + G |
| E6 | Resize/Rotation/Tab-Wechsel: Layout baut sich korrekt neu, keine verzerrten Sprites | H |

## F. Testmatrix (jeder Punkt A–E auf jeder Zeile)
| Viewport (CSS px) | DPR | Repräsentiert |
|---|---|---|
| 360x640 | 1, 2, 3 | kleines Android |
| 390x844 | 2, 3 | iPhone 12–15 |
| 412x915 | 2,625, 3 | Pixel / Galaxy |
Zusätzlich je Viewport: Hoch- und Querformat-Verhalten (Querformat: Hinweis "Bitte drehen" oder sauberes Layout).

## G. QA-Gate vor Playtest-Freigabe
- 0 Konsolenfehler/-warnungen beim Start, im Spiel und im Ohnmachts-Screen.
- Live-URL und Repo-Commit byte-identisch (Hash-Vergleich).
- Audio: Unlock beim ersten Touch auf iOS (Code-Review + G), kein Ton vor Interaktion.
- PWA/Offline: zweiter Start offline lädt vollständig (sw.js cached prototyp/ + ../audio, ../vfx, ../fonts).
- Flows: Titel -> Spiel -> Ohnmacht -> Titel, Münzen persistiert nach Reload.
- Bot-Läufe (passiv/zufällig/ausweichend) 4x180 s ohne Hänger, ohne unverschuldeten Tod.
- Screenshots aller States auf allen Matrix-Zeilen in qa/screenshots/proto-rebuild-*.

## Nur auf echtem Gerät prüfbar (nicht headless)
Haptik/Daumen-Reichweite, iOS-Audio-Unlock real, 120-Hz-Verhalten, Wärme/Akku, safe-area mit echter Notch.

## Bitte für Testbarkeit einbauen
`window.__BN` mit: state, swingCd, atWall, actionIcon, actionLast, spareBarrels, joy {x,y,dir,anchor}, hudRects, dpr, frameTimes; plus `?seed=` und `?noSpawn=1`.
