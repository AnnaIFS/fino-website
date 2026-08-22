#!/usr/bin/env python3
"""Run after every change. Catches the things that keep breaking."""
import re, glob, os, subprocess, sys, collections

os.chdir(os.path.dirname(os.path.abspath(__file__)))
HTML = [f for f in sorted(glob.glob("*.html") + glob.glob("*/index.html") + glob.glob("*/*/index.html"))
        if "http-equiv=\"refresh\"" not in open(f, encoding="utf-8").read()
        and "google" not in f]
CSS = re.sub(r"/\*.*?\*/", "", open("assets/css/v2.css", encoding="utf-8").read(), flags=re.S)
JS = open("assets/js/v2.js", encoding="utf-8").read()
problems = []

# --- 0. stamp the asset links so a stale stylesheet can never be what you are
#        looking at. runs first, because everything below reads the HTML.
import hashlib
_ver = {}
for _a in ("assets/css/v2.css", "assets/js/v2.js"):
    _ver[_a.rsplit("/", 1)[1]] = hashlib.md5(open(_a, "rb").read()).hexdigest()[:8]
for _f in HTML:
    _s = _o = open(_f, encoding="utf-8").read()
    for _name, _h in _ver.items():
        _s = re.sub(r'(assets/(?:css|js)/' + re.escape(_name) + r')(\?v=[0-9a-f]+)?"',
                    r'\1?v=' + _h + '"', _s)
    if _s != _o:
        open(_f, "w", encoding="utf-8").write(_s)



def flag(kind, detail):
    problems.append((kind, detail))


def rules(css):
    # anchor at a boundary so a grouped selector is read whole, not from its
    # first dot inward. otherwise "h1,h2,.close-line" is misread as a second ".close-line" rule.
    return re.finditer(r'(?:(?<=\})|(?<=^)|(?<=\n))\s*([^{}@/][^{}]*?)\s*\{([^}]*)\}', css)


# --- 1. the measure scale: no raw character widths ---
for m in rules(CSS):
    if re.search(r"max-width:\s*\d+ch", m.group(2)):
        flag("measure", "%s uses a raw ch value instead of the scale" % m.group(1).strip()[:48])


# --- 1b. the measure scale again, this time in inline styles. four pages were
#         overriding a class's own measure with four different raw values.
for f in HTML:
    for st in re.findall(r'style="([^"]*)"', open(f, encoding="utf-8").read()):
        if re.search(r"max-width:\s*\d+ch", st):
            flag("measure", "%s sets a raw ch value inline" % f)

# --- 2. the same property declared twice for the same selector, outside media queries ---
MEDIA = [(m.start(), m.end()) for m in re.finditer(r"@(?:media|keyframes|supports)[^{]*\{(?:[^{}]|\{[^}]*\})*\}", CSS)]
def in_media(p): return any(a <= p < b for a, b in MEDIA)
seen = collections.defaultdict(list)
for m in rules(CSS):
    if in_media(m.start()): continue
    sel = re.sub(r"\s+", " ", m.group(1).strip())
    for prop in re.findall(r"([a-z-]+)\s*:", m.group(2)):
        seen[(sel, prop)].append(m.start())
for (sel, prop), where in seen.items():
    if len(where) > 1 and not sel.startswith("@"):
        flag("duplicate", "%s declares %s %d times" % (sel[:40], prop, len(where)))

# --- 3. CSS classes with no matching markup ---
# tokenize the markup properly. a substring test reports classes that are in use.
markup = " ".join(open(f, encoding="utf-8").read() for f in HTML)
LIVE = {"js"}
for attr in re.findall(r'class="([^"]+)"', markup):
    LIVE.update(attr.split())
LIVE.update(re.findall(r"classList\.(?:add|remove|toggle|contains)\(['\"]([\w-]+)", JS))
for m in rules(CSS):
    if in_media(m.start()): continue
    # a selector is dead if any one of its class tokens is dead: the rest can never match
    for part in m.group(1).split(","):
        gone = [c for c in re.findall(r"\.([a-z][\w-]+)", part)
                if c not in LIVE and not re.search(r"['\"][^'\"]*\b" + c + r"\b[^'\"]*['\"]", JS)]
        if gone:
            flag("dead-css", "%s (.%s unused)" % (part.strip()[:44], gone[0]))

# --- 4. generators defined but never called, and called but never defined ---
defined = set(re.findall(r"^\s{4}(\w+):\s*function \(svg\)", JS, re.M))
used = set(re.findall(r'data-art="(\w+)"', markup))
for d in sorted(defined - used):
    flag("dead-art", "%s is defined but no page uses it" % d)
for u in sorted(used - defined):
    flag("missing-art", "%s is used in markup but not defined" % u)

# --- 5. internal links that go nowhere ---
for f in HTML:
    s = open(f, encoding="utf-8").read()
    base = os.path.dirname(f)
    for href in set(re.findall(r'href="([^"#][^"]*)"', s)):
        if href.startswith(("http", "mailto:", "tel:")):
            continue
        target = os.path.normpath(os.path.join(base, href.split("#")[0].split("?")[0]))
        if not (os.path.exists(target) or os.path.exists(os.path.join(target, "index.html"))):
            flag("broken-link", "%s -> %s" % (f, href))


