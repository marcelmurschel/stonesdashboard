# Board Game Intelligence · Motion-Kit

Motion-Graphics-Vorlagen für datenbasierte Brettspiel-Videos auf Instagram und LinkedIn.
Du stehst vor der Kamera, das Kit kleidet deine Erkenntnisse in Grafiken, die sich wie
ein Studio-Package anfühlen: Krokodil-Blende, 3D-Spieleschachteln, Meeple-Infografiken,
Hype-Kurven, Creator-Charts.

Gebaut mit [Remotion](https://www.remotion.dev): Jede Vorlage ist React-Code, die Inhalte
kommen aus JSON-Dateien. Neue Woche, neue Zahlen → JSON anpassen → rendern. Genau das
kann Claude für dich erledigen.

> **Hinweis zur CI:** Deine Design-Guidelines lagen beim Bau nicht vor. Das Lila
> (`#5F58B1`) stammt aus deinen Reports, das Krokodil ist ein eigener Entwurf, bewusst
> aus Einzelteilen gebaut (Kiefer, Auge, Rückenschuppen als Balkendiagramm), damit es
> zuschnappen kann. Beides lässt sich an einer Stelle austauschen (siehe „Marke anpassen“).

---

## Was drin ist

| Vorlage | Wofür | Länge | Formate |
|---|---|---|---|
| **Intro** | Logo-Sting: Krokodil taucht auf, schnappt zu, Name steht | 3 s | 9:16, 4:5 |
| **Krokodil-Blende** | Signatur-Übergang zwischen zwei Szenen | 0,7 s | alle |
| **Bauchbinde** | Name, Rolle, Branche über deinem Talking Head | 5 s | 9:16, 4:5, Alpha |
| **Hook** | Die ersten Sekunden: Rubrik, Headline mit Textmarker, Datenbasis | 4 s | 9:16, 4:5, Alpha |
| **Untertitel** | Wort-für-Wort-Untertitel im Kit-Stil (aus SRT oder Whisper) | frei | 9:16, Alpha |
| **Creator-Charts** | Countdown Platz 5 → 1 mit 3D-Schachteln, danach die Liste | 16 s | 9:16, 4:5 |
| **Datenpunkt** | Eine Zahl, groß erzählt: Zählwerk + 100 Meeples (1 Meeple = 1 %) | 8 s | 9:16, 4:5 |
| **Hype-Kurve** | Zeitreihe mit Ereignissen („Video von …“) und Callout am Peak | 9 s | 9:16, 4:5 |
| **Duell** | Spiel A vs. Spiel B: Kennzahlen als Balken, Urteil | 9 s | 9:16, 4:5 |
| **Outro** | Frage + Call-to-Action, endet mit Biss | 4 s | 9:16, 4:5 |
| **Episode** | Komplettes Reel aus Szenen (Drehbuch als JSON) | ~40 s | 9:16, 4:5 |
| **Showreel** | Alle Vorlagen hintereinander | ~53 s | 9:16 |

In allen Vollbild-Grafiken bleibst du als **Sprecher-Bubble** oben rechts im Bild
(lippensynchron, wenn ein Clip hinterlegt ist). Die Person bleibt so im Zentrum.

Alle Zahlen in `data/` sind **Beispieldaten**, mit Ausnahme der AWA-Werte im
Datenpunkt (aus deiner Studie „Der Brettspielboom, den es nicht gibt“).

---

## Schnellstart

Voraussetzung: [Node.js](https://nodejs.org) ab Version 18.

```bash
cd motion-kit
npm install
npm run studio        # öffnet die Vorschau im Browser (localhost:3000)
```

Im Studio siehst du links alle Vorlagen, rechts kannst du Texte und Zahlen direkt
bearbeiten und mit **Render** exportieren.

Rendern über die Kommandozeile:

```bash
# eine Vorlage
npx remotion render Creator-Charts out/charts.mp4

# mit eigenen Daten (Felder werden über die Beispieldaten gelegt)
npx remotion render Creator-Charts out/charts-kw39.mp4 --props=data/charts-kw39.json

# alles auf einmal (9:16), optional mit 4:5-Varianten und Alpha-Overlays
npm run render:all
npm run render:all -- --feed --alpha
```

---

## Dein Workflow pro Video

1. **Aufnehmen.** Hochkant 9:16, 1080 × 1920, 30 fps. Gesicht im oberen Drittel,
   darunter ist Platz für Untertitel und Bauchbinde. Ein durchgehender Take reicht.
2. **Clip ablegen.** Datei nach `public/footage/` kopieren, z. B. `public/footage/kw39.mp4`.
3. **Daten eintragen.** Beispieldatei kopieren und Zahlen ersetzen, z. B.
   `data/charts-beispiel.json` → `data/charts-kw39.json`.
4. **Drehbuch schreiben.** `data/episode-beispiel.json` kopieren. Eine Folge ist eine Liste
   von Szenen:

   ```json
   {
     "footage": "footage/kw39.mp4",
     "captions": [],
     "scenes": [
       {"type": "intro"},
       {"type": "talk", "seconds": 8, "hook": {"lines": ["Diese 5 Spiele", "spielt gerade", "*jeder* Creator"]}, "lowerThird": true},
       {"type": "charts", "data": {"eyebrow": "Creator-Charts · KW 39", "entries": [ … ]}},
       {"type": "talk", "seconds": 4},
       {"type": "stat"},
       {"type": "outro"}
     ]
   }
   ```

   Szenen-Typen: `intro`, `talk`, `charts`, `stat`, `trend`, `versus`, `outro`.
   Was in `data` fehlt, kommt aus den Beispieldaten. Der Ton deines Clips läuft
   durchgehend, die Grafiken liegen darüber wie ein Voice-over.
5. **Rendern.**

   ```bash
   npx remotion render Episode out/kw39.mp4 --props=data/episode-kw39.json
   ```

6. **Hochladen.** Die MP4 ist H.264/AAC in 1080 × 1920, direkt für Reels und
   LinkedIn geeignet. Für den LinkedIn-Feed gibt es jede Vorlage auch als `…-Feed` (4:5).

**Textmarker:** In Headlines markierst du Wörter mit Sternchen: `"*jeder* Creator"`.

---

## Mit Claude arbeiten

Das Kit ist so gebaut, dass Claude es bedienen kann. Typische Aufträge:

- „Mach die Creator-Charts für KW 39. Hier sind die Zahlen: …“
- „Bau aus meinem Clip `kw39.mp4` eine Folge: Hook, Charts, Datenpunkt zur AWA-Studie, Outro.“
- „Neue Vorlage: Top-3 der meistgewünschten Neuheiten auf der SPIEL, im Stil der Charts.“

Claude legt die JSON-Dateien an, prüft Standbilder und rendert die MP4.
Technische Notizen für Claude stehen in [`CLAUDE.md`](CLAUDE.md).

---

## Overlays für CapCut, Premiere, DaVinci

Bauchbinde, Hook und Untertitel gibt es als transparente Videos (ProRes 4444 mit Alpha):

```bash
npm run render:all -- --alpha --only=Bauchbinde,Hook,Untertitel
```

Ergebnis: `out/bauchbinde-alpha.mov` usw. Einfach als oberste Spur über deinen Clip legen.
Einzeln geht es auch im Studio: Häkchen bei `transparent` setzen, beim Rendern
„ProRes“ + „4444“ wählen.

---

## Untertitel

Zwei Wege:

1. **SRT-Datei** (z. B. aus CapCut: *Text → Auto-Untertitel → Exportieren als SRT*, oder aus
   Premiere, Descript, Whisper). Datei nach `public/captions/` legen und in der Vorlage
   **Untertitel** das Feld `srtFile` setzen, z. B. `captions/kw39.srt`. Die Wörter werden
   automatisch einzeln hervorgehoben.
2. **Wort-Zeitmarken als JSON** (genauer, z. B. aus Whisper). Format wie in
   `data/untertitel-beispiel.json`. Mit `"pageBreakAfter": true` hinter einem Wort
   erzwingst du einen Seitenumbruch.

In einer Episode gehören Untertitel entweder global zum Clip (`captions` auf oberster
Ebene, Zeit ab Clip-Start) oder zu einer einzelnen `talk`-Szene (Zeit ab Szenenstart).

---

## Marke anpassen

| Was | Wo |
|---|---|
| Farben (CI-Lila, Akzente) | `src/brand/tokens.ts` → `C` |
| Name, Rolle, Claim | `src/brand/tokens.ts` → `PERSON` |
| Schriften | `src/brand/fonts.ts` + `F` in `tokens.ts` (Bricolage Grotesque + JetBrains Mono, beide OFL) |
| Krokodil | `src/brand/CrocMark.tsx` |
| Bewegungskurven | `src/brand/motion.ts` |
| Safe-Zones | `src/brand/format.ts` |
| Soundeffekte | `public/sfx/*.wav` (neu erzeugen: `npm run sfx`) |

**Dein Original-Krokodil einbauen:** Lege die Logo-Datei (am besten SVG mit getrennten
Ebenen für Ober- und Unterkiefer) in `public/brand/` und gib Claude Bescheid. Die
Animation bleibt gleich, nur die Formen in `CrocMark.tsx` werden ersetzt.

**Game-Cover:** Echte Cover (Pressebilder der Verlage) nach `public/covers/` legen und im
Datensatz `"cover": "covers/sky-team.jpg"` eintragen. Ohne Bild erzeugt das Kit ein
passendes Platzhalter-Cover.

---

## Safe-Zones

Reels, Stories und LinkedIn legen Bedienelemente über das Video: oben das Reels-Label,
unten Caption, Username und Audio, rechts die Buttons. Alle Vorlagen halten Texte aus
diesen Bereichen heraus. Zur Kontrolle im Studio `showSafeZones` aktivieren.

---

## Sound

Alle Soundeffekte sind selbst synthetisiert (`scripts/make-sfx.mjs`), es gibt also keine
Lizenzfragen: Whoosh, Biss, Tick, Pop, Karte, Impact, Riser, Ding, Blip. In jeder
Vorlage lässt sich der Ton mit `sfx: false` abschalten, zum Beispiel wenn du eigene Musik
darunterlegst.

---

## Lizenzen

- **Remotion** ist kostenlos für Einzelpersonen und Firmen bis 3 Mitarbeitende. Ab 4
  Mitarbeitenden braucht es eine Firmenlizenz: [remotion.pro/license](https://remotion.pro/license).
- **Schriften:** Bricolage Grotesque und JetBrains Mono, beide SIL Open Font License.
- **Sounds:** selbst erzeugt.
- **Spieletitel und Verlage** in den Beispieldaten dienen nur der Illustration; die
  Zahlen sind erfunden.

---

## Ordnerstruktur

```
motion-kit/
├── data/                 Inhalte als JSON (Beispieldaten, Drehbücher)
├── public/
│   ├── footage/          deine Talking-Head-Clips
│   ├── covers/           Cover-Bilder der Spiele
│   ├── captions/         SRT-Dateien
│   └── sfx/              Soundeffekte
├── scripts/              Render-, QA- und Sound-Skripte
└── src/
    ├── brand/            Farben, Schriften, Bewegung, Formate, Krokodil
    ├── components/       Bausteine (Zählwerk, Meeple, 3D-Schachtel, Bubble …)
    ├── transitions/      Krokodil-Blende
    ├── templates/        die Vorlagen
    └── Root.tsx          Registrierung aller Kompositionen
```
