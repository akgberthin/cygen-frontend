"""WCAG 2.2 contrast checks for both themes (computed, not by eye).
Text pairs must reach 4.5:1, non-text UI pairs 3:1. Tokens live in
frontend/src/theme/tokens.json and are mirrored into index.css variables."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKENS = json.loads((ROOT / "frontend" / "src" / "theme" / "tokens.json").read_text())

TEXT_MIN = 4.5
NONTEXT_MIN = 3.0


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) / 255 for i in (0, 2, 4))


def parse_rgba(value):
    m = re.match(r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)", value)
    return (int(m.group(1)) / 255, int(m.group(2)) / 255, int(m.group(3)) / 255, float(m.group(4)))


def luminance(rgb):
    def channel(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def composite(fg_rgba, bg_hex):
    r, g, b, a = fg_rgba
    br, bg_, bb = hex_to_rgb(bg_hex)
    return (r * a + br * (1 - a), g * a + bg_ * (1 - a), b * a + bb * (1 - a))


def contrast(c1, c2):
    l1, l2 = luminance(c1), luminance(c2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def rgb(theme, token):
    value = TOKENS[theme][token]
    if value.startswith("#"):
        return hex_to_rgb(value)
    raise ValueError(f"token {token} is rgba; composite it against a surface instead")


TEXT_TOKENS = ["cream", "body", "muted", "dim", "goldText", "dangerText"]
SURFACES = ["background", "surface", "surface2", "surface3"]


def test_text_contrast_both_themes():
    failures = []
    for theme in ("dark", "light"):
        for text in TEXT_TOKENS:
            for surface in SURFACES:
                ratio = contrast(rgb(theme, text), rgb(theme, surface))
                if ratio < TEXT_MIN:
                    failures.append(f"{theme}: {text} on {surface} = {ratio:.2f}")
        for accent in ("green", "blue"):
            for surface in ("background", "surface"):
                ratio = contrast(rgb(theme, accent), rgb(theme, surface))
                if ratio < TEXT_MIN:
                    failures.append(f"{theme}: {accent} on {surface} = {ratio:.2f}")
    assert not failures, "\n".join(failures)


def test_button_contrast_both_themes():
    for theme in ("dark", "light"):
        for fill in ("gold", "goldHover"):
            ratio = contrast(rgb(theme, "ink"), rgb(theme, fill))
            assert ratio >= TEXT_MIN, f"{theme}: ink on {fill} = {ratio:.2f}"


def test_nontext_contrast_both_themes():
    failures = []
    for theme in ("dark", "light"):
        for surface in ("background", "surface"):
            ratio = contrast(rgb(theme, "focus"), rgb(theme, surface))
            if ratio < NONTEXT_MIN:
                failures.append(f"{theme}: focus ring on {surface} = {ratio:.2f}")
        # strong input borders are rgba: composite over the surface they sit on
        border = parse_rgba(TOKENS[theme]["borderStrong"])
        for surface in ("surface", "surface2"):
            mixed = composite(border, TOKENS[theme][surface])
            ratio = contrast(mixed, rgb(theme, surface))
            if ratio < NONTEXT_MIN:
                failures.append(f"{theme}: input border on {surface} = {ratio:.2f}")
    # gold icon/border strokes on dark surfaces
    for surface in ("background", "surface"):
        ratio = contrast(rgb("dark", "gold"), rgb("dark", surface))
        if ratio < NONTEXT_MIN:
            failures.append(f"dark: gold accent on {surface} = {ratio:.2f}")
        ratio = contrast(rgb("light", "goldText"), rgb("light", surface))
        if ratio < NONTEXT_MIN:
            failures.append(f"light: gold accent on {surface} = {ratio:.2f}")
    assert not failures, "\n".join(failures)
