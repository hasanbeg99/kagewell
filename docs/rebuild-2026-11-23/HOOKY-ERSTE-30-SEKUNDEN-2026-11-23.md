# Kagewell: die ersten 30 Sekunden (Hooky, 23.11.2026)

Alle Zahlen sind meine Design-Startwerte und Meinung, keine Marktdaten. Grundlage: REBUILD-PLAN-2026-11-23.md und prototyp-spec.md. Kein Shop, kein Dorf, keine neuen Features außer den als optional markierten Punkten (die brauchen Sabas OK).

## Fazit
Im aktuellen Prototyp fehlt der ganze Bogen „verstehen, gewinnen, verlieren, belohnt werden, nochmal“. Für den Einstieg gebe ich ihm 3/10. Mit dem Ablauf unten halte ich 6–7/10 für realistisch.
Drei Regeln:
1. Steuerung lernt man durch Belohnung, nicht durch Text. Münzen und Gegner stehen genau dort, wo die nächste Eingabe nötig ist.
2. Der erste Sieg kommt vor der ersten Gefahr. Der erste Kill fällt nach etwa 10 s, der erste Barrel Swing nach etwa 18 s.
3. Die Ohnmacht ist eine Belohnungsszene und kein Game-Over. Danach dauert es höchstens 1,5 s bis zum nächsten Lauf.

## Ablauf Sekunde für Sekunde (erster Lauf)

### 0–4 s: Titelbildschirm (lebendig statt statisch)
- Kiro sitzt im Fass auf dem Brunnenrand, Tara hält oben das Seil. Unten im Schacht pulsiert das Spiralportal (Zyklus 1,2 s), Staubflocken fliegen, ambience_well_loop läuft leise.
- Titel „BARREL NINJA“ groß, darunter „Kagewell – Abstieg in den Brunnen“.
- Neben dem Brunnen liegt der Münzhaufen. Seine Größe richtet sich nach den Gesamtmünzen, er wächst also mit jedem Lauf sichtbar. Darunter steht die Zahl, daneben der Rekord in m. Das kostet kein Feature, es zeigt nur die vorhandene Anzeige als Bild.
- Ein einziger großer Button „SPIELEN“ pulsiert (Scale 1,0→1,06, 900 ms). Er sitzt in Daumenhöhe im unteren Drittel. Tippen schaltet den Ton frei (ui_confirm).
- Die Steuerungs-Übersicht ist kein Textblock: höchstens 3 Icons mit je 2 Wörtern, klein unter dem Button. Gelernt wird im Spiel.

### 4–7 s: Portal-Eintritt (beim ersten Mal 2,5 s, danach 0,6 s und überspringbar)
- 0,0 s: Kiro springt ins Fass, das Seil spannt sich (rope_creak), Tara nickt (2 Frames).
- 0,4 s: Die Kamera kippt nach unten und folgt dem Fass in den Schacht, das Portal kommt näher.
- 1,8 s: Durchflug durchs Portal mit Cyan-Weiß-Flash (120 ms) und kurzem Whoosh. music_calm setzt genau auf dem Flash ein.
- 2,5 s: Das Spiel läuft, die Eingabe ist ab diesem Frame aktiv. Kein „Tap to start“.

### 7–10 s: Abseilen, erste Münzspur (lernt: bewegen)
- Das Fass sinkt automatisch mit 60 px/s.
- Ghost-Hinweis: Rechts unten pulsiert der Joystick-Ring mit Daumen-Icon. Er verschwindet bei der ersten Eingabe, spätestens nach 4 s.
- Eine Spur aus 5 Münzen bildet einen sanften Bogen zur Seite. Wer sie will, muss den Stick benutzen.
- Feedback pro Münze: score_pickup mit +1 Halbton je Münze in der Kette (bricht ab bei 1,5 s Pause), „+1“-Popup, der Zähler im HUD springt kurz auf 1,15.
- Bei der 5. Münze kommt ein kleiner Sparkle-Burst und „KETTE x5“ für 600 ms. Erstes Erfolgserlebnis nach etwa 8 s.

### 10–14 s: erster Gegner (lernt: Schwert)
- Ein einzelner Mauerkriecher erscheint auf Kiros Seite in Schwertreichweite. Er holt beim ersten Mal 700 ms aus (statt 450), danach gilt das normale Timing.
- Der Action-Button pulsiert mit Schwert-Icon. Während der Ausholbewegung läuft die Welt einmalig in Zeitlupe (0,6x).
- Treffer: Hit-Stop 60 ms, Funken, enemy_death, Kriecher zerplatzt. 3 Münzen fliegen heraus und werden zu Kiro gesaugt (Magnet 300 ms). Der Kill bezahlt sich also sofort.
- Verfehlt der Spieler, beißt der Kriecher nicht zu, sondern zieht sich zurück und kommt 1,5 s später wieder. Der erste Gegner kann nicht bestrafen.

### 14–18 s: erster Barrel Swing (Power-Moment)
- Eine Münzspur führt an die Mauer. Kiro duckt sich (120 ms), der Action-Button wechselt sichtbar zum Fass-Icon: Bounce 1,0→1,2→1,0 und ein heller Chime. Das ist der wichtigste Lernmoment des ganzen Einstiegs.
- Genau jetzt fliegen 2 Fledermäuse quer durch den Schacht auf Swing-Höhe.
- Swing: Bogen nach oben, beide werden getroffen. Hit-Stop 40 ms pro Treffer, Shake 4 px, Popup „DOPPEL! +50%“ in Gold, die Münzen regnen.
- Ziel: Nach etwa 18 s hat sich der Spieler einmal richtig mächtig gefühlt.
- Nutzt der Spieler den Swing nicht, pulsiert der Button 3 s lang mit dem Fass-Icon. Danach geht es ohne Strafe weiter, beim nächsten Mauerkontakt kommt eine zweite Chance.

