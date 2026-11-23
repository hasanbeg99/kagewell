# Barrel Ninja / Kagewell — Balancing Rebuild

Stand: 23.11.2026 (Europe/Vienna)  
Gilt für den Rebuild in `hasanbeg99/kagewell/prototyp/`.  
Keys folgen dem bestehenden `CONFIG`-Objekt in `prototyp/game.js`. Neue Keys sind mit **NEU** markiert.

**Scope:** Nur das Brunnen-Spiel laut Teamdoc (Tabs *Übersicht & Demo*, *Steuerung und Physik*, *Story*) plus Rebuild-Plan. **Kein Shop, kein Dorf, keine Ausrüstung, keine Missionen, keine Meta-Features außerhalb des Docs.**

Quellen (Vorrang bei Widerspruch: Teamdoc inkl. Kommentar-Entscheidungen, dann Rebuild-Plan, dann diese Werte):

1. Google-Doc-Snapshot `/workspace/teamdoc/last_seen.json` (22.11.2026, 23:13 Uhr Vienna)
2. `/workspace/teamdoc/REBUILD-PLAN-2026-11-23.md`
3. `/workspace/teamdoc/prototyp-spec.md` (bisherige Startwerte, 22.11. 23:16)
4. Ist-Code: `/workspace/qa-src/kagewell/prototyp/game.js` (`CONFIG`), nur zur Key-Passung gelesen, nicht verändert

---

## 0. Referenzmaß und Formeln

| Größe | Wert |
|---|---|
| Logikraum | `logicalW` 390 × `logicalH` 844 |
| Mauer `wall` | 30 px je Seite, Schacht 330 px |
| Fass-Hitbox | `barrelW` 64 × `barrelH` 72 (siehe Widerspruch W7) |
| Fahrbereich Fassoberkante | `barrelTopMin` 150 … `barrelTopMax` 700 (550 px Hub) |
| Wandkontakt für Ducken / Swing | Abstand zur Innenkante ≤ 12 px |
| Meter | `pxPerMeter` **16** (wie Live-Spiel `T.M` und aktuelles `CONFIG`) |

**Dauer bis Tiefe m** (bis `scrollMax` erreicht ist, t ≤ 60 s):

```
scrollV(t) = min(scrollMax, scroll0 + scrollAcc * t)     // px/s, t in Sekunden
depthM(t)  = (scroll0 * t + 0.5 * scrollAcc * t²) / pxPerMeter
           = 3,75·t + 0,046875·t²                         // mit den Werten aus §1
```

| t | scrollV | Tiefe | Ereignis |
|---|---:|---:|---|
| 0 s | 60 px/s | 0 m | Start nach Portal |
| 2,0 s | 63 | 7,7 m | Erster Krabbler beginnt Wind-up |
| 5,0 s | 67,5 | 19,9 m | Fledermaus ab 20 m |
| 7,3 s | 71 | 30 m | Stacheln/Ranken |
| 9,5 s | 74 | 40 m | maxConcurrent 2 |
| 15,6 s | 83 | 70 m | Seilschneider |
| 24,5 s | 97 | 120 m | Musik mid, Fledermaus-Sturzflug |
| 29,2 s | 104 | 150 m | maxConcurrent 3 |
| 49,3 s | 134 | 300 m | maxConcurrent 4, Musik fast |
| 60 s | 150 | 394 m | Sink-Tempo-Deckel |

Ein typischer erster Lauf endet eher zwischen 20 und 45 s. Die Kurve muss sich deshalb **in der ersten halben Minute** anfühlen, nicht erst bei 400 m.

---

## 1. Sinken und Scroll-Gefühl

Welt sinkt von selbst (Doc: *v4 – Fass sinkt automatisch*). Der Spieler steuert zusätzlich am Seil. Tiefe wächst immer mit `scrollV`, auch wenn man oben an der Grenze schaukelt.

| Key | Wert | Begründung |
|---|---|---|
| `scroll0` | **60** px/s | Schweres, lesbares Absinken; ~14 s für eine Bildschirmhöhe |
| `scrollAcc` | **1,5** px/s² | Nach 30 s merkt man den Zug (105 px/s), Deckel erst nach 60 s |
| `scrollMax` | **150** px/s | Dringend, aber ausweichbar (Bildschirm in ~5,6 s) |
| `portalScroll` **NEU** | **40** px/s | Etwas langsamer im Portal, dann in 400 ms auf `scroll0` gleiten |
| `portalMs` **NEU** | **1200** | Überspringbar durch jeden Tap/Klick |

