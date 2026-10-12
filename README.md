# 🐱 CAT WORLD – Das ultimative Katzen-Sammelspiel für Telegram

Ein vollständiges, spielbares und optisch liebevoll gestaltetes **Katzen-Sammelspiel als Telegram Mini App**. 

Sammle über 50 einzigartige Katzen-Skins, öffne spannende Schatztruhen, spiele Arcade-Minispiele (wie Tennis, Schach, Tic-Tac-Toe, Memory und Katzenfangen), verdiene Coins, tausche Schlüssel in Sternensplitter um und gestalte dein persönliches Katzenzimmer!

---

## 🌟 Kernfunktionen im Überblick

### 1. Das Katzensystem (52 einzigartige Skins)
* **6 Seltenheitsstufen**: Gewöhnlich (Common), Ungewöhnlich (Uncommon), Selten (Rare), Episch (Epic), Legendär (Legendary) und Mythisch (Mythic).
* **Individuelle Vektorgrafiken**: Jede Katze besitzt prozedural gerenderte Fellfarben, Augen, Muster (Tigerstreifen, Panda-Flecken, Frack, Kosmisch, Roboter) und Accessoires (Krone, Zaubererhut, Astronautenhelm, Piratenhut, Ninja-Stirnband, Ritterhelm, Brille, Fliege, Heiligenschein, Headset).
* **Visuelle Effekte**: Sternen-Orbit, Pulsierender Neon-Glow, Kristall-Schimmer, Flammen-Glut und Regenbogen-Funken für seltene Katzen.
* **Duplikat-System**: Doppelt gezogene Katzen gehen nicht verloren! Sie werden als zusätzliche Exemplare gezählt und schütten wertvolle **Sternensplitter** aus.

### 2. Kisten & transparente Gewinnchancen
* **4 Kistentypen**: Holzkiste, Blaue Kiste, Epische Kiste und Legendäre Kiste.
* **100% Mathematische Transparenz**: Drop-Wahrscheinlichkeiten sind vor dem Öffnen einsehbar und summieren sich exakt zu 100%.
* **Serverseitige Zufallsgenerierung**: Manipulationssicher auf dem Server berechnet.
* **Historie**: Protokoll der letzten Kistenöffnungen wird gespeichert.

### 3. Währungssystem & Schlüssel-Umtausch
* **Coins**: Zentrale Spielwährung, erspielbar durch Minispiele, tägliche Aufgaben und Belohnungen.
* **Schlüssel**: Holz-, Blaue, Epische und Legendäre Schlüssel zum Öffnen von Kisten oder Kaufen im Shop.
* **Sternensplitter ("Schüssel-Währung")**: Seltene Sammlerwährung, erhalten durch Duplikate oder das atomare **Schlüssel-Umtauschmenü**:
  * 1x Holzschlüssel ➔ 10 Sternensplitter
  * 1x Blauer Schlüssel ➔ 40 Sternensplitter
  * 1x Epischer Schlüssel ➔ 160 Sternensplitter
  * 1x Legendärer Schlüssel ➔ 550 Sternensplitter

### 4. Fünf spielbare Minispiele
1. **Katzen-Tennis**: Flüssiges Arcade-2D-Tennis mit Touch-/Maussteuerung, Ballphysik, Ballwechsel-Zähler und KI-Gegner.
2. **Schach**: Vollwertiges Schachspiel gegen *Großmeister Miau*, angetrieben von `chess.js` mit legalen Zugmarkierungen, Schach- und Matt-Erkennung.
3. **Tic-Tac-Toe**: 3-Gewinnt gegen eine Katzen-KI mit 3 Schwierigkeitsstufen (Leicht, Mittel, Schwer).
4. **Katzen-Memory**: 8 Paare (16 Karten) mit Katzen-Skins aufdecken und Züge zählen.
5. **Katzenfangen**: Arcade-Reaktionsspiel: Fange Fische, Milch und Sterne mit dem Katzenkorb und weiche Weckern aus!

### 5. Katzenzimmer & Personalisierung
* Deine aktive Katze thront im interaktiven Zimmer.
* **Klicke zum Streicheln**: Herzpartikel steigen auf, die Katze schnurrt mit authentischem Web-Audio-Klang!
* **Hintergrund-Themen**: Gemütliches Wohnzimmer, Sakura-Garten, Kosmischer Traum, Königssaal, Sonnenuntergang.

