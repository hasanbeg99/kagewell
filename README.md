# Barrel Ninja
Handyspiel-Prototyp: ein Ninja im Fass seilt sich in einen alten Brunnenschacht ab.

**Spielen:** https://hasanbeg99.github.io/kagewell/

## v4 „Abseil“ (v2-Steuerung, schneller)
Wie v2, aber flotter: Das Fass sinkt von selbst schneller (2,5 statt 1,9 m/s), Abseilen (9,5 m/s) und Klettern (4,2 m/s) sind schneller, und seitlich reagiert der Ninja etwa doppelt so schnell, mit nur leichtem Nachschwingen.

- **Abseilen statt Raster:** nach unten ziehen = schneller abseilen, nach oben = ein Stück hochklettern, loslassen = langsam weiter. Links/rechts frei, mit leichtem Pendel.
- Relative Steuerung wie ein virtueller Stick (folgt dem Finger), einhändig spielbar.
- **Tippen = Schlag** zum nächsten Gegner (sonst in Blickrichtung). Treffer-Stopp, jeder 4. Treffer der Kombo ist ein großer **SMASH**.
- Eigene Gegner: Mauerkriecher (holen sichtbar aus: glühendes Auge, Warnstreifen), Seilkrähen (stoßen herab oder picken das Seil an, also wegschlagen!), Dornenranken, Stachelfelsen, Stromfelder.
- Wellen mit Atempausen, Abschnitte alle 100 m (3 Gebiete), Tiefe = Punkte, Münzen und Reisbällchen (+1 Herz), Belohnungen für Wellen und knappe Ausweicher.
- **Laden:** Münzen gegen Outfits tauschen (wird lokal gespeichert).
- Tastatur: Pfeiltasten + Leertaste, P = Pause.

## Grafik
Moderne HD-Pixelgrafik: handgesetzte Pixel-Sprites mit Konturen, Schattierung und Dithering, immer in ganzzahligen Gerätepixeln skaliert (gestochen scharf auch bei DPR 2,625). Darüber Parallax, weiches Licht und Glühen, Partikel und Staub. Bei schwacher Hardware werden die weichen Lichtebenen automatisch abgeschaltet.

Nur die Spielidee des Abseilens ist an klassische Konsolen-Abseil-Level angelehnt. Alle Figuren, Grafiken, Namen und Klänge sind eigene.

Komplett eigenständig, keine externen Anfragen.

Schrift: „Press Start 2P“ von CodeMan38, SIL Open Font License 1.1 (siehe `fonts/OFL-PressStart2P.txt`).