Keine extra Beschleunigung ohne Fass: `breakSpeed` gilt nur für die **Spielerbewegung**, nicht für `scrollV`.

---

## 2. Seiltempo

Regel 1 und 6 aus dem Tab *Steuerung und Physik*: runter leichter als rauf, Eingabe nie verzögert.

| Key | Wert |
|---|---|
| `speedDown` | **520** px/s |
| `speedUp` | **340** px/s |
| `speedSide` | **360** px/s |
| `inputStart` | **0,6** (60 % Tempo im ersten Frame) |
| `inputFullMs` | **100** (90–100 laut Rebuild-Plan; 100 beibehalten) |
| `inputReleaseMs` | **80** (Stopp, weich, ohne Nachlauf-Rutschen) |
| `actionBufferMs` | **120** |
| `deadzone` | **12** px |
| `hysteresisDeg` | **15** |
| `joyMax` | **55** px |

Rampen-Reichweite in 300 ms (`safeMs`), Formel wie im Code `reachDist`:

```
rampPx = speed * (0,6 * ramp + 0,002 * ramp²) / 1000     // ramp = min(ms, inputFullMs)
dist   = rampPx + speed * max(0, ms - inputFullMs) / 1000
```

| Richtung | Strecke in 300 ms | Nutzen |
|---|---:|---|
| Seitlich | 101 px | Von der Mitte **nicht** ganz zur Mauer (133 px) — Fairness darf eine sichere *Richtung* verlangen, nicht immer die Gegenmauer |
| Rauf | 95 px | |
| Runter | 146 px | |

Mauer zu Mauer (266 px bei Hitbox 64): **0,76 s** seitlich. Das ist der Maßstab für den Barrel Swing (Flug 520 ms, etwas schneller als Laufen).

**Schaukeln** (nur optisch, Hitbox max. `hitboxSwayMax` 4 px) — unverändert:

| Situation | Amplitude | Periode | Halbwertszeit |
|---|---|---|---|
| Oben an der Grenze | `topSwingDeg` 6° / `topSwingPx` 12 | 900 ms | 400 ms |
| Seitlich nach Stopp | `sideSwingDeg` 4° | 1100 ms | 300 ms |
| Idle | `idleSwingDeg` 1,5° | 1600 ms | — |

**Absacken (Regel 3):** Default `sagMode: 'B'` — nur Seil + Fass-Eintauchen (`sagPx` 4, `sagMs` 60), Hitbox geht sofort hoch. Variante A (Doc: Figur sinkt einen Millimeter, dann hoch) im Pause-Menü umschaltbar, nicht im Spielfeld als Debug-Knopf.

---

## 3. Gegner-Einstiegskurve

Nur die vier Typen aus dem Auftrag und dem Rebuild-Plan: **Krabbler, Fledermaus, Seilschneider, Stacheln/Ranken**. Keine Beiß-/Spuckpflanze, kein Stromfeld in diesem Pass (Stromfelder stehen nur als Fehlstelle in der Rebuild-Checkliste, ohne Mechanik-Auftrag).

Telegraph ist **immer die Körper-Ausholbewegung**, mindestens **450 ms sichtbar**. Keine Warnmarker, kein roter Puls, kein Fortschrittsring am Seil (Oruci / Rebuild-Plan: *reiner Körper-Telegraph*).

### 3.1 Globale Angriffstaktung

```
windupMs(m)    = max(450, 600 - 0,5·m)       // 600 → 450 ab 300 m
attackGapMs(m) = max(700, 1400 - 2,0·m)      // 1400 → 700 ab 350 m
```

`CONFIG.windupMs` im Code ist aktuell fest 520. Bitte durch die Formel ersetzen; Floor bleibt 450.

| Tiefe | `windupMs` | `attackGapMs` | `maxConcurrentAttacks` |
|---|---:|---:|---:|
| 0 m | 600 | 1400 | **1** |
| 40 m | 580 | 1320 | **2** |
| 70 m | 565 | 1260 | 2 |
| 150 m | 525 | 1100 | **3** |
| 300 m | 450 | 800 | **4** |
| 350 m+ | 450 | 700 | 4 |

