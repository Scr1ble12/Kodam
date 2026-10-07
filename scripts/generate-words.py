"""Builds src/data/words.json, the starter vocabulary decks.

Each word is (written Tamil, spoken Tamil or None if it's said as written, English, optional note).
Spoken forms follow common Chennai-style colloquial Tamil. Romanization (ISO 15919) is generated
from the Tamil script so it can't drift from the spelling.

DRAFT CONTENT: a native speaker should review every word before release.

    python3 scripts/generate-words.py
"""

import json
import re
import unicodedata
from pathlib import Path

DECKS = [
    ("greetings", "Greetings", "வாழ்த்துகள்", [
        ("வணக்கம்", None, "hello", "Works for hello and goodbye, any time of day."),
        ("நன்றி", None, "thank you", None),
        ("ஆமாம்", "ஆமா", "yes", None),
        ("இல்லை", "இல்ல", "no", "Also means \"there isn't\"."),
        ("சரி", None, "okay", None),
        ("தயவுசெய்து", None, "please", "Formal. In speech people often just say the request politely."),
        ("மன்னிக்கவும்", "மன்னிச்சுக்கோங்க", "sorry / excuse me", None),
        ("போய் வருகிறேன்", "போயிட்டு வரேன்", "goodbye", "Literally \"I'll go and come back\"."),
        ("எப்படி இருக்கிறீர்கள்?", "எப்படி இருக்கீங்க?", "how are you?", None),
        ("நான் நன்றாக இருக்கிறேன்", "நான் நல்லா இருக்கேன்", "I'm fine", None),
        ("உங்கள் பெயர் என்ன?", "உங்க பேரு என்ன?", "what's your name?", None),
        ("என் பெயர்", "என் பேரு", "my name is", None),
        ("வாருங்கள்", "வாங்க", "come in / welcome", None),
        ("பரவாயில்லை", "பரவால்ல", "it's okay / no problem", None),
        ("நல்லது", None, "good", None),
    ]),
    ("family", "Family", "குடும்பம்", [
        ("அம்மா", None, "mother", None),
        ("அப்பா", None, "father", None),
        ("அண்ணன்", None, "older brother", "Call him அண்ணா."),
        ("அக்கா", None, "older sister", None),
        ("தம்பி", None, "younger brother", None),
        ("தங்கை", "தங்கச்சி", "younger sister", None),
        ("தாத்தா", None, "grandfather", None),
        ("பாட்டி", None, "grandmother", None),
        ("மகன்", None, "son", None),
        ("மகள்", None, "daughter", None),
        ("கணவர்", None, "husband", None),
        ("மனைவி", None, "wife", None),
        ("குழந்தை", "கொழந்த", "child / baby", None),
        ("மாமா", None, "uncle", "Your mother's brother, and a friendly word for older men."),
        ("அத்தை", None, "aunt", "Your father's sister."),
    ]),
    ("numbers", "Numbers", "எண்கள்", [
        ("ஒன்று", "ஒண்ணு", "one", None),
        ("இரண்டு", "ரெண்டு", "two", None),
        ("மூன்று", "மூணு", "three", None),
        ("நான்கு", "நாலு", "four", None),
        ("ஐந்து", "அஞ்சு", "five", None),
        ("ஆறு", None, "six", None),
        ("ஏழு", None, "seven", None),
        ("எட்டு", None, "eight", None),
        ("ஒன்பது", None, "nine", None),
        ("பத்து", None, "ten", None),
        ("பதினொன்று", "பதினொண்ணு", "eleven", None),
        ("இருபது", None, "twenty", None),
        ("ஐம்பது", "அம்பது", "fifty", None),
        ("நூறு", None, "one hundred", None),
        ("ஆயிரம்", None, "one thousand", None),
    ]),
    ("food", "Food and drink", "உணவு", [
        ("தண்ணீர்", "தண்ணி", "water", None),
        ("சாப்பாடு", None, "food / a meal", None),
        ("சோறு", None, "cooked rice", None),
        ("அரிசி", None, "rice (uncooked)", None),
        ("இட்லி", None, "idli", "Steamed rice cakes."),
        ("தோசை", None, "dosa", None),
        ("சாம்பார்", None, "sambar", None),
        ("ரசம்", None, "rasam", None),
        ("காபி", None, "coffee", None),
        ("டீ", None, "tea", None),
        ("பால்", None, "milk", None),
        ("தயிர்", None, "yogurt / curd", None),
        ("பழம்", None, "fruit", None),
        ("காய்கறி", None, "vegetable", None),
        ("உப்பு", None, "salt", None),
    ]),
    ("body", "Body", "உடல்", [
        ("தலை", None, "head", None),
        ("கண்", None, "eye", None),
        ("காது", None, "ear", None),
        ("மூக்கு", None, "nose", None),
        ("வாய்", None, "mouth", None),
        ("பல்", None, "tooth", None),
        ("கை", None, "hand / arm", None),
        ("கால்", None, "leg / foot", None),
        ("விரல்", None, "finger", None),
        ("முடி", None, "hair", None),
        ("முகம்", None, "face", None),
        ("வயிறு", None, "stomach", None),
        ("இதயம்", None, "heart", None),
        ("தோள்", None, "shoulder", None),
        ("முதுகு", None, "back", None),
    ]),
    ("home", "Home", "வீடு", [
        ("வீடு", None, "house / home", None),
        ("கதவு", None, "door", None),
        ("ஜன்னல்", None, "window", None),
        ("அறை", None, "room", None),
        ("சமையலறை", None, "kitchen", None),
        ("படுக்கை", None, "bed", None),
        ("நாற்காலி", None, "chair", None),
        ("மேசை", None, "table", None),
        ("விளக்கு", None, "lamp / light", None),
        ("தொலைக்காட்சி", "டிவி", "television", None),
        ("புத்தகம்", None, "book", None),
        ("தட்டு", None, "plate", None),
        ("கரண்டி", None, "spoon", None),
        ("பாய்", None, "mat", None),
        ("சாவி", None, "key", None),
    ]),
    ("colours", "Colours", "நிறங்கள்", [
        ("நிறம்", None, "colour", None),
        ("சிவப்பு", None, "red", None),
        ("நீலம்", None, "blue", None),
        ("பச்சை", None, "green", None),
        ("மஞ்சள்", None, "yellow", None),
        ("கருப்பு", None, "black", None),
        ("வெள்ளை", None, "white", None),
        ("ஆரஞ்சு", None, "orange", None),
        ("இளஞ்சிவப்பு", None, "pink", "Literally \"young red\"."),
        ("ஊதா", None, "purple", None),
        ("பழுப்பு", None, "brown", None),
        ("சாம்பல்", None, "grey", "Also means ash."),
        ("தங்க நிறம்", None, "gold (colour)", None),
        ("வெள்ளி நிறம்", None, "silver (colour)", None),
        ("கருநீலம்", None, "dark blue", None),
    ]),
    ("time", "Days and time", "நாளும் நேரமும்", [
        ("ஞாயிறு", None, "Sunday", None),
        ("திங்கள்", None, "Monday", None),
        ("செவ்வாய்", None, "Tuesday", None),
        ("புதன்", None, "Wednesday", None),
        ("வியாழன்", None, "Thursday", None),
        ("வெள்ளி", None, "Friday", "Also means silver."),
        ("சனி", None, "Saturday", None),
        ("இன்று", "இன்னிக்கு", "today", None),
        ("நேற்று", "நேத்து", "yesterday", None),
        ("நாளை", "நாளைக்கு", "tomorrow", None),
        ("காலை", None, "morning", None),
        ("மதியம்", None, "afternoon", None),
        ("மாலை", "சாயங்காலம்", "evening", None),
        ("இரவு", "ராத்திரி", "night", None),
        ("நேரம்", None, "time", None),
    ]),
    ("verbs", "Common verbs", "வினைச்சொற்கள்", [
        ("வா", None, "come!", "The casual command, said to a friend or a child."),
        ("போ", None, "go!", None),
        ("சாப்பிடு", None, "eat!", None),
        ("குடி", None, "drink!", None),
        ("படி", None, "read / study!", None),
        ("எழுது", None, "write!", None),
        ("பேசு", None, "speak!", None),
        ("கேள்", "கேளு", "listen / ask!", None),
        ("பார்", "பாரு", "look!", None),
        ("தூங்கு", None, "sleep!", None),
        ("உட்கார்", "உக்காரு", "sit!", None),
        ("நில்", "நில்லு", "stop / stand!", None),
        ("செய்", "பண்ணு", "do!", None),
        ("கொடு", "குடு", "give!", None),
        ("வாங்கு", None, "buy / take!", None),
    ]),
    ("questions", "Everyday questions", "கேள்விகள்", [
        ("என்ன", None, "what", None),
        ("எங்கே", "எங்க", "where", None),
        ("எப்போது", "எப்போ", "when", None),
        ("ஏன்", None, "why", None),
        ("யார்", "யாரு", "who", None),
        ("எப்படி", None, "how", None),
        ("எவ்வளவு", "எவ்ளோ", "how much", None),
        ("எத்தனை", None, "how many", None),
        ("எது", None, "which one", None),
        ("இது", None, "this", None),
        ("அது", None, "that", None),
        ("இங்கே", "இங்க", "here", None),
        ("அங்கே", "அங்க", "there", None),
        ("விலை என்ன?", "என்ன விலை?", "what's the price?", None),
        ("புரியவில்லை", "புரியல", "I don't understand", None),
    ]),
]

