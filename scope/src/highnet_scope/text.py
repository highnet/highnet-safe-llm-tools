"""Looking at a message the way an attacker hopes we won't: the views of one message that the rule
prefilter searches. Each view undoes one hiding trick, so a rule that only matches in the decoded
view says exactly how the instruction was hidden.

- raw: the message as sent;
- normalized: Unicode NFKC, zero-width characters removed, look-alike Cyrillic and Greek letters
  folded to Latin, digits used as letters (l33t) read as letters;
- decoded: base64 and hex runs that decode to readable text, and the whole message under rot13;
- hidden: text a person would not see when the message is rendered (HTML comments, elements
  styled invisible).
"""

import base64
import binascii
import codecs
import re
import unicodedata
from dataclasses import dataclass, field

ZERO_WIDTH = re.compile("[​‌‍⁠﻿­]")
# Cyrillic and Greek letters that render like Latin ones (escaped: they look identical).
LOOK_ALIKES = (
    "\u0430\u0435\u043e\u0440\u0441\u0443\u0445\u0456\u0458\u0455\u043a\u043c\u0442\u0432\u043d\u0410"
    "\u0415\u041e\u0420\u0421\u0422\u0425\u041a\u041c\u041d\u0412\u0406\u03b1\u03bf\u03b5\u03c1\u03b9"
    "\u03ba\u03bd\u03c4\u03c5\u0391\u039f\u0395\u03a1\u0399\u039a\u039d\u03a4"
)
HOMOGLYPHS = str.maketrans(LOOK_ALIKES, "aeopcyxijskmtbhAEOPCTXKMHBIaoepikvtuAOEPIKNT")
LEET = str.maketrans(
    {"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s"}
)
LEET_WORD = re.compile(r"\b(?=\w*[a-z])(?=\w*[013457@$])[a-z013457@$]{4,}\b", re.IGNORECASE)
BASE64_RUN = re.compile(r"[A-Za-z0-9+/]{16,}={0,2}")
HEX_RUN = re.compile(r"\b(?:[0-9a-fA-F]{2}[\s:]?){12,}\b")
HTML_COMMENT = re.compile(r"<!--(.*?)-->", re.DOTALL)
HIDDEN_ELEMENT = re.compile(
    r"<(\w+)[^>]*style\s*=\s*[\"'][^\"']*(?:display\s*:\s*none|visibility\s*:\s*hidden|"
    r"font-size\s*:\s*[01](?:px|pt)?\b|color\s*:\s*(?:#fff(?:fff)?|white))[^\"']*[\"'][^>]*>"
    r"(.*?)</\1>",
    re.DOTALL | re.IGNORECASE,
)
LATIN = re.compile(r"[a-zA-Z]")
CYRILLIC_OR_GREEK = re.compile("[Ͱ-ϿЀ-ӿ]")
WORD = re.compile(r"\w+", re.UNICODE)


@dataclass
class Views:
    raw: str
    normalized: str
    decoded: list[str] = field(default_factory=list)
    hidden: list[str] = field(default_factory=list)
    zero_width: int = 0
    homoglyph_words: list[str] = field(default_factory=list)
    leet_words: list[str] = field(default_factory=list)

    def all(self) -> list[tuple[str, str]]:
        """(view name, text) pairs, in the order the rules read them."""
        return (
            [("raw", self.raw), ("normalized", self.normalized)]
            + [("decoded", d) for d in self.decoded]
            + [("hidden", h) for h in self.hidden]
        )


def _readable(data: bytes) -> str | None:
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return None
    letters = sum(c.isalpha() or c.isspace() for c in text)
    return text if len(text) >= 8 and letters / len(text) >= 0.8 else None


def decode_runs(text: str) -> list[str]:
    found: list[str] = []
    for run in BASE64_RUN.findall(text):
        try:
            decoded = _readable(base64.b64decode(run + "=" * (-len(run) % 4), validate=True))
        except (binascii.Error, ValueError):
            decoded = None
        if decoded:
            found.append(decoded)
    for run in HEX_RUN.findall(text):
        # HEX_RUN only matches whole byte pairs, so the run always parses as hex.
        decoded = _readable(bytes.fromhex(re.sub(r"[\s:]", "", run)))
        if decoded:
            found.append(decoded)
    return found