# --- 5b. images that do not resolve. the about page shipped two broken ones.
for f in HTML:
    base = os.path.dirname(f)
    for src in re.findall(r'<img[^>]*src="([^"]+)"', open(f, encoding="utf-8").read()):
        if src.startswith(("http", "data:")):
            continue
        if not os.path.exists(os.path.normpath(os.path.join(base, src.split("?")[0]))):
            flag("broken-image", "%s -> %s" % (f, src))

# --- 6. anchors that point at ids which do not exist ---
for f in HTML:
    s = open(f, encoding="utf-8").read()
    ids = set(re.findall(r'id="([^"]+)"', s))
    for a in set(re.findall(r'href="#([^"]+)"', s)):
        if a and a not in ids:
            flag("dead-anchor", "%s -> #%s" % (f, a))

# --- 7. banned characters and words in visible copy ---
BANNED_W = ["delve", "intricate", "tapestry", "interplay", "foster", "garner", "underscore",
            "pivotal", "showcase", "enduring", "transformative", "holistic", "realm",
            "harness", "at its core", "engagement", "framework", "facilitate", "leverage ",
            "patterns", "meeting room", "utilize", "seamless", "robust",
            "synerg", "cutting-edge", "empower"]
# the offsites h1 earns one "conference room". a second use anywhere is the tic.
BANNED_TWICE = ["conference room"]
for f in HTML:
    s = open(f, encoding="utf-8").read()
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", s, flags=re.S)
    # a quotation is somebody else's words. we do not police those.
    body = re.sub(r"<blockquote[^>]*>.*?</blockquote>", "", body, flags=re.S)
    text = re.sub(r"&[a-zA-Z]+;", "", re.sub(r"<[^>]+>", " ", body))
    for ch, name in [("—", "em-dash"), ("–", "en-dash"), ("…", "ellipsis"), (";", "semicolon"), ("!", "exclamation")]:
        if ch in text:
            flag("banned-char", "%s contains %s" % (f, name))
    for w in BANNED_W:
        if re.search(r"\b" + w, text, re.I):
            flag("banned-word", "%s contains '%s'" % (f, w.strip()))
    for w in BANNED_TWICE:
        n = len(re.findall(r"\b" + w, text, re.I))
        if n > 1:
            flag("banned-word", "%s uses '%s' %d times, one is the limit" % (f, w, n))

# --- 8. the JS actually runs ---
r = subprocess.run(["node", "-e", "new Function(require('fs').readFileSync('assets/js/v2.js','utf8'))"],
                   capture_output=True, text=True)
if r.returncode != 0:
    flag("js-parse", r.stderr.strip().split("\n")[0])

# --- 8b. every generator actually runs. parsing is not running: a string
#         passed where a number belongs only throws when the function is called,
#         and one throw blanks every JS-gated reveal on the page.
_harness = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smoke.js")
if os.path.exists(_harness):
    for _art in sorted(used):
        _r = subprocess.run(["node", _harness, "assets/js/v2.js", _art], capture_output=True, text=True)
        if _r.returncode != 0:
            flag("art-throws", "%s: %s" % (_art, (_r.stderr or _r.stdout).strip().split("\n")[0][:120]))

# --- 9. every page has a head, and one h1 ---
for f in HTML:
    s = open(f, encoding="utf-8").read()
    if "<!DOCTYPE" not in s: flag("head", "%s has no doctype" % f)
    if 'name="viewport"' not in s: flag("head", "%s has no viewport" % f)
    if 'name="description"' not in s: flag("head", "%s has no meta description" % f)
    n = len(re.findall(r"<h1[ >]", s))
    if n != 1: flag("heading", "%s has %d h1 tags" % (f, n))

# --- 10. tag balance ---
for f in HTML:
    s = open(f, encoding="utf-8").read()
    b = s[s.find("<body>"):]
    for tag in ("div", "section", "figure"):
        o = len(re.findall(r"<%s[ >]" % tag, b)); c2 = len(re.findall(r"</%s>" % tag, b))
        if o != c2: flag("tags", "%s has %d <%s> and %d closing" % (f, o, tag, c2))

# --- 11. shared furniture must be identical on every page ---
import collections as _c
_menu = _c.defaultdict(set)
for f in HTML:
    m = re.search(r'<div class="mob" id="mob">.*?\n</div>', open(f, encoding="utf-8").read(), re.S)
    if not m: continue
    for href, label, desc in re.findall(r'href="([^"]+)">([^<]+)<em>([^<]*)</em>', m.group(0)):
        _menu[href.replace("../", "")].add(desc)
for href, vals in _menu.items():
    if len(vals) > 1:
        flag("menu-drift", "%s described %d different ways: %s" % (href, len(vals), " | ".join(sorted(vals))[:80]))

# --- report ---
if not problems:
    print("clean — %d pages checked" % len(HTML))
else:
    by = collections.defaultdict(list)
    for k, d in problems: by[k].append(d)
    for k in sorted(by):
        print("\n%s (%d)" % (k.upper(), len(by[k])))
        for d in sorted(set(by[k]))[:12]:
            print("   ", d)
        if len(set(by[k])) > 12:
            print("    ... and %d more" % (len(set(by[k])) - 12))
    print("\n%d issues across %d pages" % (len(problems), len(HTML)))
sys.exit(0)