Seilschneider zählt für `attackGapMs` und `maxConcurrentAttacks`. Sitzende Idle-Krabbler und bereits ausgefahrene, nur noch mitscrollende Stacheln zählen **nicht**, solange sie nicht neu ausholen bzw. ausfahren.

Mindestabstand zwischen **kollidierenden Einschlägen**: `impactGapMs` **350**.

Immer eine sichere Richtung, die in `safeMs` **300** erreichbar ist (Tabelle §2). Ein Angriff, der das verletzen würde, bleibt in Idle und prüft 300 ms später erneut.

### 3.2 Einstieg, Häufigkeit, Verhalten

| Gegner | Ab | Sichtbar / Wind-up | Häufigkeit (Ziel) | Max. gleichzeitig sichtbar | Punkte |
|---|---|---|---|---|---:|
| **Krabbler** | **0 m**, erster Wind-up bei **2,0 s**, erster Stich ~2,6–3,0 s | Idle 400–1200 ms, dann `windupMs`. Stich 240 ms aus, 180 ms halten, 280 ms zurück | Bis 40 m: alle 1,8–2,4 s ein neuer Versuch, solange Slots frei | 2 bis 40 m, 3 bis 150 m, 4 danach | 10 |
| **Fledermaus** | **20 m** (~5 s) | Einflug, dann Zielen = Wind-up (`windupMs`, nie unter 450) | Bis 80 m max. 1 im Bild, danach 2, ab 200 m 3. Neuer Spawn alle 3,2 s (start) → 2,2 s | siehe links | 20 |
| **Stacheln / Ranken** | **30 m** (~7,3 s), im Fenster 25–40 m des Rebuild-Plans | Ausfahren **≥ 450 ms** (Körper wächst aus der Wand). Danach mitscrollen, nicht töten | 1 Gruppe bis 80 m, 2 Gruppen danach. Abstand zwischen Gruppen ≥ 220 px | — | — |
| **Seilschneider** | **70 m** (~15,6 s), im Fenster 60–80 m | Von der Bildoberkante sichtbar. Abstieg `descendMs` 2000 → 1500. An der Seil-Fass-Öse 200 ms sitzen, dann Scheren-Ausholen `cutWindupMs` 700 → 500 (Floor 500, also ≥ 450) | `cutterCooldownMs` **10 000** nach Kill, Abbruch oder Schnitt. **Max. 1** | 1 | 50 |

**Krabbler:** sitzt sichtbar an der Mauer. 70 % Stich nach innen, 30 % Sprung zur Gegenmauer ab **90 m** (nicht schon bei 60 m — sonst überlappt der erste Sprung mit dem ersten Schneider). Stich-Reichweite so wählen, dass die Gegenmauer plus ein 300-ms-Fluchtweg frei bleiben.

**Fledermaus:** 75 % Querflug durch den Schacht, 25 % Sturzflug auf das Fass ab **120 m**. Sturzflug nur, wenn danach noch eine sichere Richtung existiert (`hasSafeDir` wie im Prototyp).

**Stacheln (Felsen) und Ranken** sind zwei Optiken derselben Falle: nicht zerstörbar, ragen aus der Wand, wandern mit der Welt nach oben. Ab **180 m** mit 30 % Chance Länge 2 (bis in die Schachtmitte, nie beide Mauern gleichzeitig, nie den letzten 300-ms-Fluchtweg zu). Ranken dürfen sich während des Ausfahrens noch optisch „ranken“, danach starr.

**Seilschneider (sofort Ohnmacht, auch mit intaktem Fass — Story + Rebuild-Plan):** klettert das Seil hinab und setzt sich **24–32 px seitlich** der Seilachse an die Öse, damit der 90°-Schwerthieb (ab über dem Kopf zur Seite) ihn erreicht. Verwundbar ab Erreichen der Schwertreichweite (`swordR`) und während des kompletten Scheren-Ausholens. Ein Barrel Swing trifft ihn nur, wenn die Flug-Hitbox die Öse streift. Nach einem Kill 1 s lang keine neue Bedrohung direkt an der Öse spawnen.

### 3.3 Spawn-Gewichte nach Tiefenband

Gewichte gelten für neue **Angriffs- bzw. Fallen-Slots**, nicht fürs Füllen der ganzen Wand.