VOWELS = {"அ": "a", "ஆ": "ā", "இ": "i", "ஈ": "ī", "உ": "u", "ஊ": "ū", "எ": "e", "ஏ": "ē",
          "ஐ": "ai", "ஒ": "o", "ஓ": "ō", "ஔ": "au", "ஃ": "ḵ"}
CONSONANTS = {"க": "k", "ங": "ṅ", "ச": "c", "ஞ": "ñ", "ட": "ṭ", "ண": "ṇ", "த": "t", "ந": "n",
              "ப": "p", "ம": "m", "ய": "y", "ர": "r", "ல": "l", "வ": "v", "ழ": "ḻ", "ள": "ḷ",
              "ற": "ṟ", "ன": "ṉ", "ஜ": "j", "ஷ": "ṣ", "ஸ": "s", "ஹ": "h", "ஶ": "ś"}
SIGNS = {"ா": "ā", "ி": "i", "ீ": "ī", "ு": "u", "ூ": "ū", "ெ": "e", "ே": "ē", "ை": "ai",
         "ொ": "o", "ோ": "ō", "ௌ": "au"}
VIRAMA = "்"


def romanize(text: str) -> str:
    s = unicodedata.normalize("NFC", text)
    out = []
    i = 0
    while i < len(s):
        ch = s[i]
        nxt = s[i + 1] if i + 1 < len(s) else ""
        if ch in CONSONANTS:
            out.append(CONSONANTS[ch])
            if nxt == VIRAMA:
                i += 1
            elif nxt in SIGNS:
                out.append(SIGNS[nxt])
                i += 1
            else:
                out.append("a")
        elif ch in VOWELS:
            out.append(VOWELS[ch])
        elif ch in SIGNS or ch == VIRAMA:
            raise ValueError(f"stray sign in {text!r}")
        elif "஀" <= ch <= "௿":
            raise ValueError(f"unknown Tamil character {ch!r} in {text!r}")
        else:
            out.append(ch)
        i += 1
    return "".join(out)


