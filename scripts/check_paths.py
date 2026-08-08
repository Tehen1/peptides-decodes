#!/usr/bin/env python3
"""Peptides Decodes — path consistency checker."""

from pathlib import Path

BASE = Path("/Users/devtehen/sites/peptides-decodes")
ROOT = BASE / "articles"

EXPECTED = {
    "Home FR": BASE / "index.html",
    "Home EN": BASE / "en.html",
    "Articles FR": ROOT / "index.html",
    "Articles EN": ROOT / "en.html",
    "Affiliation FR": BASE / "affiliation.html",
    "Affiliation EN": BASE / "affiliation-en.html",
    "Worker": BASE / "peptides-affiliate-tracking" / "src" / "index.ts",
    "Config": BASE / "peptides-affiliate-tracking" / "wrangler.toml",
    "Redirects": BASE / "_redirects",
    "Template SQL": BASE / "supabase-newsletter-affiliate-template.sql",
}

LIVE_BASE = "https://067f3bb7.peptides-decodes.pages.dev"
LIVE_PATHS = {
    "Home FR": "/",
    "Home EN": "/en.html",
    "Articles FR": "/articles/",
    "Articles EN": "/articles-en",
    "Affiliation FR": "/affiliation.html",
    "Affiliation EN": "/affiliation-en.html",
}

print("== Local files ==")
for name, path in EXPECTED.items():
    status = "OK" if path.exists() else "MISSING"
    print(f"[{status}] {name}: {path}")

print("\n== Live URLs ==")
for name, rel in LIVE_PATHS.items():
    print(f"{name}: {LIVE_BASE}{rel}")

print("\n== Redirects ==")
redirects = BASE / "_redirects"
if redirects.exists():
    print(redirects.read_text())
else:
    print("[MISSING] _redirects")

print("\n== Done ==")
