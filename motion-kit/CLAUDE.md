# Motion-Kit – Notizen für Claude

Remotion-4-Projekt (React/TypeScript) für die Videos von Marcel Debruyker
(Data Expert · Competitive Intelligence · Brettspiel-Industrie). Sprache der Inhalte
und Kommentare: Deutsch.

## Befehle

```bash
npm run studio                    # Vorschau
npx tsc --noEmit                  # Typprüfung (muss sauber sein)
node scripts/qa-stills.mjs <Id[,Id2]> <frames|auto> [scale] [outDir]   # Standbilder zur Sichtprüfung
python3 scripts/contact-sheet.py "out/qa/<Id>-*.png" -o out/qa/sheet.png --cols 6   # braucht Pillow
node scripts/render-all.mjs [--only=Ids] [--feed] [--alpha] [--props=data/x.json]
npx remotion render <Id> out/x.mp4 --props=data/x.json
```

Cloud-Container ohne Chrome-Download: `REMOTION_CHROME_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell`
setzen (wird in `remotion.config.ts` und den Skripten ausgewertet).

## Architektur

- `src/brand/` – Tokens (`C` Farben, `F` Schriften, `PERSON`), `motion.ts` (Easing,
  `tween`, `pop`, `seeded`), `format.ts` (`useFormat()` mit Safe-Zones für 9:16 und 4:5),
  `CrocMark.tsx` (animierbare Bildmarke, Platzhalter bis die Original-CI vorliegt).
- `src/components/` – Bausteine: `Reveal`/`MarkedLine` (Text), `Odometer`, `Meeple`,
  `GameBox` (CSS-3D-Schachtel, generierte Cover), `Footage` (Clip oder Studio-Platzhalter),
  `SceneBubble` (Sprecher-Bubble oben rechts), `CaptionLayer` (Untertitel, eigene Paginierung),
  `Kit.tsx` (`Sfx`, `SafeZones`, `ScoreTrack`).
- `src/templates/` – eine Datei pro Vorlage. Jede exportiert `xxxSchema` (zod),
  `xxxDefaults` (aus `data/*-beispiel.json` per `schema.parse`) und ggf. eine Dauer.
- `src/templates/Episode.tsx` – Drehbuch-Renderer: `scenes[]` → TransitionSeries mit
  Krokodil-Blende (`TRANSITION = 22` Frames), Ton des Clips läuft durchgehend,
  Bubbles bekommen `trimStart` passend zur Szene.
- `src/Root.tsx` – registriert alle Kompositionen (IDs sind deutsch, `-Feed` = 4:5).

## Konventionen

- 30 fps. Auftritte mit `ease.out`, Abgänge kürzer mit `ease.in`, Spielfiguren mit `pop`.
- Texte nie in die Reels-UI-Zonen legen (oben 230 px, unten 470 px, rechts ab y=1000 150 px).
- Jede Datengrafik zeigt eine Quelle (`SourceChip`). Beispieldaten als solche kennzeichnen.
- Neue Inhalte als JSON in `data/`, nicht hart im Code.
- Vor dem Abschluss: `tsc`, dann Standbilder rendern und ansehen (Kontaktabzug),
  besonders Anfang, Mitte, Ende jeder Szene und beide Formate.