| ab m | Krabbler | Stacheln/Ranken | Fledermaus | Seilschneider |
|---:|---:|---:|---:|---:|
| 0 | 100 | 0 | 0 | 0 |
| 20 | 70 | 0 | 30 | 0 |
| 30 | 55 | 20 | 25 | 0 |
| 70 | 42 | 18 | 28 | 12 |
| 150 | 38 | 20 | 30 | 12 |
| 300 | 34 | 22 | 32 | 12 |

---

## 4. Schwert-Cooldown und Barrel Swing an der Mauer

Werte aus Prototyp-Spec / Rebuild-Plan bleiben, aber die **Reihenfolge an der Mauer** muss anders laufen als im aktuellen Prototyp (dort bricht `tryAction` bei `swingCd > 0` ab, ohne aufs Schwert zu fallen — das darf nicht bleiben).

### Schwert

| Key | Wert | Hinweis |
|---|---|---|
| Bogen | 90°, knapp über dem Kopf bis waagerecht, nur links **oder** rechts | Joystick wählt die Seite bzw. den Bogen; Stick neutral/vertikal: letzte Seite, sonst Seite des nächsten Gegners |
| `swordR` | **72** px ab Fassmitte | |
| `swordH` | **±40** px | |
| `swordWindup` / `swordActive` / `swordRecover` | 40 / 100 / 40 ms | zusammen 180 ms |
| `swordSweepMs` | 90 | sichtbarer Bogen |
| `swordCd` | **260** ms **ab Angriffsstart** | nächster Hieb nach 260 ms, also 80 ms Pause nach Recover. Kein Dauerfeuer. Puffer 120 ms, Eingaben im Hit-Stop puffern |

### Barrel Swing

| Key | Wert | Hinweis |
|---|---|---|
| Auslöser | Fass intakt, Wandabstand ≤ 12 px, `swingCd === 0` | Ducken 120 ms (`duckMs`), sobald man die Mauer berührt — nicht erst beim Tap |
| `swingWindup` | 70 ms | |
| `swingMs` | **520** ms Flug | leichter Bogen nach oben, Scheitel `swingArc` **60** px |
| `swingPad` | 10 px | Hitbox = Fass + 10, trifft alle Gegner auf dem Weg |
| Unverwundbar | während Ausholen + Flug (≈ 590 ms) | |
| `swingCd` | **1500** ms **ab Landung** | Füllring am Button |
| Kette | an der Gegenmauer wieder geduckt | nächster Swing erst nach Ablauf von `swingCd` |
| Punkte | jeder weitere Kill im **selben** Swing +50 % (`1.5^n` auf `killPoints` der Folge-Kills, wie jetzt) | |

**Regel an der Mauer während `swingCd` (Muss):** Action-Button zeigt **Schwert**, nicht Fass. Ein Tap führt einen normalen Schwerthieb aus. Swing erst wieder, wenn `swingCd === 0` und das Fass noch intakt ist. Icon und Aktion dürfen sich nie widersprechen.

---

## 5. Münzdichte

Münzen sind im Story-Tab der sichtbare Schatz und liegen am Ende als Haufen neben Kiro. Sie werden persistent als Gesamtmünzen gespeichert und auf Titel- und Ohnmachtsscreen gezeigt. Es gibt **nichts zu kaufen**.

| Key | Wert |
|---|---|
| `coinAvgEveryM` **NEU** | **4** m (ein Stück im Schnitt, in Ketten gebündelt) |
| `coinChainMin` / `coinChainMax` **NEU** | **3** / **5** |
| `coinPoints` **NEU** | **10** |
| Erste Kette | bei **1,5 s** bzw. ~5 m, schon während der ersten Meter nach dem Portal |
| Platzierung | nur auf sicheren Bahnen (kein Zwang, durch eine aktive Falle zu fliegen) |
| In der Atempause | eine etwas dichtere Kette (5er) als Belohnung |
| In der Rush-Welle | eher spärlich, als Leitlinie durch die sichere Gasse |

Erwartwert: bei 100 m ≈ 25 Münzen, bei einem 30-s-Lauf (~155 m) ≈ 35–40, plus gelegentliche Tropfen (45 % Chance, 1 Münze) beim Kill.

---

## 6. Ersatzfässer