# An easy "sounds like" spelling, like the ones families use when texting Tamil in English letters.
# Tamil stops change sound by position (k is "g" between vowels, "ng" after a nasal...), so this
# applies those rules; OVERRIDES covers loanwords and other exceptions.
STOPS = {"k", "c", "ṭ", "t", "p", "ṟ"}
NASALS = {"ṅ", "ñ", "ṇ", "n", "m", "ṉ"}
DOUBLED = {"k": "kk", "c": "ch", "ṭ": "tt", "t": "th", "p": "pp", "ṟ": "tr"}
AFTER_NASAL = {"k": "g", "c": "j", "ṭ": "d", "t": "dh", "p": "b", "ṟ": "dr"}
BETWEEN_VOWELS = {"k": "g", "c": "s", "ṭ": "d", "t": "dh", "p": "b", "ṟ": "r"}
PLAIN_STOP = {"k": "k", "c": "ch", "ṭ": "t", "t": "th", "p": "p", "ṟ": "r"}
FIRST = {"k": "k", "c": "s", "ṭ": "t", "t": "th", "p": "p", "ṟ": "r"}
OTHER = {"ṅ": "ng", "ñ": "ny", "ṇ": "n", "n": "n", "m": "m", "ṉ": "n", "y": "y", "r": "r", "l": "l",
         "v": "v", "ḻ": "zh", "ḷ": "l", "j": "j", "ṣ": "sh", "s": "s", "h": "h", "ś": "sh"}