def mixed_script_words(text: str) -> list[str]:
    """Words that mix Latin with Cyrillic or Greek letters: a look-alike attack, not a language."""
    return [w for w in WORD.findall(text) if LATIN.search(w) and CYRILLIC_OR_GREEK.search(w)]


def normalize(text: str) -> str:
    text = ZERO_WIDTH.sub("", unicodedata.normalize("NFKC", text)).translate(HOMOGLYPHS)
    return LEET_WORD.sub(lambda m: m.group(0).translate(LEET), text).lower()


def views(text: str) -> Views:
    normalized = normalize(text)
    hidden = [c.strip() for c in HTML_COMMENT.findall(text) if c.strip()]
    hidden += [m[1].strip() for m in HIDDEN_ELEMENT.findall(text) if m[1].strip()]
    return Views(
        raw=text,
        normalized=normalized,
        decoded=[*decode_runs(text), codecs.decode(text, "rot13")],
        hidden=hidden,
        zero_width=len(ZERO_WIDTH.findall(text)),
        homoglyph_words=mixed_script_words(text),
        leet_words=[w for w in LEET_WORD.findall(text) if not w.isdigit()],
    )


# A small heuristic, not a model: the language with the most of its common words wins. It only
# decides how the request step labels the message; no language is refused.
STOPWORDS = {
    "en": [
        "the",
        "and",
        "is",
        "are",
        "you",
        "my",
        "i",
        "to",
        "of",
        "in",
        "for",
        "how",
        "what",
        "can",
        "do",
        "with",
        "it",
        "this",
        "a",
        "or",
        "be",
        "on",
        "your",
        "me",
        "should",
        "why",
        "does",
    ],
    "de": [
        "der",
        "die",
        "das",
        "und",
        "ist",
        "ich",
        "mein",
        "wie",
        "was",
        "nicht",
        "mit",
        "ein",
        "eine",
        "zu",
        "für",
        "ich",
        "kann",
    ],
    "es": [
        "el",
        "la",
        "los",
        "las",
        "y",
        "es",
        "mi",
        "como",
        "qué",
        "que",
        "de",
        "para",
        "con",
        "una",
        "un",
        "puedo",
        "por",
    ],
    "fr": [
        "le",
        "la",
        "les",
        "et",
        "est",
        "mon",
        "ma",
        "comment",
        "que",
        "de",
        "pour",
        "avec",
        "une",
        "un",
        "je",
        "puis",
        "des",
    ],
    "it": [
        "il",
        "la",
        "gli",
        "e",
        "è",
        "mio",
        "come",
        "che",
        "di",
        "per",
        "con",
        "una",
        "un",
        "posso",
    ],
    "pt": [
        "o",
        "a",
        "os",
        "as",
        "e",
        "é",
        "meu",
        "como",
        "que",
        "de",
        "para",
        "com",
        "uma",
        "um",
        "posso",
        "não",
    ],
    "nl": [
        "de",
        "het",
        "een",
        "en",
        "is",
        "mijn",
        "hoe",
        "wat",
        "niet",
        "met",
        "voor",
        "ik",
        "kan",
    ],
    "pl": ["i", "w", "na", "jak", "co", "jest", "mój", "nie", "z", "do", "się", "czy"],
    "tr": ["ve", "bir", "bu", "ne", "nas\u0131l", "için", "ile", "mi", "benim", "çok"],
}


def detect_language(text: str) -> tuple[str, int]:
    """(language code, how many of its common words appear); ("und", 0) when none do."""
    words = [w.lower() for w in WORD.findall(normalize(text))]
    scores = {lang: sum(w in set(sw) for w in words) for lang, sw in STOPWORDS.items()}
    lang, score = max(scores.items(), key=lambda kv: kv[1])
    return (lang, score) if score else ("und", 0)
