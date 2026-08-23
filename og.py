#!/usr/bin/env python3
"""Draw the share cards.

One card per page, in the site's own language: the dark ground, the mark drawn
from the same geometry the hero uses, Newsreader for the line and Martian Mono
for the labels. Run it after a headline changes.

    python3 og.py

Fonts come from Google Fonts and are cached in ~/.local/share/fonts. If they
are missing the script says so rather than drawing the wrong typeface.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
S = 2                      # supersample, then downscale for clean edges
GROUND = (11, 10, 8)
INK = (236, 228, 215)
DIM = (168, 156, 140)
CORAL = (255, 86, 56)
AMBER = (251, 176, 64)

FONT_DIR = os.path.expanduser("~/.local/share/fonts")
MONO = os.path.join(FONT_DIR, "brand1.ttf")          # Martian Mono
DISPLAY = os.path.join(FONT_DIR, "brand2.ttf")       # Newsreader Light

# the mark, in the logo's own units. amber arrives from above, coral from
# below, and each pair meets on the axis.
APEX = [27, 52.5, 92, 145.5]
REACH = [22.5, 42.5, 62.5, 62.5]

CARDS = [
    ("images/og-image.jpg", "FINO", "Every team is running two operating systems"),
    ("images/og-circles.jpg", "Self-leadership Circles", "A shared language for teams under pressure"),
    ("images/og-coaching.jpg", "Leadership Coaching", "What is driving the decisions"),
    ("images/og-offsites.jpg", "Non-ordinary Offsites", "Somewhere the conference room cannot follow"),
    ("images/og-fractional.jpg", "Fractional Operations", "The hours your team is losing"),
    ("images/og-ai.jpg", "Self-led AI Integration", "AI that fits the work you actually do"),
    ("images/og-law-firms.jpg", "Operations for Law Firms", "You hired more people. The work still does not move."),
    ("images/og-studio.jpg", "FINO Studio", "A website that sounds like you"),
    ("images/og-about.jpg", "About FINO", "Il Futuro È Ora"),
]


def font(path, size):
    if not os.path.exists(path):
        sys.exit("missing font: %s\nsee the docstring, the brand fonts are not installed" % path)
    return ImageFont.truetype(path, size)


def wrap(draw, text, f, width):
    words, lines, line = text.split(), [], ""
    for w in words:
        trial = (line + " " + w).strip()
        if draw.textlength(trial, font=f) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def mark(draw, cx, cy, scale):
    """The four meetings, stepping forward, each one more certain than the last."""
    for i, (apex, reach) in enumerate(zip(APEX, REACH)):
        weight = int((2.0 + i * 0.9) * S)
        alpha = 0.42 + i * 0.19
        for direction, colour in ((-1, AMBER), (1, CORAL)):
            c = tuple(int(v * alpha + GROUND[k] * (1 - alpha)) for k, v in enumerate(colour))
            draw.line(
                [(cx + (apex - reach) * scale, cy + direction * reach * scale),
                 (cx + apex * scale, cy)],
                fill=c, width=weight, joint="curve")
    # the axis the meetings sit on, coral running into amber
    x0, x1 = cx + (APEX[0] - REACH[0] - 8) * scale, cx + (APEX[-1] + 10) * scale
    steps = 160
    for i in range(steps):
        t = i / (steps - 1.0)
        c = tuple(int(CORAL[k] + (AMBER[k] - CORAL[k]) * t) for k in range(3))
        c = tuple(int(v * 0.5 + GROUND[k] * 0.5) for k, v in enumerate(c))
        draw.line([(x0 + (x1 - x0) * t, cy), (x0 + (x1 - x0) * (t + 1.0 / steps), cy)],
                  fill=c, width=int(1.6 * S))


def card(path, label, line):
    im = Image.new("RGB", (W * S, H * S), GROUND)
    d = ImageDraw.Draw(im)

    f_label = font(MONO, 19 * S)
    f_line = font(DISPLAY, 62 * S)
    f_foot = font(MONO, 18 * S)

    pad = 84 * S
    col = 596 * S

    # the mark holds the right, clear of the text
    mark(d, 762 * S, 315 * S, 2.52 * S)

    y = pad + 6 * S
    d.text((pad, y), " ".join(label.upper()), font=f_label, fill=CORAL)

    lines = wrap(d, line, f_line, col)
    while len(lines) > 4:
        f_line = font(DISPLAY, f_line.size - 4 * S)
        lines = wrap(d, line, f_line, col)
    block = len(lines) * int(f_line.size * 1.22)
    y = (H * S - block) // 2
    for text in lines:
        d.text((pad, y), text, font=f_line, fill=INK)
        y += int(f_line.size * 1.22)

    foot = H * S - pad - 20 * S
    d.line([(pad, foot - 26 * S), (pad + 46 * S, foot - 26 * S)], fill=CORAL, width=int(2 * S))
    d.text((pad, foot), " ".join("fino.website".upper()), font=f_foot, fill=DIM)

    im = im.resize((W, H), Image.LANCZOS)
    im.save(path, "JPEG", quality=88, optimize=True, progressive=True)
    return os.path.getsize(path)


if __name__ == "__main__":
    for path, label, line in CARDS:
        size = card(path, label, line)
        print("%-28s %5.1f KB" % (path, size / 1024.0))