Team-Entscheidung (Kommentar `doco.30gXSd1N7MSnSlMZRB1ZWQ`, von Dzeko akzeptiert): **eigener Fass-Knopf**, nur sichtbar wenn Fass kaputt **und** mindestens 1 Ersatz im Inventar. Kein Doppeltipp auf den Joystick.

| Key | Wert |
|---|---|
| Start | 1 intaktes Fass + `spareStart` **1** Ersatz |
| `spareMax` | **3** |
| `breakInvuln` | **1200** ms |
| `breakSpeed` | **1,15** (nur Bewegung, +15 %) |
| `equipMs` | **400** |
| `equipInvuln` | **1000** |
| `pickupGapM` | **60** nach dem letzten Fund (Startwert `lastPickupM = 0` → erste Chance ab 60 m) |
| `pickupEveryM` | **10** |
| `pickupChance` | **0,25** |

Erwarteter erster Fund um **100 m** (60 m Pause + im Schnitt 40 m bei 25 % / 10 m). HUD muss Ersatzfässer **immer** zeigen (auch 0), Pickup braucht den bestehenden `barrel_pickup`-Sound.

Erster Treffer mit Fass: Fass zerbricht, kurze Unverwundbarkeit, Kiro hängt frei am Seil und ist wendiger. Treffer ohne Fass **oder** Seilschnitt: Ohnmacht (kein Tod, kein Blut).

---

## 7. „Noch eine Runde“-Flow

Nur mit Elementen, die das Teamdoc bzw. der Rebuild-Plan schon verlangt: Titelscreen, Portal, Münzen, Gegner, Ohnmacht bei Tara mit Münzhaufen, Bestwert/Tiefe, Button **Nochmal**. Nichts aus Shop oder Dorf.

### Ablauf

1. **Titelscreen:** Titel Barrel Ninja, Untertitel *Kagewell – Abstieg in den Brunnen*. Kurze Bildgeschichte (Kiro, Brunnen, Spiralportal, Tara am Seil). 3–4 Steuerungszeilen. Gesamtmünzen und **Besttiefe / Bestpunkte** sichtbar. Ein Tap auf Spielen (Audio-Unlock).
2. **Portal** 1,2 s, überspringbar, `portalScroll` 40 px/s, dann auf 60 gleiten.
3. **Erste 3 Sekunden:** Münzkette ab 1,5 s, erster Krabbler holt ab 2,0 s sichtbar aus, erster Stich gegen 2,6–3,0 s. Nie wieder ein leerer Start von ~7 s.
4. **Wellen** (keine neuen Feature-Systeme, nur Spawn-Rhythmus):

| | Druck | Pause |
|---|---|---|
| Spanne | 8–14 s | 2–3 s |
| typisch | **10 s** | **2,5 s** |
| jede 5. Welle (Rush) | **14 s**, `maxConcurrentAttacks` vorübergehend +1 (Deckel 4), keine neuen Typen | **2 s** |

Welle 1 ist bewusst einfach: nur Krabbler, ein Angriff zur Zeit, `windupMs` 600.

5. **Rekordmarke:** Die im Doc geforderte Besttiefe wird **im Schacht** gezeigt — eine von den normalen Wandlaternen optisch abgesetzte Marke (Laterne oder Kerbe) auf der Tiefe des persönlichen Bestwerts. Sie ist ein Bestwert-Hinweis, kein Warnmarker und kein Meta-Feature. Zusätzlich Bestwert auf Titel und Ohnmachtsscreen. Bei neuem Rekord: bestehender Sound `new_highscore`.
6. **Ohnmacht:** Wiese, Tara beugt sich besorgt, Münzhaufen der **dieser Runde**, dazu Gesamtmünzen, Tiefe, Punkte, Buttons **Nochmal** und **Titel**.
7. **Neustart unter 1 s:** Button **Nochmal** ist nach **300 ms** tappable (Szene darf weiterlaufen, kein Sperrfenster von 1,1 s). Vom Tap bis zur steuerbaren Runde **≤ 600 ms** (kurzer Portalblitz erlaubt). Kein erzwungenes Minimum darüber. Zwischen zwei Läufen `G`-Zustände vollständig zurücksetzen (kein Übertrag von Combos, Wellen, `chainGot` o. Ä.).

### Leichte Punkte (Gameplayscore, kein Meta)

