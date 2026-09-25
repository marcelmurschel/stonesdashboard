import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import {continueRender, delayRender} from 'remotion';

// Schriften liegen lokal im Bundle (npm-Pakete), das Rendern braucht also
// kein Internet. Wir warten, bis alle Schnitte geladen sind, damit kein
// Frame mit Ersatzschrift gerendert wird.
const handle = delayRender('Schriften laden');

Promise.all([
  document.fonts.load('800 120px "Bricolage Grotesque Variable"'),
  document.fonts.load('600 120px "Bricolage Grotesque Variable"'),
  document.fonts.load('400 40px "Bricolage Grotesque Variable"'),
  document.fonts.load('500 32px "JetBrains Mono Variable"'),
  document.fonts.load('700 32px "JetBrains Mono Variable"'),
])
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error('Font loading failed', err);
    continueRender(handle);
  });
