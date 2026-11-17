# Kagewell

Handyspiel-Prototyp (HTML5, offline, eine Datei + Assets). Ein Ninja hängt im Fass an einem Seil und sinkt in einen endlosen, mondbeschienenen Brunnen.

## Kern: das Knotenfass (Ein-Finger-Tipp)
- **Tippen irgendwo** knotet das Seil über dem Fass. Der Knoten hält alles auf, was herunterklettert (Kletterer, Seilschneider). Er kostet Seil: Das Fass ruckt hoch – das ist zugleich das Ausweichen vor Fledermäusen auf Fasshöhe.
- **Nochmal tippen** löst den Knoten. Alle Gestauten stürzen ab: **10 · n² Punkte** (× Combo) und Seil zurück. Ab 5 auf einmal wird eine Daube repariert.
- **Mehr als 6 am Knoten** → das Seil reißt (Game Over). Der Seilschneider zählt doppelt und sägt am Knoten – rechtzeitig lösen.
- **Knapp knoten** (Kletterer fast am Fass) gibt einen Bonus mit Hit-Stop.
- **Seil = Vorrat und Tiefe**: Absinken verbraucht Seil (Spule unten links). Leer = Game Over.
- **Leben = Dauben**: Jeder Treffer bricht eine Daube aus dem Fass, keine Herzen im HUD.
- Bleibt aus v0.3: Wellen mit Atempausen, Combo bis x5, Missionen, Rekord-Laterne, Sound, VFX, schneller Neustart, kurzes Tutorial (3 Einblendungen) beim ersten Lauf.

Balancing: `BALANCE` in `index.html` (Kommentare je Wert), Overrides per `balance.json`.
Die alte Swipe-Version ist als Tag `v0.3-barrel-ninja` gesichert.

Lokal starten: `python3 -m http.server` im Ordner, dann `http://localhost:8000/` öffnen.
