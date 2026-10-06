# Tamil App

A Tamil script learning app for iOS and Android, built with Expo (React Native + TypeScript) from one codebase. The product spec is in [SPEC.md](SPEC.md).

## What's in this build

- **Alphabet tab**: the 12 vowels, āytam (ஃ) and 18 consonants in a 4-column grid with romanization and a mastery bar. Tap letters to pick what to drill.
- **Letter drill**: Letter → Sound and Sound → Letter, four choices each. Look-alike letters (ல/ள/ழ, ந/ண/ன, ர/ற, short and long vowels) show up as wrong answers on purpose. A missed letter comes back three questions later. Includes the "dots and lines" guide sheet.
- **Tracing**: three steps that fade the support away (trace the letter, trace a faint outline, write from memory). It scores how much of the letter you covered and how much ink stayed on the lines, in any stroke order.
- **Spaced repetition**: each right answer on a due letter pushes its next review out (1, 3, 7, 21, 45 days); a wrong answer resets it. Stages follow the spec: New, Learning, Familiar, Mastered.
- **Settings**: theme (Light, Paper, Dark), accent colour, Tamil font (Mukta Malar, Noto Sans Tamil, Catamaran), letter size, romanization (Always, Auto-fade, Off), reset progress.
- Progress and settings are saved on the device only.

Not yet built: Vocabulary (placeholder tab), Stats screen, reminders, compound and Grantha letters, stroke-order animations. The audio button uses the phone's text-to-speech as a placeholder until real recordings exist.

## Run it

```bash
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone (iOS or Android), or press `w` to open it in a web browser.

Typecheck: `npm run typecheck`.

## Project layout

```
src/app/            screens (Expo Router: every file is a route)
  (tabs)/           Alphabet, Vocabulary, Settings tabs
  drill.tsx         letter drill
  trace.tsx         tracing a list of letters
src/components/     TraceCanvas, TracePanel, MarksSheet, shared UI
src/data/           letters.json (letters, romanization, sound hints) and generated glyph shapes
src/lib/            progress and spaced repetition, tracing score, theme and settings
scripts/            generate-glyphs.py (builds tracing shapes from Noto Sans Tamil, SIL OFL)
```

To change the letters, edit `src/data/letters.json`, then rebuild the tracing shapes:

```bash
python3 -m pip install fonttools uharfbuzz
npm run glyphs
```
