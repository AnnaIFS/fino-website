#!/usr/bin/env python3
"""Rebuild sitemap.xml with a truthful lastmod for every page.

lastmod is the date that page's own file last changed in git, not the date this
script ran. Stamping every URL with the build date is the pattern Google learns
to ignore.

    python3 sitemap.py
"""
import subprocess, os

SITE = "https://fino.website/"
# path on disk -> (url path, priority)
PAGES = [
    ("index.html", "", "1.0"),
    ("circles/index.html", "circles/", "0.9"),
    ("coaching/index.html", "coaching/", "0.9"),
    ("offsites/index.html", "offsites/", "0.9"),
    ("fractional-operations/index.html", "fractional-operations/", "0.9"),
    ("self-led-ai-integration/index.html", "self-led-ai-integration/", "0.9"),
    ("law-firms/index.html", "law-firms/", "0.9"),
    ("studio/index.html", "studio/", "0.8"),
    ("about/index.html", "about/", "0.7"),
]


def last_changed(path):
    """The last commit that touched this file, ignoring commits that only moved
    the cache-busting hash in its <head>."""
    out = subprocess.run(
        ["git", "log", "--format=%H %cs", "--", path],
        capture_output=True, text=True).stdout.strip().splitlines()
    for line in out:
        sha, date = line.split()
        diff = subprocess.run(
            ["git", "show", "--format=", "-U0", sha, "--", path],
            capture_output=True, text=True).stdout
        body = [l for l in diff.splitlines()
                if l[:1] in "+-" and l[:3] not in ("+++", "---")]
        if any("v2.css?v=" not in l and "v2.js?v=" not in l for l in body):
            return date
    return out[0].split()[1] if out else None


rows = []
for path, url, pri in PAGES:
    d = last_changed(path)
    rows.append("  <url>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n"
                "    <priority>%s</priority>\n  </url>" % (SITE, url, d, pri))
    print("  %-38s %s" % (url or "/", d))

open("sitemap.xml", "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "\n".join(rows) + "\n</urlset>\n")
print("  sitemap.xml written")
