#!/usr/bin/env python3
from pathlib import Path

ROOT = Path("/Users/devtehen/sites/peptides-decodes")

replacements = {
    "<!-- TODO AFFILIATE: remplacer par lien RC Peptides -->": '<a href="https://rcpeptides.to/products/argirelin-200mg-vial" rel="nofollow sponsored">Argiréline 200mg</a>',
    "<!-- TODO AFFILIATE argirelin -->": '<a href="https://rcpeptides.to/products/argirelin-200mg-vial" rel="nofollow sponsored">Argiréline 200mg</a>',
    "<!-- TODO AFFILIATE matrixyl -->": '<a href="https://rcpeptides.to/products/matrixyl-10mg-vial" rel="nofollow sponsored">Matrixyl 10mg</a>',
}

files = [
    ROOT / "index.html",
    ROOT / "en.html",
    ROOT / "articles.html",
    ROOT / "articles-en.html",
]

for path in files:
    if not path.exists():
        print(f"ABSENT: {path}")
        continue
    original = path.read_text(encoding="utf-8")
    backup = path.with_suffix(path.suffix + ".pre-affiliate-patch")
    backup.write_text(original, encoding="utf-8")
    text = original
    changed = False
    for old, new in replacements.items():
        if old in text:
            text = text.replace(old, new)
            changed = True
    if changed:
        path.write_text(text, encoding="utf-8")
        print(f"PATCHED: {path} -> {backup.name}")
    else:
        print(f"UNCHANGED: {path}")