| Key | Wert |
|---|---|
| `pointsPerMeter` **NEU** | **10** |
| `killPoints` | Basis 100 nur für den Swing-Zuschlag im aktuellen Code; **pro Typ gelten die Punkte aus §3.2** (10 / 20 / 50). Bitte `killPoints` als Fallback lassen, typisierte Werte bevorzugen |
| Swing-Multikill | +50 % je weiterem Kill im selben Swing |
| `noBarrelScoreMult` **NEU** | **1,5** auf Kill- und Tiefenpunkte, solange das Fass kaputt ist (Risiko) |
| Combo **NEU** | Fenster **2000** ms, +0,25 je Kill, max **×2**, nur auf Kill-Punkte, Reset bei Treffer |

Musik (Assets liegen schon da, Tiefen wie im Root-Spiel): `music_calm` ab Start, `music_mid` ab **120 m**, `music_fast` ab **300 m**. Optional (Kann): bei zerbrochenem Fass mindestens auf mid heben.

---

## 8. Fairness — Kurzcheck für den Spawner

1. Wind-up ≥ 450 ms und wirklich sichtbar (nicht offscreen, nicht hinter der Mauer).
2. Immer eine Richtung, die in 300 ms frei ist (`reachDist` + `SAFE`).
3. 350 ms zwischen kollidierenden Einschlägen.
4. Seilschneider max. 1, respektiert `attackGapMs` und `maxConcurrentAttacks`, kein Bypass wie im alten `spawnCutter`.
5. Stacheln/Ranken blockieren nie beide Fluchtseiten und nicht die Schwertseite, solange ein Seilschneider an der Öse verwundbar ist.
6. Eingabe im selben Pointer-Frame; Hit-Stop 40 ms nur bei Treffer, dabei puffern.

---

## 9. Liste der Doc- / Code-Widersprüche

Bei jedem Punkt gilt die hier genannte Entscheidung.

| # | Widerspruch | Entscheidung |
|---|---|---|
| W1 | Tab *Steuerung*: Fass per **Doppeltipp auf den Joystick**. Team-Kommentar `doco.30gXSd1N7MSnSlMZRB1ZWQ` (Dzeko: akzeptiert): eigener Fass-Knopf. | **Fass-Knopf**, nur bei kaputtem Fass und Ersatz > 0. |
| W2 | Regel 3 (beim Hochsteuern erst ein winziges Stück runter) widerspricht Regel 6 (keine Input-Verzögerung). Kommentar `doco.DHd8usBt_rWHFiEX_Gmw6A`: im Prototyp testen. | Default **Variante B** (nur optisch). Variante A im Pause-Menü. |
| W3 | Erster Steuerungsabsatz klingt nach Hieb in jede Stick-Richtung; Abschnitt Physik sagt nur links/rechts, 90°. Dzeko: Bogen wird beschrieben, Richtung bleibt seitlich. | **Nur links/rechts.** |
| W4 | Story enthält Dorf, Ausrüstungskauf, weitere Abenteurer. Kommentar `doco.ZwdaFrszfBDLZ-kKip94Yw` (Dzeko: einverstanden): erst Brunnen-Spiel, Dorf danach. | **Kein Shop, kein Dorf** in diesem Balancing. Münzen werden trotzdem gespeichert. |
| W5 | `prototyp-spec` spricht Pickup in Metern, ohne `px/m`. Code und Live-Spiel nutzen **16**. Bei 84 px/m (altes „1 Bildschirm = 10 m“) kämen Stacheln erst nach ~35–50 s — zu spät für den 30-s-Hook, und außerhalb des Rebuild-Fensters 25–40 m / 60–80 m. | **`pxPerMeter = 16` fest.** |
| W6 | Alte v0.2-Spec (3×3-Wisch, diagonale Swipes, Beißpflanze, 4-Minuten-Lauf bis 400 m) passt nicht zu v4 (Joystick, freies Seil, automatisches Sinken). | v0.2 nur als Ideenquelle. Zeiten und Einstiege sind auf **60-s-Arcade-Läufe** neu gelegt. |
| W7 | Rebuild-Plan will Fass-Art ~76×86 CSS-px; Balancing und `CONFIG` sind auf Hitbox **64×72** kalibriert. | **Hitbox bleibt 64×72.** Die Grafik darf größer sein. Falls die Logik-Hitbox doch auf 76×86 geht: `swordR` auf 80, Zeiten (ms) und px/s **nicht** ändern. |
| W8 | Aktueller Prototyp: `tryAction` an der Mauer bei `swingCd > 0` bricht ab (weder Swing noch Schwert). Rebuild-Plan verlangt Schwert während des Cooldowns. | **Schwert ist während `swingCd` erlaubt**, Button zeigt Schwert. |
| W9 | Aktueller Prototyp spawnt zwei Vögel mit 8 s Zielzeit und hat keine Fallen, keine Münzen, keinen Titelscreen, keinen Ohnmacht-Story-Screen. | Durch dieses Dokument ersetzt. Erster Feind bei 2 s, nicht 7–8 s. |
| W10 | Alte Seilschneider-Tötung („Wisch nach oben“) gibt es in v4 nicht (Schwert nur seitlich). | Schneider sitzt seitlich an der Öse, töbar mit 90°-Hieb oder Swing-Hitbox. |

