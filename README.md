# Tamil App

A Tamil script learning app for iOS and Android, built with Expo (React Native + TypeScript) from one codebase. The product spec is in [SPEC.md](SPEC.md).

## What's in this build

- **Alphabet tab**: all 247 letters plus the 6 Grantha letters (Vowels, Consonants, Compound, Grantha) with romanization and a mastery bar. Tap letters to pick what to drill.
- **My lists**: the top of the Alphabet tab. Tap New list to name a list and pick its letters, or save the current selection with the bookmark button. Tap a list to select its letters, tap it again to clear. Manage lets you practice, trace, edit or delete each list.
- **Stats**: tap the streak pill (or Settings → Your stats) for streaks, letter progress by stage and category, accuracy, your trickiest letters, minutes in the app this week, and a 12-week grid of visits.
- **Reminders**: Settings → Reminders. Pick a time, days, and optionally a list to open; plus a 9 PM streak saver on days you haven't practiced. Sent as local notifications on the phone (works in Expo Go; not on web).
- **Vocabulary tab**: 150 starter words in 10 topic decks (greetings, family, numbers, food, body, home, colours, days and time, verbs, questions). Each word shows written Tamil, the usual spoken form, romanization and an easy "say it" spelling. Turn decks on for the daily review (Today card: reviews due plus up to N new words a day, set in Settings), study any deck on its own, or build custom decks. The words are a draft and need a native speaker's review; edit them in `scripts/generate-words.py` and run it to rebuild `src/data/words.json`.
- **Letter drill**: Letter → Sound and Sound → Letter, four choices each. Look-alike letters (ல/ள/ழ, ந/ண/ன, ர/ற, short and long vowels) show up as wrong answers on purpose. A missed letter comes back three questions later. Includes the "dots and lines" guide sheet.
- **Tracing**: three steps that fade the support away (trace the letter, trace a faint outline, write from memory). It scores how much of the letter you covered and how much ink stayed on the lines, in any stroke order.
- **Spaced repetition**: each right answer on a due letter pushes its next review out (1, 3, 7, 21, 45 days); a wrong answer resets it. Stages follow the spec: New, Learning, Familiar, Mastered.
- **Settings**: theme (Light, Paper, Dark), accent colour, Tamil font (Mukta Malar, Noto Sans Tamil, Catamaran), letter size, romanization (Always, Auto-fade, Off), reset progress.
- Progress and settings are saved on the device only.

Not yet built: lessons, stroke-order animations. The audio button uses the phone's text-to-speech as a placeholder until real recordings exist.

## Run it

```bash
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone (iOS or Android), or press `w` to open it in a web browser.

If your phone can't reach the dev server because Expo picked the wrong network address, start it with your computer's IP: `REACT_NATIVE_PACKAGER_HOSTNAME=<your-ip> npx expo start`.

Typecheck: `npm run typecheck`.

## Project layout

```
src/app/            screens (Expo Router: every file is a route)
  (tabs)/           Alphabet, Vocabulary, Settings tabs
  drill.tsx         letter drill
  trace.tsx         tracing a list of letters
src/components/     TraceCanvas, TracePanel, MarksSheet, shared UI
src/data/           letters.json (base letters with hand-written sound hints), letters.extra.json (generated
                    compound and Grantha letters), generated glyph shapes,
                    tamil_alphabet.json/.csv (all 247 letters + 6 Grantha, needs native-speaker review)
src/lib/            progress and spaced repetition, tracing score, theme and settings
scripts/            generate-glyphs.py (tracing shapes from Noto Sans Tamil, SIL OFL)
                    generate-alphabet.py (full alphabet data from Unicode)
```

To change the letters, edit `src/data/letters.json` (or `scripts/generate-alphabet.py` for compound and Grantha letters), then rebuild the data and tracing shapes:

```bash
python3 -m pip install fonttools uharfbuzz
python3 scripts/generate-alphabet.py
npm run glyphs
```
