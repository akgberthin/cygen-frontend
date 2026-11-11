"""Translation dictionary checks: key parity between en.json and es.json,
banned-word scan over both dictionaries, and FAQ size."""
import json
import re
from pathlib import Path

LOCALES = Path(__file__).resolve().parent.parent / "frontend" / "src" / "i18n" / "locales"

# Words that must never appear on the site (whole-word, case-insensitive).
# Note: "term"/"término" use word boundaries, so the legal document names
# "Terms of use" / "Términos de uso" (plural) are not flagged — the ban covers
# the financing sense of the word, and those document names are required copy.
BANNED_EN = [
    "borrower", "lender", "loan", "interest", "amortization", "term", "maturity",
    "payoff", "delinquency", "default", "acceleration", "foreclosure", "late fee",
]
BANNED_ES = [
    "prestatario", "prestamista", "préstamo", "prestamo", "interés", "amortización",
    "amortizacion", "plazo", "término", "termino", "vencimiento", "morosidad",
    "incumplimiento", "aceleración", "aceleracion", "ejecución hipotecaria",
    "ejecucion hipotecaria", "recargo", "cuota por mora",
]


def load(code):
    return json.loads((LOCALES / f"{code}.json").read_text(encoding="utf-8"))


def flatten(node, prefix=""):
    out = {}
    if isinstance(node, dict):
        for k, v in node.items():
            out.update(flatten(v, f"{prefix}{k}."))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            out.update(flatten(v, f"{prefix}{i}."))
    else:
        out[prefix.rstrip(".")] = node
    return out


def test_key_parity():
    en = set(flatten(load("en")))
    es = set(flatten(load("es")))
    missing_es = en - es
    missing_en = es - en
    assert not missing_es, f"keys missing in es.json: {sorted(missing_es)[:20]}"
    assert not missing_en, f"keys missing in en.json: {sorted(missing_en)[:20]}"


# Scoped exception (owner decision, 2026-10-29): the home comparison calculator
# deliberately names the comparative elements — "interest" on the traditional
# mortgage side versus "COP" on the CYGEN side — for the educational calculation.
# The ban stays fully enforced everywhere else.
COMPARE_ALLOWED = {
    "en": {"interest": ("home.compare.",)},
    "es": {"interés": ("home.compare.",)},
}


def scan(code, banned):
    hits = []
    allowed = COMPARE_ALLOWED.get(code, {})
    for key, value in flatten(load(code)).items():
        text = str(value)
        for word in banned:
            if key.startswith(allowed.get(word, ())):
                continue
            if re.search(rf"(?<!\w){re.escape(word)}(?!\w)", text, re.IGNORECASE):
                hits.append((code, key, word))
    return hits


def test_no_banned_words_english():
    assert not scan("en", BANNED_EN)


def test_no_banned_words_spanish():
    assert not scan("es", BANNED_EN + BANNED_ES)


def test_faq_has_at_least_twelve_questions():
    assert len(load("en")["faq"]["items"]) >= 12
    assert len(load("es")["faq"]["items"]) >= 12


def test_required_fixed_strings_present():
    en = load("en")
    assert en["common"]["footerDisclosure"] == (
        "CYGEN is an equity partnership program, not a mortgage product. "
        "Figures are illustrative. A person at CYGEN reviews every application."
    )
    assert "native-speaker review" in en["common"]["spanishReviewNote"]
    assert en["common"]["draftBadge"].startswith("Draft")