---

## 10. JSON (alle Werte, Keys passend zum Code)

```json
{
  "_version": "rebuild-2026-11-23",
  "_pxPerMeter": 16,
  "_note": "Keys ohne NEU existieren in prototyp/game.js CONFIG. NEU-Keys ergänzen. Shop/Dorf nicht enthalten.",

  "logicalW": 390,
  "logicalH": 844,
  "wall": 30,
  "barrelW": 64,
  "barrelH": 72,
  "barrelTopMin": 150,
  "barrelTopMax": 700,
  "pxPerMeter": 16,
  "wallContactPx": 12,

  "inputStart": 0.6,
  "inputFullMs": 100,
  "inputReleaseMs": 80,
  "actionBufferMs": 120,
  "deadzone": 12,
  "hysteresisDeg": 15,
  "joyMax": 55,

  "speedDown": 520,
  "speedUp": 340,
  "speedSide": 360,

  "scroll0": 60,
  "scrollAcc": 1.5,
  "scrollMax": 150,
  "portalMs": 1200,
  "portalScroll": 40,
  "portalLerpToScroll0Ms": 400,

  "hitboxSwayMax": 4,
  "topSwingDeg": 6,
  "topSwingPx": 12,
  "topSwingPeriod": 900,
  "topSwingHalf": 400,
  "sideSwingDeg": 4,
  "sideSwingPeriod": 1100,
  "sideSwingHalf": 300,
  "idleSwingDeg": 1.5,
  "idleSwingPeriod": 1600,
  "sagPx": 4,
  "sagMs": 60,
  "sagMode": "B",

  "swordR": 72,
  "swordH": 40,
  "swordWindup": 40,
  "swordActive": 100,
  "swordRecover": 40,
  "swordSweepMs": 90,
  "swordCd": 260,
  "swordCdFrom": "attackStart",

  "duckMs": 120,
  "swingWindup": 70,
  "swingMs": 520,
  "swingArc": 60,
  "swingPad": 10,
  "swingCd": 1500,
  "swingCdFrom": "landing",
  "swingShake": 4,
  "hitStopMs": 40,
  "swingInvulnDuringFlight": true,
  "swingChainKillMult": 1.5,
  "swordAllowedDuringSwingCd": true,
  "swingCdShowsSword": true,

  "spareStart": 1,
  "spareMax": 3,
  "breakInvuln": 1200,
  "breakSpeed": 1.15,
  "equipMs": 400,
  "equipInvuln": 1000,
  "pickupGapM": 60,
  "pickupEveryM": 10,
  "pickupChance": 0.25,

  "safeMs": 300,
  "minWindupMs": 450,
  "impactGapMs": 350,
  "windupMs": { "start": 600, "perMeter": -0.5, "min": 450, "_formula": "max(min, start + perMeter * m)" },
  "attackGapMs": { "start": 1400, "perMeter": -2.0, "min": 700, "_formula": "max(min, start + perMeter * m)" },
  "maxConcurrentAttacks": [
    { "fromM": 0, "value": 1 },
    { "fromM": 40, "value": 2 },
    { "fromM": 150, "value": 3 },
    { "fromM": 300, "value": 4 }
  ],

  "firstCoinAtMs": 1500,
  "firstEnemyWindupAtMs": 2000,
  "waveActiveMinMs": 8000,
  "waveActiveMaxMs": 14000,
  "waveActiveTypicalMs": 10000,
  "wavePauseMinMs": 2000,
  "wavePauseMaxMs": 3000,
  "wavePauseTypicalMs": 2500,
  "rushEvery": 5,
  "rushActiveMs": 14000,
  "rushPauseMs": 2000,
  "rushConcurrentBonus": 1,

  "faintButtonMs": 300,
  "restartToPlayMaxMs": 600,
  "recordMarker": true,

  "coinAvgEveryM": 4,
  "coinChainMin": 3,
  "coinChainMax": 5,
  "coinPoints": 10,
  "coinDropOnKillChance": 0.45,

  "pointsPerMeter": 10,
  "noBarrelScoreMult": 1.5,
  "combo": { "windowMs": 2000, "stepMult": 0.25, "maxMult": 2.0, "appliesTo": "kills", "resetOnHit": true },
  "musicTiersM": { "mid": 120, "fast": 300 },

  "enemies": {
    "krabbler": {
      "kind": "creep",
      "fromM": 0,
      "hp": 1,
      "points": 10,
      "idleMs": [400, 1200],
      "lungeMs": 240,
      "holdMs": 180,
      "backMs": 280,
      "attacks": {
        "jab": { "weight": 70 },
        "leap": { "weight": 30, "fromM": 90 }
      },
      "maxVisible": [
        { "fromM": 0, "value": 2 },
        { "fromM": 40, "value": 3 },
        { "fromM": 150, "value": 4 }
      ]
    },
    "fledermaus": {
      "kind": "bird",
      "fromM": 20,
      "hp": 1,
      "points": 20,
      "attacks": {
        "cross": { "weight": 75 },
        "swoop": { "weight": 25, "fromM": 120 }
      },
      "spawnIntervalMs": { "start": 3200, "min": 2200 },
      "maxVisible": [
        { "fromM": 20, "value": 1 },
        { "fromM": 80, "value": 2 },
        { "fromM": 200, "value": 3 }
      ]
    },
    "stachelnRanken": {
      "kind": "hazard",
      "fromM": 30,
      "killable": false,
      "extendMsMin": 450,
      "scrollsWithLevel": true,
      "variants": ["stachelfelsen", "dornenranken"],
      "length2": { "fromM": 180, "chance": 0.3 },
      "groupGapPx": 220,
      "maxGroups": [
        { "fromM": 30, "value": 1 },
        { "fromM": 80, "value": 2 }
      ]
    },
    "seilschneider": {
      "kind": "cutter",
      "fromM": 70,
      "hp": 1,
      "points": 50,
      "maxConcurrent": 1,
      "countsForAttackGap": true,
      "countsForMaxConcurrent": true,
      "instantFaintEvenWithBarrel": true,
      "offsetFromRopePx": [24, 32],
      "descendMs": { "start": 2000, "min": 1500 },
      "perchMs": 200,
      "cutWindupMs": { "start": 700, "min": 500 },
      "cooldownMs": 10000,
      "vulnerableOnceInSwordRange": true,
      "noNewThreatAtKnotMsAfterKill": 1000
    }
  },

  "spawnWeights": [
    { "fromM": 0,  "krabbler": 100, "stachelnRanken": 0,  "fledermaus": 0,  "seilschneider": 0 },
    { "fromM": 20, "krabbler": 70,  "stachelnRanken": 0,  "fledermaus": 30, "seilschneider": 0 },
    { "fromM": 30, "krabbler": 55,  "stachelnRanken": 20, "fledermaus": 25, "seilschneider": 0 },
    { "fromM": 70, "krabbler": 42,  "stachelnRanken": 18, "fledermaus": 28, "seilschneider": 12 },
    { "fromM": 150,"krabbler": 38,  "stachelnRanken": 20, "fledermaus": 30, "seilschneider": 12 },
    { "fromM": 300,"krabbler": 34,  "stachelnRanken": 22, "fledermaus": 32, "seilschneider": 12 }
  ]
}
```

Diese Werte sind der Start für den ersten Playtest des Rebuilds. Nach Testdaten (vor allem: Zeit bis zum ersten Tod, Gefühl von `swingCd` 1500, Lesbarkeit des Schneiders) eng nachziehen, nicht vorher auf Verdacht.
