/**
 * Design-Tokens des Motion-Kits.
 *
 * Die CI-Farbe `violet` (#5F58B1) stammt aus den bisherigen Reports
 * (Influencer Monitor / Creator-Wochenbericht). Wenn deine Guidelines
 * einen anderen Lila-Ton vorgeben, reicht es, ihn hier zu ändern –
 * alle Templates ziehen ihre Farben aus diesem Objekt.
 */
export const C = {
  // Nacht-Flächen (Hintergründe, Karten)
  ink: '#100D24',
  ink2: '#181433',
  ink3: '#231E47',
  ink4: '#2F2960',

  // CI-Lila und Ableitungen
  violet: '#5F58B1',
  violetHi: '#8D86EC',
  violetDeep: '#3A3483',
  lilac: '#CBC6F6',
  mist: '#8E88B9',

  // Hell
  paper: '#F6F4FC',
  white: '#FFFFFF',

  // Signalfarben für Daten
  amber: '#FFC24B', // Hervorhebung, Platz 1, "NEU"
  mint: '#43E6A8', // Anstieg, positiv, Krokodil-Grün
  coral: '#FF6B61', // Rückgang, negativ

  // Linien
  line: 'rgba(203, 198, 246, 0.14)',
  lineStrong: 'rgba(203, 198, 246, 0.28)',
} as const;

export const F = {
  display:
    '"Bricolage Grotesque Variable", "Bricolage Grotesque", "Arial Narrow", system-ui, sans-serif',
  mono: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, "SF Mono", monospace',
} as const;

/** Wer vor der Kamera steht – Standardwerte für Bauchbinde, Intro, Outro. */
export const PERSON = {
  name: 'Marcel Debruyker',
  role: 'Data Expert · Competitive Intelligence',
  industry: 'Brettspiel-Industrie',
  tagline: 'Board Game Intelligence',
} as const;

export const FPS = 30;