### 18–25 s: erste Mischung und Tiefe
- Ein Kriecher und eine Fledermaus kommen gleichzeitig, aber nie von zwei Seiten zugleich. Eine sichere Richtung ist immer in 300 ms erreichbar.
- Erste Falle: Stachelfelsen mit deutlicher Ankündigung (Staub rieselt 600 ms vorher, Fels ragt 4 px heraus).
- Tiefen-Meilenstein „25 m“: Der Banner fährt kurz über den Schacht (800 ms), das Licht wechselt eine Stufe (Mondblau wird kühler). Das zeigt Fortschritt ohne Menü.
- Optional, nur mit Sabas OK: eine dünne Rekordlinie an der Wand bei der bisherigen Bestmarke. Das ist der stärkste „knapp vorbei“-Hebel, deshalb empfehle ich sie.

### ca. 22–30 s: Fassbruch (lernt: Ersatzfass)
- Der Fassbruch sollte nicht erzwungen werden, sondern natürlich passieren. Ab 18 s steigt der Druck aber so, dass die meisten Erstspieler zwischen 20 und 40 s einmal getroffen werden.
- Beim Treffer: Freeze 100 ms, dann 0,4 s Zeitlupe, Splitter, Eisenringe fliegen, barrel_break, kurzer Weißblitz am Fass.
- Kiro hängt frei am Seil, blinkt 1200 ms (unverwundbar) und ist 15 % schneller. Danach eine kurze Schal-Animation, damit „schneller“ sichtbar ist.
- Der Fass-Knopf poppt mit Bounce und Glow neben dem Action-Button auf, mit Badge „1“. Nach 2 s ohne Druck pulsiert er.
- Anlegen: 400 ms Anlege-Animation, barrel_pickup, 1000 ms unverwundbar. Der Spieler soll denken „puh, gerettet“. Das ist ein Mini-Near-Miss.

## Ohnmacht und Szene bei Tara (das Herzstück)
Ziel: Verlieren fühlt sich an wie Ernte, und der Weg zu „Nochmal“ ist kürzer als der Gedanke ans Aufhören.

1. **Übergang (0,0–0,9 s)**: Treffer ohne Fass, dann 0,3 s Zeitlupe. Kiro sieht Sterne (kurz, kein Blut), das Seil wird schlaff, sanfter Abwärts-Sound statt hartem Game-Over. Danach Weiß-Blende über 0,6 s.
2. **Szene (0,9–2,0 s)**: Morgenlicht auf der Wiese neben dem Brunnen. Tara beugt sich besorgt über Kiro (2–3 Frames, kleiner Hüpfer, ein Herzchen- oder Schweißtropfen-Icon). Bei 1,4 s setzt sich Kiro auf und reibt sich den Kopf.
3. **Der Münzhaufen (ab 2,0 s)**: Kiro schaut zur Seite, der Haufen „ploppt“ Münze für Münze auf. Der Zähler läuft hoch, höchstens 1,2 s lang, egal wie viele Münzen. Die Ticks werden schneller, die Tonhöhe steigt, am Ende ein Kling mit Glanz.
4. **Gesamtmünzen**: Danach wandert die Lauf-Summe in die Gesamtsumme (0,5 s). Sichtbar wächst die alte Zahl auf die neue.
5. **Tiefe**: Bei Rekord gibt es den Stempel „NEUER REKORD!“ mit Shake. Sonst „Noch 12 m bis zum Rekord“. Diese Knapp-daneben-Zeile ist der wichtigste Satz auf dem Screen.
6. **Nochmal (ab spätestens 2,0 s sichtbar)**: Großer Button genau dort, wo vorher der Action-Button lag. „Titel“ ist klein daneben. Ein Tap irgendwo überspringt die Zählanimation sofort.
7. **Neustart**: Tap auf „Nochmal“ führt mit Kurz-Portal (0,6 s) direkt ins Spiel. Ziel: weniger als 1,5 s von Tap bis Kontrolle. Kein Werbe-Screen, kein Pop-up, kein „Bewerte uns“.

## Was ich streichen oder vermeiden würde
- Kein Tutorial-Text, der das Spiel pausiert. Höchstens 2-Wort-Hinweise, die von selbst verschwinden.
- Kein Start vor regungslosen Gegnern. Der erste Gegner muss sich bewegen, ausholen und sterben.
- Keine Ohnmacht vor etwa 20 s im ersten Lauf, außer durch klar eigenen Fehler. Die ersten 20 s sind eine Schutzzone mit langsamerem Ausholen.
- Seilschneider nicht im ersten Lauf vor 60 m, wie im Doc. Ein unblockbarer Seilschnitt fühlt sich am Anfang unfair an.
- Kein Interstitial nach der Ohnmacht im Prototyp. Später frühestens nach Lauf 3 und nie direkt vor „Nochmal“.

## Woran wir im Playtest messen (meine Zielwerte, nicht belegt)
- Zeit bis zur ersten Eingabe: unter 3 s nach Spielbeginn.
- Erster Kill: bei mindestens 90 % der Tester innerhalb von 15 s.
- Barrel Swing im ersten Lauf ohne Hilfe genutzt: mindestens 70 %.
- Ersatzfass nach dem ersten Bruch genutzt: mindestens 80 %.
- Zeit von Ohnmacht-Screen bis Tap auf „Nochmal“: im Median unter 4 s.
- Freiwillige zweite Runde: mindestens 80 %, dritte Runde mindestens 60 %.
- Frage an Tester nach Lauf 1: „Was macht der Fass-Knopf an der Mauer?“ Wer das nicht beantworten kann, zeigt eine Lücke im Onboarding.
