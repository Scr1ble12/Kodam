# Tamil Learning App — Handoff

Working spec for a Tamil script + vocabulary learning app in the style of Kana, Benkyo and Sensei (Japanese learning apps). Paste this into any new build session as context.

- **Owner:** Aj
- **Status:** Design and planning done. No code yet.
- **Design canvas:** https://claude.ai/artifact/QmvQCfMtdryfDsbb6XuFMz (5 phone screens; private until shared)
- **Alphabet data:** `tamil_alphabet.json` / `tamil_alphabet.csv` (generated, needs native-speaker review)

---

## 1. Product summary

An app that teaches the Tamil script first, then vocabulary, with spaced repetition (SRS), tracing and short lessons. It should feel clean, minimal and frictionless, with customizable looks.

**Positioning:** Tamil is a major language (~75–85M speakers), but there are few good apps for learning it. The core audience is the diaspora (US, Canada, UK, Malaysia, Singapore, Gulf, Europe), especially **heritage learners** (people who understand some spoken Tamil but can't read it) and the parents who buy apps for their kids.

## 2. Core features (confirmed by Aj)

1. **Alphabet learner**
   - All letters with sounds
   - Drill in both directions: letter → sound and sound → letter
   - Letter tracing
   - Easy customization: pick exactly which letters to drill
2. **Vocabulary**, with the same level of customization (choose decks, build custom decks)
3. **Lessons / teaching** built into the app
4. **Clean, simple layout:** three tabs only (Alphabet · Vocabulary · Settings)
5. **Customizable look:** themes, accent color, font, letter size
6. **Streak counter**
7. **Practice reminders** (alphabet, vocab, or both)
8. **Statistics / progress page**
9. **Friendly, low-clutter help** that explains romanization marks (the dots and lines)

## 3. Screens (see the design canvas)

### Tab bar
Alphabet (அ) · Vocabulary (சொ) · Settings (gear). The tab icons are Tamil glyphs. No hamburger menu.

### Alphabet tab
- Header: "எழுத்து / Alphabet", "58 of 247 letters learned", and a **streak pill** (flame + "12 days") that opens Stats
- "Continue lesson" card (e.g., Unit 2 · The ா vowel sign)
- Segmented control: **Vowels · Consonants · Compound · Grantha**
- "Tap letters to choose what to drill" plus a **Select all** button
- 4-column letter grid. Each cell shows the letter, its romanization and a thin mastery bar. Selected cells fill with the accent color.
- Bottom: main button "Practice N letters" and a trace (pencil) button

### Letter drill (quiz)
- Close button, progress bar (7/20)
- Mode chips: **Letter → Sound · Sound → Letter · Trace**
- Large letter card with an audio button
- 4 answer options in a 2×2 grid. After answering: correct turns accent, wrong turns red, and a one-line explanation appears.
- Friendly link: **"Dots and lines confusing? See what they mean"**, which opens a bottom sheet:
  - General rules: **line on top** (ā ī ū) = hold the vowel longer; **dot below** (ṭ ṇ ḷ) = curl your tongue back; **line below** (ḻ ṟ ṉ) = sounds special to Tamil
  - "In this question" tips for the specific letters shown (changes per question)
  - "Got it" button
- Footer: "Confusable set: ழ · ள · ல · ற" and "4 in a row" (answer streak, separate from the daily streak)
- Idea: show the help link more prominently right after a wrong answer

### Vocabulary tab
- Header with the streak pill
- Today card: reviews due, new words, estimated time, "Start review"
- Lesson path: Unit 1 Greetings (done) · Unit 2 Family (next) · Unit 3 Food
- Deck list: sample word, name, progress bar, and a lock icon on paid decks
- "New custom deck" button

### Settings tab
- Live preview card that reflects every choice below
- **Reminders:** daily switch, time, day picker (M–S), focus (Both / Alphabet / Vocabulary), **Streak saver** (one extra nudge at 9 PM if you haven't practiced)
- **Appearance:** theme (Light / Paper / Dark), 5 accent swatches, Tamil font (Mukta / Noto Sans / Catamaran), letter size (S/M/L)
- **Learning:** romanization (Always / Auto-fade / Off), daily goal, spoken forms (show both)

### Stats (opened from the streak pill, not a 4th tab)
- Current and best streak, plus a 12-week practice heatmap
- Alphabet: mastered / learning / new out of 247, with a bar per category
- Vocabulary: words known, review accuracy, words added this week
- Minutes per day this week compared to the daily goal
- **Trickiest letters** (4 lowest-accuracy letters) with a "Drill these 4" button

## 4. Design system (from the canvas)

| Token | Light | Dark | Paper |
|---|---|---|---|
| Background | #F5F6F4 | #111315 | #F4F1EA |
| Surface | #FFFFFF | #1B1E21 | #FBF9F4 |
| Ink | #15171A | #ECEEF0 | #1E1B16 |
| Muted text | #5E646B | #A3A9AF | #615A50 |
| Line | #E3E5E2 | #2B2F33 | #E2DCCF |

- **Default accent:** teal #0E6B63. Options: Indigo #2F4BB5, Terracotta #B4532A, Plum #7A3E8E, Ink #15171A
- **Streak color:** text #8F3F1E on #FBEDE6
- **Font:** Mukta Malar (Tamil + Latin). Alternatives: Noto Sans Tamil, Catamaran. All are free on Google Fonts.
- **Shape:** 14–20px corner radius on cards, pill-shaped chips, thin 1px borders, no heavy shadows
- **Principles:** one main action per screen, Tamil is the visual focus, quiet progress indicators (no confetti), customization is curated rather than free-form, touch targets ≥44px, readable contrast in every theme

## 5. Learning model

### Script facts
- 12 vowels (uyir), 18 consonants (mei, shown with pulli ்), 1 āytam (ஃ), 216 compound letters (uyirmei) = **247**
- 6 Grantha letters (ஜ ஷ ஸ ஹ க்ஷ ஸ்ரீ) as an optional set
- Vowel signs attach on the left, right, both sides, or as a ligature
- **The ு/ூ column is irregular:** each consonant has its own shape, so these are memorized individually. This is the hardest part of the script.
- Hard-to-tell-apart sounds need minimal-pair drills: ல/ள/ழ, ந/ண/ன, ர/ற

### Mastery definition (proposed; Aj to confirm)
A letter is **mastered** when it has been answered correctly in **both directions**, across **several days**, and its next review is **3+ weeks** away.

| Stage | Bar | Condition |
|---|---|---|
| New | empty | Not studied yet |
| Learning | ⅓ | Answered correctly at least once |
| Familiar | ⅔ | Correct in both directions, next review 1+ week out |
| Mastered | full | Next review 3+ weeks out, last answer correct |

- A wrong answer drops a mastered letter back to Learning
- "Knew it but slowly" counts as correct, with a shorter interval
- Tracing is a bonus and doesn't block mastery
- Each compound letter is tracked separately
- The "N of 247 learned" counter counts **Mastered** only
- User-facing line: "Mastered: you've remembered it for 3 weeks straight."
- Scheduler: SM-2 or FSRS

### Other learning decisions
- Romanization: ISO 15919, with an **auto-fade** option that hides it on letters you know well
- Show **written and spoken Tamil** side by side on vocab cards (dialect still to be chosen)

## 6. Monetization

- **Free:** the entire alphabet tab, a starter vocab deck (~100–200 core words), the first 1–2 lesson units, all settings
- **Paid:** a one-time **Full Unlock** for all vocab decks and lessons (v1)
- **Later:** a subscription or add-on units once lessons are released regularly; licensing to Tamil weekend schools
- **No ads**
- Write store pages and the paywall with **parents** in mind as the buyer
- Use App Store / Play billing only. Never handle card data directly.
- Check current prices of competing apps before setting a price

## 7. Security & privacy (v1 plan)

- **Offline-first:** progress stored on the device, no accounts, no server → very low risk
- No microphone input, no social features in v1
- **Kids:** heritage learners are often under 13, so COPPA applies if data is collected. Plan: collect nothing in v1; if accounts are added later, make them parent-held.
- Still required by the app stores: privacy policy URL, data-safety form, in-app account deletion (if accounts are ever added)
- Later, if cloud sync is added: use a managed auth provider, restrict database access so each user sees only their own data, keep secret keys off the client
- Get **written consent** from voice recorders that covers commercial use
- (Not legal advice. Get a short consult before shipping anything with kids' data or payments.)

## 8. Content status

| Content | Status | Source |
|---|---|---|
| Alphabet data (247 + 6) | ✅ Generated from Unicode | Needs a native-speaker check of the romanization and sound tags |
| Letter audio | ❌ | Record a native speaker (~1 hr). Not TTS. |
| Stroke order | ❌ | Claude can draft; verify against a school primer or teacher |
| Sound tips / mark explanations | Drafted | Native review |
| Vocab decks | ❌ | Claude drafts topic lists; native review |
| Word audio | ❌ | Same recording session as the letters |
| Lessons | ❌ | Claude drafts; Aj and a reviewer check |
| Example sentences | ❌ | Most error-prone; careful review needed |

**`tamil_alphabet.json` card fields:** `id, letter, category (vowel/aytham/consonant/compound/grantha), tamil_name, romanization, components, vowel, consonant, length, sign_position, irregular, consonant_class, articulation, codepoints, audio (null), stroke_order (null), needs_review`

## 9. Division of work

- **Claude builds:** code, UI, letter data, SRS engine, quiz logic, tracing canvas, audio playback, grammar/suffix logic, infrastructure, drafts of all content
- **Aj owns:** audience choice, dialect, the native-speaker reviewer, recordings, verifying stroke order, product feel and pacing, scope decisions, testing with real learners, licensing, store accounts

## 10. Build plan

Recommended stack: **React Native + Expo** (iOS + Android from one codebase), local storage, store billing.

| Phase | Build | Aj provides |
|---|---|---|
| 0. Setup | Project skeleton, 3-tab navigation, theme tokens | Platform confirmation, app name |
| 1. Alphabet browsing | Grid from JSON, category tabs, selection | Deck corrections |
| 2. Drills | Both quiz directions, marks guide sheet | Audio (placeholders are fine at first) |
| 3. SRS + stats | Scheduler, mastery stages, streaks, Stats screen | Strictness, daily limits |
| 4. Tracing | Drawing canvas, stroke checking | Verified stroke order |
| 5. Vocabulary | Decks, custom decks, reviews | Topic list + reviewed words |
| 6. Lessons | Lesson player, first 2–3 units | Approved content |
| 7. Polish & ship | Reminders, unlock purchase, store assets | Store accounts, privacy policy |

**Working with Claude:**
- One phase per session. Open with: "We're on Phase N. Here's what works, here's what's next."
- Keep this file in the project as `SPEC.md` and update it as decisions are made
- Refer to canvas screens by name ("match the Letter drill screen")
- Report bugs as: what you tapped → what happened → what you expected, plus a screenshot
- Test on a real phone after every phase

## 11. Open decisions

- [ ] Primary audience for v1: heritage learners or complete beginners (affects onboarding; idea: ask "Can you understand spoken Tamil?")
- [ ] Spoken-Tamil dialect (Chennai, Kongu, Madurai, Sri Lankan…)
- [ ] Confirm the mastery threshold (3 weeks vs 2)
- [ ] Final accent color and default font
- [ ] Price of Full Unlock
- [ ] Platform (Expo assumed)
- [ ] Find a native-speaker reviewer and voice
- [ ] Not yet designed: onboarding flow, the tracing screen, lesson player, vocab review card