### 6. Profil, Aufgaben & Ranglisten
* Dauerhafte Speicherung aller Werte (Coins, Skins, Siege, Streak).
* Tägliche Aufgaben mit Belohnungs-Abholung.
* 7-Tage-Login-Serie mit steigenden Tagesbelohnungen.
* Globale Bestenlisten nach Sammlerwert, Minispiel-Siegen, Schachsiegen und Login-Serien.

---

## 🚀 Lokale Entwicklung starten

### Voraussetzungen
* Node.js $\ge$ 18.0.0
* npm

### Installation & Start
```bash
# Abhängigkeiten installieren (falls noch nicht geschehen)
npm install

# Entwicklungsserver starten (läuft auf Port 3000)
npm run dev
```

Öffne im Browser: `http://localhost:3000`

Im lokalen Entwicklungsmodus erkennt CAT WORLD automatisch, dass kein Telegram-Kontext vorliegt, und generiert eine persistente Entwickler-ID (`CW-DEV-XXXXXX`). Du kannst alle Menüs, Minispiele und Käufe uneingeschränkt testen.

---

## 🤖 Einrichtung als Telegram Mini App (@BotFather)

1. Öffne Telegram und starte den Chat mit **[@BotFather](https://t.me/BotFather)**.
2. Sende den Befehl:
   ```
   /newbot
   ```
3. Gib deinem Bot einen Namen (z. B. `Cat World Game`) und einen Benutzernamen (z. B. `MyCatWorldGame_bot`).
4. Speichere das erhaltene **Bot Token** in deiner `.env`-Datei:
   ```env
   BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRstuvwxYZ"
   ```
5. Richte die Web App ein mit dem Befehl:
   ```
   /newapp
   ```
6. Wähle deinen Bot aus, gib Titel und Beschreibung ein und lade ein Katzen-Vorschaubild hoch.
7. Gib als **Web App URL** deine deployte URL ein (z. B. deine Vercel URL oder Cloud Run URL):
   ```
   https://meine-cat-world-app.vercel.app
   ```
8. Alternativ kannst du den Menü-Button deines Bots konfigurieren:
   * Befehl: `/setmenubutton`
   * Wähle deinen Bot ➔ `Configure menu button`
   * Gib die App-URL ein und nenne den Button `🐱 Spielen`.

---

## ☁️ Deployment auf Vercel

1. **Repository auf GitHub pushen**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CAT WORLD"
   git remote add origin https://github.com/dein-user/cat-world.git
   git push -u origin main
   ```
2. **Projekt in Vercel importieren**:
   * Melde dich auf [vercel.com](https://vercel.com) an.
   * Klicke auf **"Add New Project"** und wähle dein GitHub-Repository aus.
3. **Build & Output Settings**:
   * Framework Preset: **Vite**
   * Build Command: `npm run build`
   * Output Directory: `dist`
4. **Umgebungsvariablen in Vercel eintragen**:
   * `BOT_TOKEN`: Dein Telegram Bot Token
   * `DATABASE_URL`: (Optional) PostgreSQL Verbindungs-String für Vercel Postgres / Neon / Supabase
5. Klicke auf **Deploy**. Deine Telegram Mini App ist nun live!

---

## 🗄️ Datenbankschema & Migration

CAT WORLD besitzt ein zweistufiges Speichersystem:
1. **Lokal / Container**: Automatischer, manipulationssicherer JSON-Store (`data/catworld_store.json`) mit atomaren Datei-Locks. Funktioniert sofort ohne externe Datenbank.
2. **Produktion (PostgreSQL)**: Die vollständige DDL-Datei liegt in `src/server/schema.sql` bereit für Vercel Postgres, Neon oder Supabase.

Zum Einspielen in PostgreSQL:
```bash
psql $DATABASE_URL -f src/server/schema.sql
```

---

## 🧪 Automatisierte Tests ausführen

Die Spiellogik (52 Katzen, exakte 100% Kisten-Wahrscheinlichkeiten, Schlüssel-Wechselkursformeln, Schachzüge) ist durch automatisierte Tests abgesichert:

```bash
npm test
```

Alle Tests laufen über Node.js `node:test` und prüfen:
* Vorhandensein von $\ge 50$ Katzen-Skins und eindeutige IDs.
* Exakte Summe von 100% für jede Kisten-Wahrscheinlichkeit.
* Mathematisch korrekte Schlüssel-zu-Sternensplitter Umrechnung.
* Gültige Schachzug- und Matt-Erkennung mittels `chess.js`.