SAY_VOWELS = {"a": "a", "ā": "aa", "i": "i", "ī": "ee", "u": "u", "ū": "oo", "e": "e", "ē": "e",
              "ai": "ai", "o": "o", "ō": "o", "au": "au", "ḵ": "h"}
OVERRIDES = {"தோசை": "dosai", "காபி": "kaapi", "டிவி": "TV", "தயவுசெய்து": "thayavu seidhu"}


def syllables(word: str):
    """[(consonant or '', vowel or '')] in ISO letters, e.g. கண் -> [('k','a'), ('ṇ','')]."""
    s = unicodedata.normalize("NFC", word)
    out, i = [], 0
    while i < len(s):
        ch, nxt = s[i], (s[i + 1] if i + 1 < len(s) else "")
        if ch in CONSONANTS:
            if nxt == VIRAMA:
                out.append((CONSONANTS[ch], "")); i += 1
            elif nxt in SIGNS:
                out.append((CONSONANTS[ch], SIGNS[nxt])); i += 1
            else:
                out.append((CONSONANTS[ch], "a"))
        elif ch in VOWELS:
            out.append(("", VOWELS[ch]))
        i += 1
    return out


def say_word(word: str) -> str:
    if word in OVERRIDES:
        return OVERRIDES[word]
    sy = syllables(word)
    out = []
    for i, (c, v) in enumerate(sy):
        prev = sy[i - 1] if i else None
        nxt = sy[i + 1] if i + 1 < len(sy) else None
        if c in STOPS:
            if not v and nxt and nxt[0] == c:
                pass  # first half of a double: the second half spells both
            elif prev and prev[0] == c and not prev[1]:
                out.append(DOUBLED[c])
            elif prev and not prev[1] and prev[0] in NASALS:
                out.append(AFTER_NASAL[c])
            elif prev is None:
                out.append(FIRST[c])
            elif prev[1]:
                out.append(BETWEEN_VOWELS[c])
            else:
                out.append(PLAIN_STOP[c])
        elif c == "ṅ" and nxt and nxt[0] == "k":
            out.append("n")
        elif c == "ñ" and nxt and nxt[0] == "c":
            out.append("n")
        elif c:
            out.append(OTHER[c])
        out.append(SAY_VOWELS.get(v, v))
    return "".join(out)


def say(text: str) -> str:
    return re.sub(r"[\u0b80-\u0bff]+", lambda m: say_word(m.group(0)), unicodedata.normalize("NFC", text))


def slug(english: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", english.lower()).strip("-")


def main():
    root = Path(__file__).resolve().parent.parent
    decks = []
    seen = set()
    for deck_id, name, tamil_name, words in DECKS:
        assert len(words) == 15, (deck_id, len(words))
        entries = []
        for tamil, spoken, english, note in words:
            wid = f"w.{deck_id}.{slug(english)}"
            assert wid not in seen, wid
            seen.add(wid)
            entry = {"id": wid, "tamil": tamil, "roman": romanize(tamil), "english": english}
            if spoken and spoken != tamil:
                entry["spoken"] = spoken
                entry["spokenRoman"] = romanize(spoken)
            entry["say"] = say(spoken or tamil)
            if note:
                entry["note"] = note
            entries.append(entry)
        decks.append({"id": deck_id, "name": name, "tamilName": tamil_name, "words": entries})
    out = root / "src" / "data" / "words.json"
    out.write_text(json.dumps({"decks": decks}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {sum(len(d['words']) for d in decks)} words in {len(decks)} decks to {out}")


if __name__ == "__main__":
    main()
