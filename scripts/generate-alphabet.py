"""Generate the full Tamil alphabet card data from Unicode.

Writes src/data/tamil_alphabet.json and .csv with the fields listed in SPEC.md:
12 vowels, the aytam, 18 consonants, 216 compound letters (uyirmei) and the
6 Grantha letters. Everything is marked needs_review until a native speaker
has checked the romanization and sound tags.

Usage:  python3 scripts/generate-alphabet.py
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_JSON = ROOT / "src" / "data" / "tamil_alphabet.json"
OUT_CSV = ROOT / "src" / "data" / "tamil_alphabet.csv"
# Compound and Grantha letters in the shape the app drills (see src/data/letters.ts).
OUT_EXTRA = ROOT / "src" / "data" / "letters.extra.json"

PULLI = "்"

# id, letter, vowel sign, ISO 15919, length, sign position, traditional name
VOWELS = [
    ("a", "அ", "", "a", "short", "none", "அகரம்"),
    ("aa", "ஆ", "ா", "ā", "long", "right", "ஆகாரம்"),
    ("i", "இ", "ி", "i", "short", "above", "இகரம்"),
    ("ii", "ஈ", "ீ", "ī", "long", "above", "ஈகாரம்"),
    ("u", "உ", "ு", "u", "short", "ligature", "உகரம்"),
    ("uu", "ஊ", "ூ", "ū", "long", "ligature", "ஊகாரம்"),
    ("e", "எ", "ெ", "e", "short", "left", "எகரம்"),
    ("ee", "ஏ", "ே", "ē", "long", "left", "ஏகாரம்"),
    ("ai", "ஐ", "ை", "ai", "long", "left", "ஐகாரம்"),
    ("o", "ஒ", "ொ", "o", "short", "both", "ஒகரம்"),
    ("oo", "ஓ", "ோ", "ō", "long", "both", "ஓகாரம்"),
    ("au", "ஔ", "ௌ", "au", "long", "both", "ஔகாரம்"),
]

# id, base letter, ISO 15919, class, articulation
CONSONANTS = [
    ("k", "க", "k", "vallinam", "velar stop"),
    ("ng", "ங", "ṅ", "mellinam", "velar nasal"),
    ("c", "ச", "c", "vallinam", "palatal stop"),
    ("nj", "ஞ", "ñ", "mellinam", "palatal nasal"),
    ("tt", "ட", "ṭ", "vallinam", "retroflex stop"),
    ("nn", "ண", "ṇ", "mellinam", "retroflex nasal"),
    ("t", "த", "t", "vallinam", "dental stop"),
    ("n", "ந", "n", "mellinam", "dental nasal"),
    ("p", "ப", "p", "vallinam", "labial stop"),
    ("m", "ம", "m", "mellinam", "labial nasal"),
    ("y", "ய", "y", "idaiyinam", "palatal approximant"),
    ("r", "ர", "r", "idaiyinam", "alveolar tap"),
    ("l", "ல", "l", "idaiyinam", "alveolar lateral"),
    ("v", "வ", "v", "idaiyinam", "labiodental approximant"),
    ("zh", "ழ", "ḻ", "idaiyinam", "retroflex approximant"),
    ("ll", "ள", "ḷ", "idaiyinam", "retroflex lateral"),
    ("rr", "ற", "ṟ", "vallinam", "alveolar trill"),
    ("nnn", "ன", "ṉ", "mellinam", "alveolar nasal"),
]

# id, letter, ISO 15919, articulation, casual spelling, sound hint
GRANTHA = [
    ("ja", "ஜ", "ja", "palatal stop (voiced)", "ja", "j as in 'jam'"),
    ("ssa", "ஷ", "ṣa", "retroflex fricative", "sha", "sh with the tongue curled back"),
    ("sa", "ஸ", "sa", "alveolar fricative", "sa", "s as in 'sun'"),
    ("ha", "ஹ", "ha", "glottal fricative", "ha", "h as in 'hat'"),
    ("ksa", "க்ஷ", "kṣa", "velar stop + retroflex fricative", "ksha", "k and sh together, as in 'Lakshmi'"),
    ("sri", "ஸ்ரீ", "śrī", "ligature (ś + r + ī)", "shree", "shree, as in 'Sri Lanka'"),
]

# Casual spellings, matching src/data/letters.json.
FRIENDLY_C = {"k": "k", "ng": "ng", "c": "ch", "nj": "nj", "tt": "T", "nn": "N", "t": "th", "n": "n", "p": "p",
              "m": "m", "y": "y", "r": "r", "l": "l", "v": "v", "zh": "zh", "ll": "L", "rr": "R", "nnn": "n"}
FRIENDLY_V = {"a": "a", "aa": "aa", "i": "i", "ii": "ee", "u": "u", "uu": "oo", "e": "e", "ee": "ay", "ai": "ai",
              "o": "o", "oo": "oh", "au": "ow"}

# The ு/ூ column has a different shape for every consonant, and ட/ற with ி/ீ
# fuse into ligatures, so these are memorized one by one.
IRREGULAR_SIGNS = {"u", "uu"}
IRREGULAR_PAIRS = {("tt", "i"), ("tt", "ii")}


def codepoints(s):
    return [f"U+{ord(ch):04X}" for ch in s]


def card(**kw):
    base = {
        "id": None,
        "letter": None,
        "category": None,
        "tamil_name": None,
        "romanization": None,
        "components": [],
        "vowel": None,
        "consonant": None,
        "length": None,
        "sign_position": None,
        "irregular": False,
        "consonant_class": None,
        "articulation": None,
        "codepoints": [],
        "audio": None,
        "stroke_order": None,
        "needs_review": True,
    }
    base.update(kw)
    base["codepoints"] = codepoints(base["letter"])
    return base


def main():
    cards = []
    for vid, letter, _sign, roman, length, _pos, name in VOWELS:
        cards.append(card(id=f"v_{vid}", letter=letter, category="vowel", tamil_name=name,
                          romanization=roman, vowel=vid, length=length))
    cards.append(card(id="aytham", letter="ஃ", category="aytham", tamil_name="ஆய்த எழுத்து",
                      romanization="ḵ", articulation="breathy fricative"))
    for cid, base, roman, cls, art in CONSONANTS:
        cards.append(card(id=f"c_{cid}", letter=base + PULLI, category="consonant",
                          tamil_name="இ" + base + PULLI, romanization=roman, consonant=cid,
                          consonant_class=cls, articulation=art))
    for cid, base, croman, cls, art in CONSONANTS:
        for vid, _vletter, sign, vroman, length, pos, _name in VOWELS:
            cards.append(card(
                id=f"cv_{cid}_{vid}", letter=base + sign, category="compound",
                romanization=croman + vroman, components=[f"c_{cid}", f"v_{vid}"],
                vowel=vid, consonant=cid, length=length, sign_position=pos,
                irregular=vid in IRREGULAR_SIGNS or (cid, vid) in IRREGULAR_PAIRS,
                consonant_class=cls, articulation=art,
            ))
    for gid, letter, roman, art, _friendly, _hint in GRANTHA:
        cards.append(card(id=f"g_{gid}", letter=letter, category="grantha", romanization=roman,
                          articulation=art))

    counts = {}
    for c in cards:
        counts[c["category"]] = counts.get(c["category"], 0) + 1
    assert counts == {"vowel": 12, "aytham": 1, "consonant": 18, "compound": 216, "grantha": 6}, counts

    OUT_JSON.write_text(json.dumps(cards, ensure_ascii=False, indent=1) + "\n")
    with OUT_CSV.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(cards[0].keys()))
        w.writeheader()
        for c in cards:
            row = dict(c)
            row["components"] = " ".join(c["components"])
            row["codepoints"] = " ".join(c["codepoints"])
            w.writerow(row)
    extra = []
    for cid, base, croman, _cls, _art in CONSONANTS:
        for vid, vletter, sign, vroman, _length, _pos, _name in VOWELS:
            how = "the plain consonant" if not sign else f"{base} with the {sign} sign"
            extra.append({
                "id": f"{cid}_{vid}", "group": "compound", "tamil": base + sign, "roman": croman + vroman,
                "friendly": FRIENDLY_C[cid] + FRIENDLY_V[vid], "hint": f"{croman} + {vroman}: {how}",
                "consonant": cid, "vowel": vid,
            })
    for gid, letter, roman, _art, friendly, hint in GRANTHA:
        extra.append({"id": gid, "group": "grantha", "tamil": letter, "roman": roman, "friendly": friendly,
                      "hint": hint})
    OUT_EXTRA.write_text("[\n" + ",\n".join("  " + json.dumps(x, ensure_ascii=False) for x in extra) + "\n]\n")
    print(counts, "total", len(cards))


if __name__ == "__main__":
    main()
